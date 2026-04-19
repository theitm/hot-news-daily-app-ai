import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const maxDuration = 300; 

function splitText(text, maxLength = 2000) {
  const chunks = [];
  const paragraphs = text.split('\n');
  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;
    if (p.length <= maxLength) {
      chunks.push(p);
    } else {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      let current = '';
      for (let s of sentences) {
        s = s.trim();
        if (!s) continue;
        if ((current.length + s.length) <= maxLength) {
          current += (current ? ' ' : '') + s;
        } else {
          if (current) chunks.push(current);
          while (s.length > maxLength) {
            chunks.push(s.substring(0, maxLength));
            s = s.substring(maxLength);
          }
          current = s;
        }
      }
      if (current) chunks.push(current);
    }
  }
  
  const merged = [];
  let current = '';
  for (const c of chunks) {
    if (current.length + c.length + 1 <= maxLength) {
      current += (current ? '\n' : '') + c;
    } else {
      if (current) merged.push(current);
      current = c;
    }
  }
  if (current) merged.push(current);
  return merged;
}

export async function POST(req) {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const chunks = splitText(text, 2000);
    const tempFiles = [];
    const buffers = [];
    const tempDir = os.tmpdir();

    const tts = new EdgeTTS({
      voice,
      lang: voice.substring(0, 5),
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      timeout: 60000,
    });

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkTempFile = path.join(tempDir, `news_tts_${Date.now()}_${i}.mp3`);
        tempFiles.push(chunkTempFile);

        await tts.ttsPromise(chunk, chunkTempFile);
        const buf = await fs.readFile(chunkTempFile);
        buffers.push(buf);
      }

      const audioBuffer = Buffer.concat(buffers);

      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      });
    } finally {
      for (const file of tempFiles) {
        fs.unlink(file).catch(() => {});
      }
    }
  } catch (err) {
    console.error('TTS API Error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi khi tạo audio' }, { status: 500 });
  }
}
