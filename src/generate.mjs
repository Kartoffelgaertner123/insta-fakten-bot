import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { categories, choose, deterministicNumber, escapeXml, firstUsefulSentences, slotFromEnvironment, wrapText } from './lib.mjs';

const slot = slotFromEnvironment();
const date = process.env.POST_DATE || new Date().toISOString().slice(0, 10);
const seed = `${date}-${slot}`;
const category = categories[(slot - 1) % categories.length];
const term = choose(category.terms, `${seed}-term`);

async function fetchCandidates() {
  const offset = deterministicNumber(seed) % 500;
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search',
    gsrsearch: term, gsrnamespace: '0', gsrlimit: '20', gsroffset: String(offset),
    prop: 'extracts|info', exintro: '1', explaintext: '1', exsectionformat: 'plain', inprop: 'url'
  });
  let response = await fetch(`https://de.wikipedia.org/w/api.php?${params}`, { headers: { 'user-agent': 'TaeglichSchlauerBot/1.0' } });
  if (!response.ok && offset > 0) {
    params.set('gsroffset', '0');
    response = await fetch(`https://de.wikipedia.org/w/api.php?${params}`, { headers: { 'user-agent': 'TaeglichSchlauerBot/1.0' } });
  }
  if (!response.ok) throw new Error(`Wikipedia antwortete mit ${response.status}`);
  const data = await response.json();
  return Object.values(data.query?.pages || {});
}

function selectFact(pages) {
  const usable = pages.filter(page => {
    const title = page.title || '';
    const extract = page.extract || '';
    return extract.length >= 180 && extract.length <= 4000 && !title.includes('Liste') && !title.includes('Begriffsklärung');
  });
  if (!usable.length) throw new Error('Keinen geeigneten Wikipedia-Artikel gefunden');
  const page = choose(usable, `${seed}-page`);
  return {
    title: page.title,
    fact: firstUsefulSentences(page.extract, 320),
    sourceUrl: page.fullurl,
    category: category.name
  };
}

function makeSvg(post) {
  const titleLines = wrapText(post.title, 24).slice(0, 3);
  const factLines = wrapText(post.fact, 42).slice(0, 9);
  const titleSize = titleLines.length > 2 ? 70 : 82;
  const title = titleLines.map((line, i) => `<tspan x="86" dy="${i ? titleSize * 1.08 : 0}">${escapeXml(line)}</tspan>`).join('');
  const factY = 470 + titleLines.length * titleSize * 0.9;
  const fact = factLines.map((line, i) => `<tspan x="86" dy="${i ? 61 : 0}">${escapeXml(line)}</tspan>`).join('');
  return `
  <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1350" fill="${category.color}"/>
    <circle cx="960" cy="90" r="260" fill="${category.accent}" opacity=".16"/>
    <circle cx="70" cy="1280" r="230" fill="#ffffff" opacity=".08"/>
    <rect x="70" y="65" width="410" height="72" rx="36" fill="${category.accent}"/>
    <text x="275" y="113" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" fill="#101828" letter-spacing="2">TÄGLICH SCHLAUER</text>
    <text x="86" y="245" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" fill="${category.accent}" letter-spacing="3">${escapeXml(post.category.toUpperCase())}</text>
    <text x="86" y="355" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${title}</text>
    <line x1="86" y1="${factY - 65}" x2="994" y2="${factY - 65}" stroke="${category.accent}" stroke-width="8"/>
    <text x="86" y="${factY}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="500" fill="#ffffff">${fact}</text>
    <text x="86" y="1262" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" fill="${category.accent}">WISSEN, DAS HÄNGEN BLEIBT.</text>
    <text x="995" y="1262" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff">${slot}/5</text>
  </svg>`;
}

const post = selectFact(await fetchCandidates());
const relativeImage = `public/${date}-${slot}.jpg`;
await fs.mkdir(path.dirname(relativeImage), { recursive: true });
await sharp(Buffer.from(makeSvg(post))).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(relativeImage);

const caption = `🧠 Wusstest du das?\n\n${post.fact}\n\nQuelle: Wikipedia – ${post.sourceUrl}\n\n#taeglichschlauer #wissen #fakten #allgemeinwissen #wissenswert #${post.category.toLowerCase()}`;
await fs.writeFile('post.json', JSON.stringify({ ...post, caption, relativeImage, date, slot }, null, 2));
console.log(`Erstellt: ${relativeImage} – ${post.title}`);
