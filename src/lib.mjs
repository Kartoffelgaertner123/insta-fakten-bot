import crypto from 'node:crypto';

export const categories = [
  { key: 'tiere', name: 'Coole Tiere', color: '#062d3f', accent: '#65f3c1', terms: ['Axolotl', 'Blaugeringelte Kraken', 'Wombats', 'Nacktmull', 'Fangschreckenkrebse', 'Wanderfalke'] },
  { key: 'aktuell', name: 'Gerade relevant', color: '#182052', accent: '#ffcf4a', terms: ['Fußball-Weltmeisterschaft 2026', 'Olympische Spiele', 'Weltraumforschung 2026', 'Klimaschutz aktuell'] },
  { key: 'natur', name: 'Naturwunder', color: '#123d2b', accent: '#b9ef5b', terms: ['Biolumineszenz Natur', 'Mykorrhiza Natur', 'Mangrove Natur', 'Polarlicht Natur', 'Korallenriff Natur'] },
  { key: 'fortschritt', name: 'Gute Nachrichten', color: '#4a214f', accent: '#ff9fd8', terms: ['Erneuerbare Energien Land', 'Wiederaufforstung Erfolg', 'Artenschutz Erfolg', 'Ozonloch Erholung', 'Energiewende Land'] },
  { key: 'quiz', name: 'Wissens-Quiz', color: '#422006', accent: '#ffdf6c', terms: ['Tierrekord', 'Naturphänomen', 'Weltrekord Tier', 'ungewöhnliches Tier'] }
];

export function deterministicNumber(input) {
  return crypto.createHash('sha256').update(input).digest().readUInt32BE(0);
}
export function choose(items, seed) { return items[deterministicNumber(seed) % items.length]; }
export function stripMarkup(text = '') {
  return text.replace(/\([^)]{0,80}\)/g, '').replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim();
}
export function sentences(text = '') { return (stripMarkup(text).match(/[^.!?]+[.!?]+/g) || [stripMarkup(text)]).map(value => value.trim()).filter(value => value.length > 35); }
export function shorten(text, max = 220) { const clean = stripMarkup(text); return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`; }
export function wrapText(text, maxChars) {
  const lines = []; let line = '';
  for (const word of String(text).split(/\s+/)) { const next = line ? `${line} ${word}` : word; if (next.length > maxChars && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); return lines;
}
export function escapeXml(value = '') { return String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]); }
export function slotFromEnvironment(now = new Date()) {
  const explicit = Number(process.env.SLOT || process.argv.find(a => a.startsWith('--slot='))?.split('=')[1]);
  if (Number.isInteger(explicit) && explicit >= 1 && explicit <= 5) return explicit;
  const hours = [7, 10, 13, 16, 19]; const hour = now.getUTCHours(); let best = 0;
  for (let i = 1; i < hours.length; i += 1) if (Math.abs(hours[i] - hour) < Math.abs(hours[best] - hour)) best = i;
  return best + 1;
}

export function buildSlides(page, category) {
  const facts = sentences(page.extract);
  if (facts.length < 3) throw new Error('Der Quelltext enthält zu wenig verwendbare Sätze');
  const selected = facts.slice(0, 5).map(text => shorten(text, 230));
  if (category.key === 'quiz') {
    const answer = page.title;
    return [
      { eyebrow: 'QUIZ', title: 'Was glaubst du?', text: `Welcher Begriff oder welches Lebewesen passt zu diesem Hinweis? ${selected[0]}`, imageQuery: page.title },
      { eyebrow: 'ERST RATEN', title: 'A, B oder C?', text: `A: ${answer}\nB: Polarlicht\nC: Mammutbaum`, imageQuery: 'Fragezeichen Natur' },
      { eyebrow: 'DIE AUFLÖSUNG', title: answer, text: selected[1], imageQuery: page.title },
      { eyebrow: 'NOCH SCHLAUER', title: 'Darum ist das besonders', text: selected[2], imageQuery: page.title }
    ];
  }
  const slides = [
    { eyebrow: category.name.toUpperCase(), title: page.title, text: 'Wische weiter und entdecke vier erstaunliche Fakten.', imageQuery: page.title },
    ...selected.slice(0, Math.max(3, Math.min(5, selected.length))).map((text, index) => ({ eyebrow: `FAKT ${index + 1}`, title: index === 0 ? 'Schon gewusst?' : index === selected.length - 1 ? 'Das macht Hoffnung' : 'Noch erstaunlicher', text, imageQuery: `${page.title} ${index + 1}` }))
  ];
  return slides.slice(0, 6);
}
