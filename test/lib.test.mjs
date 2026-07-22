import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSlides, choose, shorten, slotFromEnvironment, wrapText } from '../src/lib.mjs';

test('Auswahl ist reproduzierbar', () => {
  assert.equal(choose(['a', 'b', 'c'], 'tag-1'), choose(['a', 'b', 'c'], 'tag-1'));
});

test('Text wird ohne Wortverlust umgebrochen', () => {
  const text = 'Das ist ein kurzer deutscher Beispielsatz';
  assert.equal(wrapText(text, 12).join(' '), text);
});

test('Faktentext wird begrenzt', () => {
  const result = shorten('Erster interessanter Satz mit vielen zusätzlichen Wörtern für den Test.', 45);
  assert.ok(result.length <= 45);
});

test('Normale Beiträge haben mindestens vier Seiten', () => {
  const page = { title: 'Axolotl', extract: 'Der Axolotl lebt im Wasser und ist ein Schwanzlurch. Er kann verletzte Körperteile außergewöhnlich gut regenerieren. Das Tier stammt ursprünglich aus Seen in Mexiko. Sein natürlicher Lebensraum ist heute stark bedroht.' };
  const slides = buildSlides(page, { key: 'tiere', name: 'Coole Tiere' });
  assert.ok(slides.length >= 4);
});

test('Quiz zeigt die Auflösung nicht auf der ersten Seite', () => {
  const page = { title: 'Axolotl', extract: 'Der Axolotl lebt dauerhaft im Wasser und ist ein Schwanzlurch. Er kann Körperteile außergewöhnlich gut regenerieren. Das Tier stammt ursprünglich aus Seen in Mexiko.' };
  const slides = buildSlides(page, { key: 'quiz', name: 'Quiz' });
  assert.equal(slides.length, 4);
  assert.doesNotMatch(slides[0].title, /Axolotl/i);
  assert.match(slides[2].title, /Axolotl/i);
});

test('Zeit wird dem nächsten Slot zugeordnet', () => {
  delete process.env.SLOT;
  assert.equal(slotFromEnvironment(new Date('2026-07-22T13:01:00Z')), 3);
});
