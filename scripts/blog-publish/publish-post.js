// Publishes a reviewed blog article (content/<slug>.html + content/<slug>.hero.jpg)
// to the live Sanity dataset. The .html files are the canonical, approved source
// (spot links + gear sections included) — not the original docs/blog-articles/*.md
// drafts, which predate those edits.
//
// Usage: node publish-post.js <slug> <alt-text> [--featured] [--dry-run]

const fs = require('fs');
const path = require('path');

(function loadEnv(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
})(path.join(__dirname, '..', '..', '.env.local'));

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const TOKEN = process.env.SANITY_API_WRITE_TOKEN;

const REVIEW_DIR = path.join(__dirname, 'content');
const OPT_DIR = REVIEW_DIR;

const CATEGORY_MAP = {
  'Surf Destinations': '03baaf9f-4973-4f53-abc4-4597a3c6ea1e',
  'Surf Travel': '313fdc05-f816-4053-8acd-3f9722d0ae72',
};
const AUTHOR_ID = '14024e27-f061-4b13-ba81-003d21e284c1'; // Kevin McCalley

function randKey(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Parse a text-node's inline <a href="...">text</a> markup into spans + markDefs.
function parseInlineHtml(html) {
  const spans = [];
  const markDefs = [];
  const linkRe = /<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gs;
  let lastIndex = 0;
  let m;
  const parts = [];
  while ((m = linkRe.exec(html)) !== null) {
    if (m.index > lastIndex) parts.push({ type: 'text', text: html.slice(lastIndex, m.index) });
    parts.push({ type: 'link', text: m[2], href: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < html.length) parts.push({ type: 'text', text: html.slice(lastIndex) });
  if (parts.length === 0) parts.push({ type: 'text', text: html });

  for (const part of parts) {
    const cleanText = decodeEntities(part.text);
    if (part.type === 'link') {
      const key = randKey();
      markDefs.push({ _type: 'link', _key: key, href: part.href });
      spans.push({ _type: 'span', _key: randKey(), text: cleanText, marks: [key] });
    } else if (cleanText.length > 0) {
      spans.push({ _type: 'span', _key: randKey(), text: cleanText, marks: [] });
    }
  }
  return { spans, markDefs };
}

function htmlToBlocks(bodyHtml) {
  const blocks = [];
  // Tokenize into top-level tags: h3, h4, p, ul(with li's)
  const tagRe = /<(h3|h4|p)>([\s\S]*?)<\/\1>|<ul>([\s\S]*?)<\/ul>/g;
  let m;
  while ((m = tagRe.exec(bodyHtml)) !== null) {
    if (m[1] === 'h3' || m[1] === 'h4') {
      const { spans, markDefs } = parseInlineHtml(m[2].trim());
      blocks.push({ _type: 'block', _key: randKey(), style: m[1], markDefs, children: spans });
    } else if (m[1] === 'p') {
      const { spans, markDefs } = parseInlineHtml(m[2].trim());
      if (spans.length) blocks.push({ _type: 'block', _key: randKey(), style: 'normal', markDefs, children: spans });
    } else if (m[3] !== undefined) {
      const liRe = /<li>([\s\S]*?)<\/li>/g;
      let li;
      while ((li = liRe.exec(m[3])) !== null) {
        const { spans, markDefs } = parseInlineHtml(li[1].trim());
        blocks.push({ _type: 'block', _key: randKey(), style: 'normal', listItem: 'bullet', level: 1, markDefs, children: spans });
      }
    }
  }
  return blocks;
}

function parseMeta(html) {
  const m = html.match(/<!--\s*Title:\s*(.*?)\s*\|\s*Excerpt:\s*(.*?)\s*\|\s*~?(\d+)\s*words\s*\|\s*isHowTo:\s*(true|false)\s*\|\s*categories:\s*(.*?)\s*\|\s*surfSpots:\s*(.*?)\s*-->/s);
  if (!m) throw new Error('Could not parse metadata header');
  return {
    title: m[1].trim(),
    excerpt: m[2].trim(),
    isHowTo: m[4].trim() === 'true',
    categories: m[5].trim().split(',').map(s => s.trim()).filter(Boolean),
    surfSpots: m[6].trim().split(',').map(s => s.trim()).filter(Boolean),
  };
}

function parseArticle(slug) {
  const html = fs.readFileSync(path.join(REVIEW_DIR, slug + '.html'), 'utf8');
  const meta = parseMeta(html);
  const body = html.replace(/<!--[\s\S]*?-->/, '').trim();
  const blocks = htmlToBlocks(body);
  const categories = meta.categories.map(name => {
    const id = CATEGORY_MAP[name];
    if (!id) { console.error('WARN: no category mapping for', name); return null; }
    return { _type: 'reference', _key: randKey(), _ref: id };
  }).filter(Boolean);
  return { slug, title: meta.title, excerpt: meta.excerpt, isHowTo: meta.isHowTo, surfSpots: meta.surfSpots, categories, body: blocks };
}

async function uploadImage(imagePath) {
  const buf = fs.readFileSync(imagePath);
  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'image/jpeg' },
    body: buf,
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Image upload failed: ' + JSON.stringify(data));
  return data.document._id;
}

async function main() {
  const [slug, altText, ...flags] = process.argv.slice(2);
  const featured = flags.includes('--featured');
  const dryRun = flags.includes('--dry-run');

  if (!slug || !altText) {
    console.error('Usage: node publish-post-v2.js <slug> <alt-text> [--featured] [--dry-run]');
    process.exit(1);
  }

  const parsed = parseArticle(slug);
  console.log('Parsed:', parsed.title, '->', parsed.slug, `(${parsed.body.length} blocks, ${parsed.categories.length} categories, ${parsed.surfSpots.length} spots)`);
  const linkCount = parsed.body.reduce((n, b) => n + (b.markDefs ? b.markDefs.length : 0), 0);
  console.log('Spot links in body:', linkCount);

  if (dryRun) return;

  console.log('Uploading cover image...');
  const heroPath = path.join(OPT_DIR, slug + '.hero.jpg');
  const assetId = await uploadImage(heroPath);
  console.log('Asset uploaded:', assetId);

  const doc = {
    _id: 'post-' + parsed.slug,
    _type: 'post',
    title: parsed.title,
    slug: { _type: 'slug', current: parsed.slug },
    excerpt: parsed.excerpt,
    coverImage: { _type: 'image', asset: { _type: 'reference', _ref: assetId }, alt: altText },
    author: { _type: 'reference', _ref: AUTHOR_ID },
    categories: parsed.categories,
    body: parsed.body,
    isHowTo: parsed.isHowTo,
    surfSpots: parsed.surfSpots,
    publishedAt: new Date().toISOString(),
    featured: !!featured,
  };

  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations: [{ createOrReplace: doc }] }),
  });
  const result = await res.json();
  if (!res.ok) {
    console.error('MUTATION FAILED:', JSON.stringify(result, null, 2));
    appendLog({ slug: parsed.slug, title: parsed.title, status: 'failed', error: JSON.stringify(result), at: new Date().toISOString() });
    process.exit(1);
  }
  console.log('Published:', JSON.stringify(result, null, 2));
  console.log('Live at: https://groundswell.surf/blog/' + parsed.slug);
  appendLog({ slug: parsed.slug, title: parsed.title, status: 'published', featured: !!featured, publishedAt: doc.publishedAt });
}

function appendLog(entry) {
  const logPath = path.join(__dirname, 'publish-log.json');
  let log = [];
  try { log = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch (e) {}
  log.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
