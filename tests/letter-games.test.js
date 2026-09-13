// Ejecutar con: node --test tests/letter-games.test.js (sin dependencias).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const games = require('../letter-games.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8'), context);
const words = JSON.parse(JSON.stringify(context.window.APP_DATA.lexicon));
function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const k = ([r, c]) => `${r},${c}`;

test('Conserva acentos y apóstrofos; admite Unicode equivalente y espacios', () => {
  assert.equal(games.normalize(' we’e '), "WE'E");
  assert.equal(games.normalize('ra\u0301ra'), 'RÁRA');
  assert.equal(games.normalize('walú wawíchi'), 'WALÚWAWÍCHI');
  assert.notEqual(games.normalize('rara'), games.normalize('rára'));
  assert.notEqual(games.normalize('wee'), games.normalize("we'e"));
});

test('Selecciones vacías, cortas, largas, repetidas y sin cruces', () => {
  assert.equal(games.makeWordsearch([]), null);
  assert.equal(games.makeCrossword([]), null);
  const entry = (id, raramuri) => ({ id, raramuri, spanish: 'pista' });
  const pool = [entry(1, 'aaa'), entry(2, 'bbb')];
  assert.equal(games.makeCrossword(pool, random(10)), null);
  assert.equal(games.makeCrossword(pool.slice(0, 1)), null);
  assert.equal(games.makeWordsearch(pool.slice(0, 1)).entries.length, 1);
  assert.equal(games.vocabulary([...pool, entry(3, 'AAA'), entry(4, ''), entry(5, 'a'), entry(6, 'a'.repeat(13))]).length, 2);
});

test('500 sopas: respuestas del diccionario, casillas válidas y recorridos rectos', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const puzzle = games.makeWordsearch(words, random(seed));
    assert.ok(puzzle.entries.length >= 1 && puzzle.entries.length <= 6);
    assert.equal(new Set(puzzle.entries.map(e => e.word.id)).size, puzzle.entries.length);
    for (const entry of puzzle.entries) {
      assert.equal(entry.cells.map(([r, c]) => puzzle.board[r][c]).join(''), games.normalize(entry.word.raramuri));
      assert.ok(words.some(w => w.id === entry.word.id && w.raramuri === entry.word.raramuri));
      entry.cells.forEach(([r, c], i) => {
        assert.equal(r, entry.cells[0][0] + i * entry.dr);
        assert.equal(c, entry.cells[0][1] + i * entry.dc);
      });
    }
  }
});

function checkCrossword(puzzle, maximum = 6) {
  assert.ok(puzzle.entries.length >= 2 && puzzle.entries.length <= maximum);
  assert.equal(new Set(puzzle.entries.map(e => e.word.id)).size, puzzle.entries.length);
  const occupied = new Map();
  for (const entry of puzzle.entries) {
    assert.equal(entry.cells.map(([r, c]) => puzzle.board[r][c]).join(''), games.normalize(entry.word.raramuri));
    entry.cells.forEach(cell => {
      const owners = occupied.get(k(cell)) || [];
      owners.push(entry);
      occupied.set(k(cell), owners);
    });
  }
  const visited = new Set([puzzle.entries[0]]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const owners of occupied.values()) {
      assert.ok(owners.length <= 2);
      if (owners.length === 2) assert.notEqual(owners[0].dr, owners[1].dr);
      if (owners.some(e => visited.has(e))) owners.forEach(e => {
        if (!visited.has(e)) { visited.add(e); changed = true; }
      });
    }
  }
  assert.equal(visited.size, puzzle.entries.length, 'Todas las palabras deben estar conectadas');
  // Cada secuencia horizontal/vertical de más de una casilla pertenece a una
  // respuesta: detecta contactos laterales y palabras accidentales sin pista.
  for (const [dr, dc] of [[0, 1], [1, 0]]) {
    for (let r = 0; r < puzzle.rows; r++) for (let c = 0; c < puzzle.cols; c++) {
      if (!puzzle.board[r][c] || puzzle.board[r - dr]?.[c - dc]) continue;
      const run = [];
      for (let y = r, x = c; puzzle.board[y]?.[x]; y += dr, x += dc) run.push([y, x]);
      if (run.length > 1) assert.ok(puzzle.entries.some(e => e.dr === dr && e.cells.map(k).join('|') === run.map(k).join('|')));
    }
  }
}

test('150 crucigramas conectados, sin colisiones ni contactos sin pista', () => {
  for (let seed = 1; seed <= 150; seed++) checkCrossword(games.makeCrossword(words, random(seed)));
});

test('Las opciones 4, 6 y 8 generan la cantidad elegida en ambos juegos', () => {
  const pool = words.filter(w => games.normalize(w.raramuri).length <= 8);
  for (const count of [4, 6, 8]) {
    for (let seed = 1; seed <= 20; seed++) {
      const soup = games.makeWordsearch(pool, random(seed), count);
      assert.equal(soup.entries.length, count);
      const crossword = games.makeCrossword(pool, random(seed), count === 4 ? 9 : count === 6 ? 11 : 13, count);
      assert.equal(crossword.entries.length, count);
      checkCrossword(crossword, count);
    }
  }
});

test('Las categorías mantienen su vocabulario y manejan las que no tienen respuestas', () => {
  for (const category of new Set(words.map(w => w.category))) {
    const pool = words.filter(w => w.category === category);
    for (const build of [games.makeWordsearch, games.makeCrossword]) {
      const puzzle = build(pool, random(12));
      if (!puzzle) continue;
      assert.ok(puzzle.entries.every(e => e.word.category === category));
      if (build === games.makeCrossword) checkCrossword(puzzle);
    }
  }
});

