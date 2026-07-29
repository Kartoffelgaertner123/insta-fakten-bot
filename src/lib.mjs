import crypto from 'node:crypto';

export const categories = [
  { key: 'tiere', name: 'Coole Tiere', color: '#062d3f', accent: '#65f3c1', terms: ['Axolotl', 'Komodowaran', 'Wombats', 'Nacktmull', 'Fangschreckenkrebse', 'Wanderfalke'] },
  { key: 'aktuell', name: 'Gerade relevant', color: '#182052', accent: '#ffcf4a', terms: ['Fußball-Weltmeisterschaft 2026', 'Olympische Winterspiele 2026', 'Artemis-Programm', 'Expo 2025'] },
  { key: 'natur', name: 'Naturwunder', color: '#123d2b', accent: '#b9ef5b', terms: ['Biolumineszenz', 'Mykorrhiza', 'Mangrove', 'Polarlicht', 'Korallenriff'] },
  { key: 'fortschritt', name: 'Gute Nachrichten', color: '#4a214f', accent: '#ff9fd8', terms: ['Erneuerbare Energie', 'Wiederaufforstung', 'Artenschutz', 'Montreal-Protokoll', 'Energiewende'] },
  { key: 'quiz', name: 'Wissens-Quiz', color: '#422006', accent: '#ffdf6c', terms: ['Axolotl', 'Blauwal', 'Kolibri', 'Polarlicht', 'Fangschreckenkrebse'] }
];

export function deterministicNumber(input) {
  return crypto.createHash('sha256').update(input).digest().readUInt32BE(0);
}
export function choose(items, seed) { return items[deterministicNumber(seed) % items.length]; }

const musicByCategory = {
  tiere: [
    { title: 'The Lion Sleeps Tonight', artist: 'The Tokens' },
    { title: 'Animals', artist: 'Maroon 5' },
    { title: 'Eye of the Tiger', artist: 'Survivor' }
  ],
  aktuell: [
    { title: 'The Final Countdown', artist: 'Europe' },
    { title: 'On Top of the World', artist: 'Imagine Dragons' },
    { title: 'Hall of Fame', artist: 'The Script feat. will.i.am' }
  ],
  natur: [
    { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
    { title: 'A Sky Full of Stars', artist: 'Coldplay' },
    { title: 'Earth Song', artist: 'Michael Jackson' }
  ],
  fortschritt: [
    { title: 'Good as Hell', artist: 'Lizzo' },
    { title: 'Beautiful Day', artist: 'U2' },
    { title: 'Here Comes the Sun', artist: 'The Beatles' }
  ],
  quiz: [
    { title: 'Mission: Impossible Theme', artist: 'Lalo Schifrin' },
    { title: 'Who Are You', artist: 'The Who' },
    { title: 'The Riddle', artist: 'Nik Kershaw' }
  ],
  wissen: [
    { title: 'Viva la Vida', artist: 'Coldplay' },
    { title: 'Adventure of a Lifetime', artist: 'Coldplay' },
    { title: 'Counting Stars', artist: 'OneRepublic' }
  ]
};

export function selectMusicSuggestion(title = '', category = '') {
  const normalized = `${title} ${category}`.toLowerCase();
  let key = Object.keys(musicByCategory).find(categoryKey => normalized.includes(categoryKey));
  if (/tier|animal|oktop|axolotl|wal|vogel|insekt/.test(normalized)) key = 'tiere';
  else if (/natur|erde|planet|mond|meer|ozean|polar|wald|korall/.test(normalized)) key = 'natur';
  else if (/quiz|rätsel|zufall|geheim|ungelöst/.test(normalized)) key = 'quiz';
  else if (/gut|fortschritt|energie|schutz|gerettet|erfolg/.test(normalized)) key = 'fortschritt';
  else if (/aktuell|release|film|spiel|weltmeister|olymp/.test(normalized)) key = 'aktuell';
  key ||= 'wissen';
  const track = choose(musicByCategory[key], `music-${title}-${category}`);
  return {
    ...track,
    searchQuery: `${track.title} ${track.artist}`,
    reason: `Automatisch passend zur Kategorie ${key} ausgewählt`,
    attachMode: 'instagram-manual-carousel'
  };
}
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
  const facts = sentences(page.extract)
    .filter(text => !/^(Als |Die |Der |Das ).{0,45}(bezeichnet|nennt man|ist eine Gruppe)/i.test(text))
    .filter(text => !/\b(In:|ISBN|doi|Band \d|Typusexemplar|wurde \d{4} beschrieben)\b/i.test(text))
    .sort((a, b) => interestingScore(b) - interestingScore(a));
  if (facts.length < 3) throw new Error('Der Quelltext enthält zu wenig verwendbare Sätze');
  const selected = facts.slice(0, 4).map(text => shorten(text, 125));
  if (category.key === 'quiz') {
    const answer = page.title;
    return [
      { eyebrow: 'QUIZ', title: 'Schaffst du dieses Rätsel?', text: selected[0], imageQuery: page.title },
      { eyebrow: 'ERST RATEN', title: 'A, B oder C?', text: `A: ${answer}\nB: Polarlicht\nC: Mammutbaum`, imageQuery: page.title },
      { eyebrow: 'DIE AUFLÖSUNG', title: answer, text: selected[1], imageQuery: page.title },
      { eyebrow: 'NOCH SCHLAUER', title: 'Darum ist das besonders', text: selected[2], imageQuery: page.title },
      { eyebrow: 'TÄGLICH NEUES WISSEN', title: 'Lust auf mehr?', text: 'Folge @taeglichschlauer und lerne jeden Tag etwas Neues. Teile das Quiz mit deinen Freunden!', imageQuery: page.title }
    ];
  }
  const hook = category.key === 'tiere' ? 'Dieses Tier ist völlig anders' : category.key === 'fortschritt' ? 'Endlich eine gute Nachricht!' : category.key === 'aktuell' ? 'Das solltest du jetzt wissen' : 'Die Natur kann Unglaubliches';
  const factTitles = ['Unglaublich, aber wahr', 'Das überrascht fast jeden', 'Noch verrückter', 'Ein Fakt zum Merken'];
  const slides = [
    { eyebrow: category.name.toUpperCase(), title: hook, text: `${page.title}: Wisch weiter – Fakt 3 überrascht dich garantiert.`, imageQuery: page.title },
    ...selected.map((text, index) => ({ eyebrow: `FAKT ${index + 1}`, title: factTitles[index], text, imageQuery: page.title })),
    { eyebrow: 'TÄGLICH NEUES WISSEN', title: 'Bleib neugierig!', text: 'Folge @taeglichschlauer und lerne jeden Tag etwas Neues. Speichere den Beitrag für später!', imageQuery: page.title }
  ];
  return slides.slice(0, 6);
}

function interestingScore(text) {
  let score = 0;
  if (/\d|Prozent|Meter|Kilometer|Jahr|Million/i.test(text)) score += 4;
  if (/kann|schafft|überlebt|schnell|größt|kleinst|einzig|besonders|erholt|gestiegen|gesunken/i.test(text)) score += 3;
  score -= Math.max(0, text.length - 180) / 40;
  return score;
}
