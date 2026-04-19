import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Tin-Tuc-Moi-Bot' },
});

const FEED_SOURCES = [
  { id: 'vnexpress-top', name: 'VNExpress', url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', icon: '📰', color: '#9f224e' },
  { id: 'tuoitre-top', name: 'Tuổi Trẻ', url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', icon: '🗞️', color: '#e31d1a' },
  { id: 'techcrunch-ai', name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', icon: '⚡', color: '#00d084' },
  { id: 'the-verge-ai', name: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', icon: '◈', color: '#fa4d56' },
  { id: 'google-ai', name: 'Google AI', url: 'https://blog.google/technology/ai/rss', icon: '🧠', color: '#42be65' },
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620712943543-bcc4628c6757?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1684369175833-31f776672fc1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop'
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('source');

  const sourcesToFetch = sourceId 
    ? FEED_SOURCES.filter(s => s.id === sourceId)
    : FEED_SOURCES;

  try {
    const results = await Promise.allSettled(
      sourcesToFetch.map(async (source) => {
        const feed = await parser.parseURL(source.url);
        return feed.items.map(item => {
          const id = item.guid || item.link;
          let thumbnail = extractThumbnail(item);
          
          if (!thumbnail) {
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            thumbnail = FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
          }

          return {
            id,
            title: item.title,
            link: item.link,
            description: (item.contentSnippet || item.content || '').replace(/<[^>]*>?/gm, '').slice(0, 500),
            pubDate: item.pubDate,
            thumbnail,
            sourceId: source.id,
            sourceName: source.name,
            sourceColor: source.color,
            sourceIcon: source.icon
          };
        });
      })
    );

    let allArticles = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });

    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    return NextResponse.json(allArticles.slice(0, 80));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function extractThumbnail(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  const media = item['media:content'] || item['media:group']?.['media:content'];
  if (media) {
    if (Array.isArray(media) && media.length > 0) return media[0].$.url;
    if (media.$ && media.$.url) return media.$.url;
  }

  const searchIn = (item.content || '') + (item.description || '') + (item.contentSnippet || '');
  const match = searchIn.match(/<img[^>]+src="([^">]+)"/i);
  if (match) return match[1];

  return null;
}
