import test from 'node:test';
import assert from 'node:assert/strict';
import { choose, firstUsefulSentences, slotFromEnvironment, wrapText } from '../src/lib.mjs';

test('Auswahl ist reproduzierbar', () => {
  assert.equal(choose(['a', 'b', 'c'], 'tag-1'), choose(['a', 'b', 'c'], 'tag-1'));
});

test('Text wird ohne Wortverlust umgebrochen', () => {
  const text = 'Das ist ein kurzer deutscher Beispielsatz';
  assert.equal(wrapText(text, 12).join(' '), text);
});

test('Faktentext wird begrenzt', () => {
  const result = firstUsefulSentences('Erster interessanter Satz. Zweiter wichtiger Satz. Dritter Satz.', 45);
  assert.ok(result.length <= 45);
});

test('Zeit wird dem nächsten Slot zugeordnet', () => {
  delete process.env.SLOT;
  assert.equal(slotFromEnvironment(new Date('2026-07-22T13:01:00Z')), 3);
});
