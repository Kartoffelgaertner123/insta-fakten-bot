import crypto from 'node:crypto';

export const categories = [
  { name: 'Wissenschaft', color: '#0b63f6', accent: '#dfff32', terms: ['Astronomie', 'Physik', 'Chemie', 'Forschung'] },
  { name: 'Natur', color: '#087f5b', accent: '#ffd43b', terms: ['Tier', 'Pflanze', 'Naturphänomen', 'Ökologie'] },
  { name: 'Geschichte', color: '#7b2cbf', accent: '#ffcb77', terms: ['Geschichte', 'Archäologie', 'Entdeckung', 'Kulturgeschichte'] },
  { name: 'Technik', color: '#005f73', accent: '#ee9b00', terms: ['Erfindung', 'Technik', 'Ingenieurwissenschaft', 'Computer'] },
  { name: 'Welt', color: '#d9480f', accent: '#fff3bf', terms: ['Geographie', 'Stadt', 'Land', 'Weltrekord'] }
];

export function deterministicNumber(input) {
  const digest = crypto.createHash('sha256').update(input).digest();
  return digest.readUInt32BE(0);
}

export function choose(items, seed) {
  return items[deterministicNumber(seed) % items.length];
}

export function stripMarkup(text = '') {
  return text
    .replace(/\([^)]{0,80}\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\[[^\]]+\]/g, '')
    .trim();
}

export function firstUsefulSentences(text, max = 300) {
  const clean = stripMarkup(text);
  const parts = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let result = '';
  for (const part of parts) {
    if ((result + part).trim().length > max && result) break;
    result = `${result} ${part}`.trim();
    if (result.length >= 120) break;
  }
  if (result.length > max) result = `${result.slice(0, max - 1).trim()}…`;
  return result;
}

export function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function escapeXml(value = '') {
  return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
}

export function slotFromEnvironment(now = new Date()) {
  const explicit = Number(process.env.SLOT || process.argv.find(a => a.startsWith('--slot='))?.split('=')[1]);
  if (Number.isInteger(explicit) && explicit >= 1 && explicit <= 5) return explicit;
  const hours = [7, 10, 13, 16, 19];
  const hour = now.getUTCHours();
  let best = 0;
  for (let i = 1; i < hours.length; i += 1) {
    if (Math.abs(hours[i] - hour) < Math.abs(hours[best] - hour)) best = i;
  }
  return best + 1;
}
