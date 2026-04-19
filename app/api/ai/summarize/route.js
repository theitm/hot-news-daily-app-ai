import { NextResponse } from 'next/server';

const AI_API_URL = process.env.AI_API_URL || 'https://platform.beeknoee.com/api/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'qwen-3-235b-a22b-instruct-2507';

const SYSTEM_PROMPT = `Bạn là một biên tập viên tin tức thông minh. Nhiệm vụ của bạn là tóm tắt nội dung bài báo sau đây một cách ngắn gọn, súc tích và hấp dẫn bằng tiếng Việt.
YÊU CẦU:
1. Tóm tắt trong khoảng 3-5 gạch đầu dòng quan trọng nhất.
2. Ngôn ngữ: Tiếng Việt.
3. Phong cách: Chuyên nghiệp, khách quan.
4. Đầu ra: Chỉ trả về nội dung tóm tắt, không chào hỏi hay giải thích thêm.`;

export async function POST(request) {
  try {
    const { text, title, config } = await request.json();
    
    // Use config from client if provided, otherwise fallback to env
    const apiKey = config?.apiKey || AI_API_KEY;
    const model = config?.model || AI_MODEL;
    const apiUrl = config?.apiUrl || AI_API_URL;

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Nội dung quá ngắn để tóm tắt.' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình API Key cho AI.' }, { status: 400 });
    }

    const contentToSummarize = `Tiêu đề: ${title}\n\nNội dung: ${text}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: `${SYSTEM_PROMPT}\n\n${contentToSummarize}` }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `AI API error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json({ error: 'AI không trả về kết quả.' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
