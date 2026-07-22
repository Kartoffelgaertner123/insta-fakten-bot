import fs from 'node:fs/promises';
const token = process.env.INSTAGRAM_ACCESS_TOKEN; const userId = process.env.INSTAGRAM_USER_ID; const repository = process.env.GITHUB_REPOSITORY; const commit = process.env.IMAGE_COMMIT_SHA; const version = process.env.INSTAGRAM_API_VERSION || 'v25.0';
if (!token || !userId || !repository || !commit) throw new Error('Instagram- oder GitHub-Umgebungsvariablen fehlen');
const post = JSON.parse(await fs.readFile('post.json', 'utf8')); const base = `https://graph.instagram.com/${version}`;
async function graph(endpoint, method = 'GET', values = {}) { const params = new URLSearchParams({ ...values, access_token: token }); const response = await fetch(`${base}/${endpoint}${method === 'GET' ? `?${params}` : ''}`, method === 'GET' ? {} : { method, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params }); const body = await response.json(); if (!response.ok || body.error) throw new Error(`Instagram API: ${JSON.stringify(body.error || body)}`); return body; }
async function waitFor(id) { for (let attempt = 0; attempt < 24; attempt += 1) { const status = await graph(id, 'GET', { fields: 'status_code,status' }); if (status.status_code === 'FINISHED') return; if (['ERROR', 'EXPIRED'].includes(status.status_code)) throw new Error(`Mediencontainer: ${status.status}`); await new Promise(resolve => setTimeout(resolve, 5000)); } throw new Error('Instagram hat den Mediencontainer nicht rechtzeitig verarbeitet'); }
const imageUrls = post.relativeImages.map(file => `https://raw.githubusercontent.com/${repository}/${commit}/${file}`);
for (const url of imageUrls) { const check = await fetch(url); if (!check.ok) throw new Error(`Bild nicht öffentlich erreichbar (${check.status}): ${url}`); }
const children = [];
for (const image_url of imageUrls) { const child = await graph(`${userId}/media`, 'POST', { image_url, is_carousel_item: 'true' }); await waitFor(child.id); children.push(child.id); }
const carousel = await graph(`${userId}/media`, 'POST', { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption }); await waitFor(carousel.id);
const published = await graph(`${userId}/media_publish`, 'POST', { creation_id: carousel.id });
console.log(`Instagram-Karussell veröffentlicht: ${published.id}`);
await fs.writeFile('published.json', JSON.stringify({ ...post, instagramMediaId: published.id, imageUrls, publishedAt: new Date().toISOString() }, null, 2));
