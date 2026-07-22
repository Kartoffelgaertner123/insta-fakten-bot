import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { buildSlides, categories, choose, deterministicNumber, escapeXml, slotFromEnvironment, wrapText } from './lib.mjs';

const slot = slotFromEnvironment();
const date = process.env.POST_DATE || new Date().toISOString().slice(0, 10);
const seed = `${date}-${slot}`;
const category = categories[(slot - 1) % categories.length];
const term = choose(category.terms, `${seed}-term`);
const headers = { 'user-agent': 'TaeglichSchlauerBot/2.0 (Instagram Wissensprojekt)' };

async function wikipediaArticle() {
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: term, gsrnamespace: '0', gsrlimit: '12', prop: 'extracts|info|pageimages', explaintext: '1', exsectionformat: 'plain', inprop: 'url', pithumbsize: '1600' });
  const response = await fetch(`https://de.wikipedia.org/w/api.php?${params}`, { headers });
  if (!response.ok) throw new Error(`Wikipedia antwortete mit ${response.status}`);
  const pages = Object.values((await response.json()).query?.pages || {}).filter(page => page.extract?.length > 500 && !page.title.includes('Liste') && !page.title.includes('Begriffsklärung')).sort((a, b) => (a.index || 999) - (b.index || 999));
  if (!pages.length) throw new Error('Keine geeignete, belegte Quelle gefunden');
  return pages[0];
}

async function commonsImage(query, index, fallback) {
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '12', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1400' });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers });
  if (!response.ok) return fallback;
  const files = Object.values((await response.json()).query?.pages || {}).filter(file => /\.(jpe?g|png)$/i.test(file.title) && file.imageinfo?.[0]?.thumburl);
  if (!files.length) return fallback;
  const file = choose(files, `${seed}-image-${index}`); const info = file.imageinfo[0];
  const author = String(info.extmetadata?.Artist?.value || 'Wikimedia Commons').replace(/<[^>]+>/g, '').slice(0, 100);
  return { url: info.thumburl, pageUrl: info.descriptionurl, author, title: file.title.replace(/^File:/, '') };
}

function svg(slide, pageNumber, total, hasPhoto) {
  const titleLines = wrapText(slide.title, 22).slice(0, 3); const textLines = wrapText(slide.text, 38).slice(0, 8);
  const titleSize = titleLines.length > 2 ? 67 : 76;
  const title = titleLines.map((line, i) => `<tspan x="74" dy="${i ? titleSize * 1.06 : 0}">${escapeXml(line)}</tspan>`).join('');
  const textY = 735 + (titleLines.length - 1) * 62;
  const body = textLines.map((line, i) => `<tspan x="74" dy="${i ? 53 : 0}">${escapeXml(line)}</tspan>`).join('');
  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${hasPhoto ? '.15' : '0'}"/><stop offset=".42" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="${category.color}" stop-opacity=".98"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="${category.color}" opacity="${hasPhoto ? '.18' : '1'}"/><rect width="1080" height="1350" fill="url(#shade)"/>
    <rect x="58" y="55" width="388" height="66" rx="33" fill="${category.accent}"/><text x="252" y="99" text-anchor="middle" font-family="Arial" font-size="28" font-weight="800" fill="#101828" letter-spacing="2">TÄGLICH SCHLAUER</text>
    <text x="74" y="510" font-family="Arial" font-size="28" font-weight="800" fill="${category.accent}" letter-spacing="3">${escapeXml(slide.eyebrow)}</text>
    <text x="74" y="610" font-family="Arial" font-size="${titleSize}" font-weight="800" fill="#fff">${title}</text>
    <rect x="74" y="${textY - 62}" width="190" height="8" rx="4" fill="${category.accent}"/><text x="74" y="${textY}" font-family="Arial" font-size="40" font-weight="600" fill="#fff">${body}</text>
    <text x="74" y="1270" font-family="Arial" font-size="27" font-weight="700" fill="${category.accent}">WISCHEN →</text><text x="1000" y="1270" text-anchor="end" font-family="Arial" font-size="27" fill="#fff">${pageNumber}/${total}</text>
  </svg>`;
}

const article = await wikipediaArticle();
const slides = buildSlides(article, category);
const directory = `public/${date}-${slot}`; await fs.mkdir(directory, { recursive: true });
const attributions = [];
for (let index = 0; index < slides.length; index += 1) {
  const fallback = article.thumbnail?.source ? { url: article.thumbnail.source, pageUrl: article.fullurl, author: 'Wikipedia/Wikimedia Commons', title: article.title } : null;
  const credit = await commonsImage(slides[index].imageQuery, index, fallback);
  let image = sharp({ create: { width: 1080, height: 1350, channels: 3, background: category.color } });
  if (credit) {
    const response = await fetch(credit.url, { headers });
    if (response.ok) image = sharp(Buffer.from(await response.arrayBuffer())).resize(1080, 1350, { fit: 'cover' });
    attributions.push(credit);
  }
  await image.composite([{ input: Buffer.from(svg(slides[index], index + 1, slides.length, Boolean(credit))) }]).jpeg({ quality: 91 }).toFile(`${directory}/${index + 1}.jpg`);
}
const relativeImages = slides.map((_, index) => `${directory}/${index + 1}.jpg`);
const caption = `🧠 ${article.title}\n\n${slides[1]?.text || slides[0].text}\n\n👉 Wische durch alle ${slides.length} Seiten.\n💬 Was hat dich am meisten überrascht?\n\nFaktenquelle: Wikipedia – ${article.fullurl}\nBildquellen: Wikimedia Commons (Links im Beitragsarchiv)\n\n#taeglichschlauer #wissen #fakten #${category.key} #quiz #natur`;
await fs.writeFile('post.json', JSON.stringify({ title: article.title, category: category.name, sourceUrl: article.fullurl, caption, slides, relativeImages, imageCredits: attributions, date, slot }, null, 2));
console.log(`Karussell erstellt: ${relativeImages.length} Seiten – ${article.title}`);
