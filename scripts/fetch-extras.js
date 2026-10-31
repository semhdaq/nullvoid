// scripts/fetch-extras.js
// data/news.json'dan RSS (feed.xml) üretir ve takip edilen araçların son sürümlerini
// data/versions.json'a yazar. fetch-news.js'ten SONRA çalışır (Node 20: global fetch).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const SITE = 'https://semhdaq.github.io/nullvoid/';

// Takip edilecek depolar: buraya kendi araçlarını ekleyebilirsin.
const REPOS = [
  ['Ollama', 'ollama/ollama'],
  ['llama.cpp', 'ggml-org/llama.cpp'],
  ['VS Code', 'microsoft/vscode'],
  ['Vite', 'vitejs/vite'],
  ['Deno', 'denoland/deno'],
];

const xml = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildFeed() {
  const p = path.join(root, 'data', 'news.json');
  const news = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const when = new Date(news.generated_at || Date.now()).toUTCString();
  const items = [];
  for (const cat of ['ai', 'kod', 'arac']) {
    for (const it of (news.categories && news.categories[cat]) || []) {
      if (!/^https?:\/\//.test(it.url || '')) continue;
      items.push(`    <item>
      <title>${xml(it.title)}</title>
      <link>${xml(it.url)}</link>
      <guid isPermaLink="true">${xml(it.url)}</guid>
      <category>${cat}</category>
      <source url="${xml(SITE)}">${xml(it.source)}</source>
      <description>${xml(it.desc)}</description>
      <pubDate>${when}</pubDate>
    </item>`);
    }
  }
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>NullVoid — AI ve yazılım haber panosu</title>
    <link>${SITE}</link>
    <description>AI, yazılım ve geliştirici araçları gündemi.</description>
    <language>tr</language>
    <lastBuildDate>${when}</lastBuildDate>
${items.slice(0, 40).join('\n')}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(root, 'feed.xml'), feed, 'utf-8');
  console.log('feed.xml:', items.length, 'öğe');
}

async function buildVersions() {
  const headers = { 'User-Agent': 'nullvoid-bot', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  const out = [];
  for (const [name, repo] of REPOS) {
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      out.push({ name, tag: j.tag_name, date: (j.published_at || '').slice(0, 10), url: j.html_url });
    } catch (e) { console.warn('sürüm alınamadı:', name, e.message); }
  }
  if (!out.length) return console.warn('Hiç sürüm alınamadı; versions.json değişmedi.');
  fs.writeFileSync(path.join(root, 'data', 'versions.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), items: out }, null, 2), 'utf-8');
  console.log('versions.json:', out.length, 'araç');
}

(async () => { buildFeed(); await buildVersions(); })().catch(e => { console.error(e); process.exit(1); });
