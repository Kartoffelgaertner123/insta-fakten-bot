import fs from 'node:fs/promises';

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const userId = process.env.INSTAGRAM_USER_ID;
const repository = process.env.GITHUB_REPOSITORY;
const commit = process.env.IMAGE_COMMIT_SHA;
const version = process.env.INSTAGRAM_API_VERSION || 'v25.0';
if (!token || !userId || !repository || !commit) throw new Error('Instagram- oder GitHub-Umgebungsvariablen fehlen');

const post = JSON.parse(await fs.readFile('post.json', 'utf8'));
const imageUrl = `https://raw.githubusercontent.com/${repository}/${commit}/${post.relativeImage}`;
const base = `https://graph.instagram.com/${version}`;

async function graph(path, method = 'GET', values = {}) {
  const params = new URLSearchParams({ ...values, access_token: token });
  const url = `${base}/${path}${method === 'GET' ? `?${params}` : ''}`;
  const response = await fetch(url, method === 'GET' ? {} : { method, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(`Instagram API: ${JSON.stringify(body.error || body)}`);
  return body;
}

const imageCheck = await fetch(imageUrl);
if (!imageCheck.ok) throw new Error(`Bild ist nicht öffentlich erreichbar (${imageCheck.status}). Ist das Repository öffentlich?`);

const container = await graph(`${userId}/media`, 'POST', { image_url: imageUrl, caption: post.caption });
for (let attempt = 0; attempt < 12; attempt += 1) {
  const status = await graph(`${container.id}`, 'GET', { fields: 'status_code,status' });
  if (status.status_code === 'FINISHED') break;
  if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') throw new Error(`Mediencontainer: ${status.status}`);
  await new Promise(resolve => setTimeout(resolve, 5000));
}
const published = await graph(`${userId}/media_publish`, 'POST', { creation_id: container.id });
console.log(`Instagram-Beitrag veröffentlicht: ${published.id}`);
await fs.writeFile('published.json', JSON.stringify({ ...post, instagramMediaId: published.id, imageUrl, publishedAt: new Date().toISOString() }, null, 2));
