/* Juegos de vocabulario. Las respuestas proceden exclusivamente del diccionario. */
(function (root) {
  'use strict';

  // Conservamos acentos y cierre glotal; solamente unificamos caja, Unicode,
  // apóstrofos tipográficos y espacios (que no ocupan casillas).
  function normalize(value) {
    return String(value).normalize('NFC').toLocaleUpperCase('es')
      .replace(/[’‘ʼ]/g, "'").replace(/\s/g, '');
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function vocabulary(words) {
    const seen = new Set();
    return words.filter(word => {
      if (!word.raramuri || !word.spanish) return false;
      const answer = normalize(word.raramuri);
      const length = Array.from(answer).length;
      if (length < 3 || length > 12 || !/^[\p{L}']+$/u.test(answer) || seen.has(answer)) return false;
      seen.add(answer);
      return true;
    });
  }

  const key = (r, c) => `${r},${c}`;
  const blank = size => Array.from({ length: size }, () => Array(size).fill(null));
  function makeEntry(word, r, c, dr, dc) {
    const letters = Array.from(normalize(word.raramuri));
    return { word, letters, cells: letters.map((_, i) => [r + i * dr, c + i * dc]), dr, dc };
  }

  function makeWordsearch(words, random = Math.random, count = 4) {
    const chosen = shuffle(vocabulary(words), random).slice(0, count);
    if (!chosen.length) return null;
    const size = Math.max(count >= 8 ? 10 : 8, ...chosen.map(w => Array.from(normalize(w.raramuri)).length));
    const board = blank(size);
    const entries = [];
    chosen.sort((a, b) => normalize(b.raramuri).length - normalize(a.raramuri).length);
    for (const word of chosen) {
      const candidates = [];
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1]]) {
          const entry = makeEntry(word, r, c, dr, dc);
          if (entry.cells.every(([y, x], i) => y < size && x < size &&
            (!board[y][x] || board[y][x] === entry.letters[i]))) candidates.push(entry);
        }
      }
      const entry = shuffle(candidates, random)[0];
      if (!entry) continue;
      entry.cells.forEach(([r, c], i) => { board[r][c] = entry.letters[i]; });
      entries.push(entry);
    }
    const alphabet = Array.from(new Set(vocabulary(words).flatMap(w => Array.from(normalize(w.raramuri)))));
    board.forEach(row => row.forEach((cell, c) => {
      if (!cell) row[c] = alphabet[Math.floor(random() * alphabet.length)];
    }));
    return { board, entries, rows: size, cols: size };
  }

  function makeCrossword(words, random = Math.random, size = 11, count = 4) {
    const pool = vocabulary(words).filter(word => normalize(word.raramuri).length <= size);
    if (pool.length < 2) return null;
    let best = [];
    let bestFootprint = Infinity;
    for (let attempt = 0; attempt < 24; attempt++) {
      const candidates = shuffle(pool, random).slice(0, 32);
      const board = blank(size);
      const directions = new Map();
      const entries = [];
      function place(entry) {
        entry.cells.forEach(([r, c], i) => {
          board[r][c] = entry.letters[i];
          const owners = directions.get(key(r, c)) || new Set();
          owners.add(entry.dr);
          directions.set(key(r, c), owners);
        });
        entries.push(entry);
      }
      const first = candidates.shift();
      place(makeEntry(first, Math.floor(size / 2), Math.floor((size - normalize(first.raramuri).length) / 2), 0, 1));
      const occupied = (r, c) => Boolean(board[r]?.[c]);
      function fits(entry) {
        let crossings = 0;
        const [r, c] = entry.cells[0];
        const [endR, endC] = entry.cells[entry.cells.length - 1];
        if (occupied(r - entry.dr, c - entry.dc) || occupied(endR + entry.dr, endC + entry.dc)) return false;
        for (let i = 0; i < entry.cells.length; i++) {
          const [y, x] = entry.cells[i];
          if (y < 0 || x < 0 || y >= size || x >= size) return false;
          if (board[y][x]) {
            if (board[y][x] !== entry.letters[i] || directions.get(key(y, x)).has(entry.dr)) return false;
            crossings++;
          } else if (occupied(y - entry.dc, x - entry.dr) || occupied(y + entry.dc, x + entry.dr)) {
            return false;
          }
        }
        return crossings > 0;
      }
      // Un segundo recorrido permite incorporar palabras que ahora tienen cruces.
      for (let pass = 0; pass < 2 && entries.length < count; pass++) {
        for (const word of candidates) {
          if (entries.some(e => e.word.id === word.id)) continue;
          const placements = [];
          const letters = Array.from(normalize(word.raramuri));
          for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
            if (!board[r][c]) continue;
            letters.forEach((letter, i) => {
              if (letter !== board[r][c]) return;
              for (const [dr, dc] of [[0, 1], [1, 0]]) {
                const entry = makeEntry(word, r - i * dr, c - i * dc, dr, dc);
                if (fits(entry)) placements.push(entry);
              }
            });
          }
          if (placements.length) place(shuffle(placements, random)[0]);
          if (entries.length === count) break;
        }
      }
      const coords = entries.flatMap(e => e.cells);
      const height = Math.max(...coords.map(c => c[0])) - Math.min(...coords.map(c => c[0])) + 1;
      const width = Math.max(...coords.map(c => c[1])) - Math.min(...coords.map(c => c[1])) + 1;
      const footprint = Math.max(height, width) ** 2 + height * width;
      if (entries.length > best.length || (entries.length === best.length && footprint < bestFootprint)) {
        best = entries;
        bestFootprint = footprint;
      }
    }
    if (best.length < 2) return null;
    const coords = best.flatMap(e => e.cells);
    const minR = Math.min(...coords.map(c => c[0]));
    const minC = Math.min(...coords.map(c => c[1]));
    const rows = Math.max(...coords.map(c => c[0])) - minR + 1;
    const cols = Math.max(...coords.map(c => c[1])) - minC + 1;
    const board = Array.from({ length: rows }, () => Array(cols).fill(null));
    const starts = new Map();
    best.forEach(entry => {
      entry.cells = entry.cells.map(([r, c]) => [r - minR, c - minC]);
      starts.set(key(...entry.cells[0]), entry.cells[0]);
      entry.cells.forEach(([r, c], i) => { board[r][c] = entry.letters[i]; });
    });
    const numbers = new Map([...starts.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .map((cell, i) => [key(...cell), i + 1]));
    best.forEach(entry => { entry.number = numbers.get(key(...entry.cells[0])); });
    best.sort((a, b) => a.number - b.number || a.dr - b.dr);
    return { board, entries: best, rows, cols };
  }

  const api = { normalize, vocabulary, makeWordsearch, makeCrossword };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;

  const modes = ['wordsearch', 'crossword'];
  const titles = { wordsearch: 'Sopa de letras', crossword: 'Crucigrama' };
  let services;
  const sessions = {};
  const el = (mode, name) => document.getElementById(`${mode}-${name}`);
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function button(text, action, className = 'duo-btn secondary small') {
    const result = node('button', text, className);
    result.type = 'button';
    result.addEventListener('click', action);
    return result;
  }
  function message(mode, text) { el(mode, 'feedback').textContent = text; }
  function review(mode, entry) {
    const state = sessions[mode];
    if (!state.assisted.has(entry.word.id)) {
      state.assisted.add(entry.word.id);
      services.onReview(entry.word.id);
    }
  }
  function audioButton(word) {
    const result = button('Escuchar', () => services.playAudio(word.audio));
    result.setAttribute('aria-label', `Escuchar ${word.raramuri}`);
    return result;
  }
  function wordCard(mode, entry, canReview = false) {
    const card = node('div', undefined, 'letter-word-card');
    card.append(node('strong', entry.word.raramuri), node('span', entry.word.spanish));
    if (canReview) {
      const saved = sessions[mode].assisted.has(entry.word.id);
      const save = button(saved ? 'Guardada para repasar' : 'Guardar para repasar', () => {
        review(mode, entry);
        save.textContent = 'Guardada para repasar';
        save.disabled = true;
      });
      save.disabled = saved;
      card.append(save);
    }
    return card;
  }

  function mount() {
    modes.forEach(mode => {
      const panel = document.getElementById(`game-${mode}`);
      panel.innerHTML = `
        <div class="activity-top-bar">
          <button type="button" class="back-to-lobby-btn duo-btn secondary small" aria-label="Volver a actividades">← Volver a las actividades</button>
          <button type="button" id="${mode}-peek-review" class="duo-btn secondary small letter-peek-btn hidden" title="Repasar palabras de la partida">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span>Repasar palabras</span>
          </button>
        </div>
        <section id="${mode}-setup" class="card-dialog letter-setup" aria-labelledby="${mode}-setup-title">
          <h3 id="${mode}-setup-title" class="dialog-title">${titles[mode]}</h3>
          <p class="dialog-subtitle">${mode === 'wordsearch' ? 'Encuentra las palabras en rarámuri.' : 'Mira las pistas y completa las casillas.'}</p>
          <div class="input-selection-group">
            <label for="${mode}-category">Tema</label>
            <select id="${mode}-category" class="styled-dropdown"></select>
          </div>
          <div class="input-selection-group">
            <label id="${mode}-count-label">¿Cuántas palabras?</label>
            <div id="${mode}-count-options" class="pill-buttons-row" role="group" aria-labelledby="${mode}-count-label">
              ${[4, 6, 8].map(count => `<button type="button" class="pill-toggle${count === 4 ? ' active' : ''}" data-count="${count}" aria-pressed="${count === 4}">${count}</button>`).join('')}
            </div>
          </div>
          <div class="letter-setup-actions">
            <button type="button" id="${mode}-preview" class="duo-btn secondary large letter-preview-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span>Repasar antes</span>
            </button>
            <button type="button" id="${mode}-start" class="duo-btn primary large letter-start-btn">Jugar</button>
          </div>
        </section>
        <section id="${mode}-preview-area" class="card-dialog letter-preview-card hidden" aria-labelledby="${mode}-preview-title">
          <h3 id="${mode}-preview-title" class="dialog-title">Repasar antes de jugar</h3>
          <p class="dialog-subtitle" id="${mode}-preview-subtitle">Estudia las palabras antes de resolver el ${titles[mode].toLowerCase()}.</p>
          <div id="${mode}-preview-list" class="letter-preview-grid"></div>
          <div class="letter-preview-actions">
            <button type="button" id="${mode}-preview-back" class="duo-btn secondary large">← Volver a ajustes</button>
            <button type="button" id="${mode}-preview-play" class="duo-btn primary large">¡Comenzar a jugar! →</button>
          </div>
        </section>
        <section id="${mode}-play-area" class="card-dialog letter-play-card hidden">
          <h3 class="dialog-title">${titles[mode]}</h3>
          <p class="letter-instructions" id="${mode}-instructions">${mode === 'wordsearch' ? 'Arrastra el dedo sobre la palabra en rarámuri.' : 'Mira el dibujo y escribe la palabra en rarámuri.'}</p>
          <div class="letter-play-layout">
            <div class="letter-board-scroll" tabindex="0" aria-label="Tablero desplazable"><div id="${mode}-board" class="letter-board" role="group" aria-label="${titles[mode]}" aria-describedby="${mode}-instructions"></div></div>
            <div class="letter-clue-panel">
              <div id="${mode}-clues" class="letter-clues" role="list" aria-label="Palabras por encontrar"></div>
              <img id="${mode}-clue-image" class="letter-clue-image" alt="">
              <h3 id="${mode}-clue-title" class="letter-clue-title"></h3>
              <p id="${mode}-word-help" class="letter-word-help" aria-live="polite"></p>
              <div id="${mode}-answer-area"></div>
            </div>
          </div>
          <div id="${mode}-discovery" class="letter-discovery"></div>
        </section>
        <p id="${mode}-feedback" class="letter-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        <section id="${mode}-results" class="hidden" aria-labelledby="${mode}-results-title">
          <h3 id="${mode}-results-title" tabindex="-1">¡Lo lograste!</h3>
          <p id="${mode}-summary"></p><div id="${mode}-review-list" class="letter-word-list"></div>
          <button type="button" id="${mode}-again" class="duo-btn primary">Jugar otra vez</button>
        </section>`;
      if (mode === 'wordsearch') el(mode, 'board').parentElement.before(el(mode, 'clues'));
    });
  }

  function setup(dependencies) {
    services = dependencies;
    modes.forEach(mode => {
      el(mode, 'start').addEventListener('click', () => prepare(mode));
      el(mode, 'preview').addEventListener('click', () => showPreview(mode, false));
      el(mode, 'again').addEventListener('click', () => showSetup(mode));
      el(mode, 'category').addEventListener('change', () => {
        sessions[mode] = null;
        message(mode, '');
      });
      el(mode, 'peek-review')?.addEventListener('click', () => showPreview(mode, true));
      el(mode, 'preview-back').addEventListener('click', () => {
        services.stopAudio();
        el(mode, 'preview-area').classList.add('hidden');
        if (sessions[mode]?.isPeek) {
          el(mode, 'play-area').classList.remove('hidden');
        } else {
          el(mode, 'setup').classList.remove('hidden');
        }
      });
      el(mode, 'preview-play').addEventListener('click', () => {
        services.stopAudio();
        el(mode, 'preview-area').classList.add('hidden');
        if (sessions[mode]?.isPeek) {
          el(mode, 'play-area').classList.remove('hidden');
        } else {
          el(mode, 'discovery').replaceChildren();
          prepare(mode);
        }
      });
      el(mode, 'count-options').querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
          sessions[mode] = null;
          el(mode, 'count-options').querySelectorAll('button').forEach(option => {
            option.classList.toggle('active', option === button);
            option.setAttribute('aria-pressed', String(option === button));
          });
          message(mode, '');
        });
      });
    });
    el('wordsearch', 'board').addEventListener('keydown', event => {
      if (event.key === 'Escape' && sessions.wordsearch) {
        sessions.wordsearch.start = null;
        sessions.wordsearch.drag = null;
        paintBoard('wordsearch');
        message('wordsearch', 'Selección cancelada. Elige la primera casilla.');
      }
    });
    setupWordsearchDrag();
  }

  function setupWordsearchDrag() {
    const board = el('wordsearch', 'board');
    board.addEventListener('pointerdown', event => {
      const cell = event.target.closest('button[data-cell]');
      const state = sessions.wordsearch;
      if (!cell || !state || state.phase !== 'play' || event.button !== 0 || !event.isPrimary) return;
      const start = cell.dataset.cell.split(',').map(Number);
      state.drag = { pointerId: event.pointerId, start, end: start, moved: false };
      state.suppressClickUntil = performance.now() + 500;
      board.setPointerCapture(event.pointerId);
      cell.focus({ preventScroll: true });
      event.preventDefault();
      paintBoard('wordsearch');
    });
    board.addEventListener('pointermove', event => {
      const state = sessions.wordsearch;
      if (!state?.drag || state.drag.pointerId !== event.pointerId) return;
      const first = board.querySelector('button[data-cell="0,0"]').getBoundingClientRect();
      const bounds = board.getBoundingClientRect();
      const colStep = (bounds.width + 3) / state.puzzle.cols;
      const rowStep = (bounds.height + 3) / state.puzzle.rows;
      const r = Math.max(0, Math.min(state.puzzle.rows - 1, Math.round((event.clientY - first.top - first.height / 2) / rowStep)));
      const c = Math.max(0, Math.min(state.puzzle.cols - 1, Math.round((event.clientX - first.left - first.width / 2) / colStep)));
      const [sr, sc] = state.drag.start;
      const dr = r - sr;
      const dc = c - sc;
      // Encajamos el gesto a una fila, columna o diagonal; así el dedo puede
      // desviarse un poco sin romper la selección de una palabra recta.
      if (Math.abs(dr) > Math.abs(dc) * 2) state.drag.end = [r, sc];
      else if (Math.abs(dc) > Math.abs(dr) * 2) state.drag.end = [sr, c];
      else {
        const steps = Math.min(Math.abs(dr), Math.abs(dc));
        state.drag.end = [sr + steps * Math.sign(dr), sc + steps * Math.sign(dc)];
      }
      if (key(...state.drag.end) !== key(...state.drag.start)) state.drag.moved = true;
      paintBoard('wordsearch');
    });
    board.addEventListener('pointerup', event => {
      const state = sessions.wordsearch;
      if (!state?.drag || state.drag.pointerId !== event.pointerId) return;
      const drag = state.drag;
      state.drag = null;
      state.suppressClickUntil = performance.now() + 500;
      if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
      if (drag.moved) {
        state.start = drag.start;
        chooseEndpoint(...drag.end);
      } else chooseEndpoint(...drag.start);
    });
    function cancel(event) {
      const state = sessions.wordsearch;
      if (!state?.drag || state.drag.pointerId !== event.pointerId) return;
      state.drag = null;
      state.start = null;
      paintBoard('wordsearch');
    }
    board.addEventListener('pointercancel', cancel);
    board.addEventListener('lostpointercapture', cancel);
  }

  function paintSelection(state) {
    const board = el('wordsearch', 'board');
    const overlay = board.querySelector('.letter-selection-overlay');
    if (!overlay) return;
    overlay.replaceChildren();
    const bounds = board.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    overlay.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const strokes = state.puzzle.entries.filter(e => state.solved.has(e.word.id)).map(e => ({
      start: e.cells[0], end: e.cells[e.cells.length - 1], solved: true
    }));
    if (state.drag) strokes.push(state.drag);
    else if (state.start) strokes.push({ start: state.start, end: state.start });
    strokes.forEach(stroke => {
      const first = board.querySelector(`[data-cell="${key(...stroke.start)}"]`).getBoundingClientRect();
      const last = board.querySelector(`[data-cell="${key(...stroke.end)}"]`).getBoundingClientRect();
      const x1 = first.left + first.width / 2 - bounds.left;
      const y1 = first.top + first.height / 2 - bounds.top;
      const x2 = last.left + last.width / 2 - bounds.left;
      const y2 = last.top + last.height / 2 - bounds.top;
      const radius = first.width * .43;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const dx = Math.sin(angle) * radius;
      const dy = -Math.cos(angle) * radius;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1 + dx} ${y1 + dy} L ${x2 + dx} ${y2 + dy} A ${radius} ${radius} 0 0 1 ${x2 - dx} ${y2 - dy} L ${x1 - dx} ${y1 - dy} A ${radius} ${radius} 0 0 1 ${x1 + dx} ${y1 + dy} Z`);
      path.setAttribute('class', stroke.solved ? 'letter-stroke solved' : 'letter-stroke selecting');
      overlay.append(path);
    });
  }

  function showSetup(mode) {
    services.stopAudio();
    sessions[mode] = null;
    el(mode, 'peek-review')?.classList.add('hidden');
    ['play-area', 'results', 'preview-area'].forEach(name => el(mode, name)?.classList.add('hidden'));
    el(mode, 'setup').classList.remove('hidden');
    message(mode, '');
  }

  function showPreview(mode, isPeek = false) {
    services.stopAudio();
    const categoryVal = el(mode, 'category').value;
    const words = vocabulary(services.getWords(categoryVal).filter(word => normalize(word.raramuri).length <= 8));
    const count = Number(el(mode, 'count-options').querySelector('.active').dataset.count);

    if (words.length < count) {
      message(mode, `Este tema no tiene ${count} palabras para el tablero. Elige menos palabras u otro tema.`);
      return;
    }

    if (isPeek) {
      el(mode, 'play-area').classList.add('hidden');
      el(mode, 'preview-back').textContent = '← Volver a la partida';
      el(mode, 'preview-play').textContent = 'Continuar partida →';
    } else {
      el(mode, 'setup').classList.add('hidden');
      el(mode, 'preview-back').textContent = '← Volver a ajustes';
      el(mode, 'preview-play').textContent = '¡Comenzar a jugar! →';
    }

    if (!sessions[mode]) {
      sessions[mode] = { isPeek, phase: 'setup' };
    } else {
      sessions[mode].isPeek = isPeek;
    }

    ['results'].forEach(name => el(mode, name)?.classList.add('hidden'));
    el(mode, 'preview-area').classList.remove('hidden');

    const catSelect = el(mode, 'category');
    const selectedOptionText = catSelect.options[catSelect.selectedIndex]?.textContent || categoryVal;
    const cleanCatName = selectedOptionText.replace(/\s*\(\d+\)$/, '');
    el(mode, 'preview-subtitle').textContent = `Estudia las palabras de ${cleanCatName} (${words.length}) antes de resolver el ${titles[mode].toLowerCase()}.`;

    renderPreviewCards(mode, words);
    message(mode, '');
  }

  function renderPreviewCards(mode, words) {
    const listEl = el(mode, 'preview-list');
    listEl.replaceChildren();

    words.forEach(word => {
      const card = node('div', undefined, 'letter-word-card letter-preview-card-item');

      const topRow = node('div', undefined, 'preview-card-top');
      if (word.image) {
        const img = node('img', undefined, 'preview-card-img');
        img.alt = '';
        img.src = word.image;
        img.onerror = () => {
          if (img.src.includes('_nobg.png')) img.src = img.src.replace('_nobg.png', '.jpg');
          else img.hidden = true;
        };
        topRow.append(img);
      }

      const texts = node('div', undefined, 'preview-card-texts');
      const raramuriEl = node('strong', word.raramuri, 'preview-word-raramuri');
      const spanishEl = node('span', word.spanish, 'preview-word-spanish');
      texts.append(raramuriEl, spanishEl);
      topRow.append(texts);
      card.append(topRow);

      const actionsRow = node('div', undefined, 'preview-card-actions');
      if (word.audio) {
        const audioBtn = button('Escuchar', () => services.playAudio(word.audio), 'duo-btn secondary small preview-audio-btn');
        audioBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Escuchar</span>`;
        audioBtn.setAttribute('aria-label', `Escuchar ${word.raramuri}`);
        actionsRow.append(audioBtn);
      }

      const isMarked = services.isReviewed ? services.isReviewed(word.id) : (sessions[mode]?.assisted?.has(word.id));
      const saveBtn = button(isMarked ? '✓ En repaso' : '⭐ Repasar', () => {
        if (services.onReview) {
          services.onReview(word.id);
          saveBtn.textContent = '✓ En lista de repaso';
          saveBtn.classList.add('is-reviewed');
        }
      }, 'duo-btn secondary small preview-save-btn');
      if (isMarked) saveBtn.classList.add('is-reviewed');
      actionsRow.append(saveBtn);

      card.append(actionsRow);
      listEl.append(card);
    });
  }

  function prepare(mode) {
    services.stopAudio();
    ['play-area', 'results', 'preview-area'].forEach(name => el(mode, name)?.classList.add('hidden'));
    const words = services.getWords(el(mode, 'category').value).filter(word => normalize(word.raramuri).length <= 8);
    const count = Number(el(mode, 'count-options').querySelector('.active').dataset.count);
    if (vocabulary(words).length < count) {
      message(mode, `Este tema no tiene ${count} palabras para el tablero. Elige menos palabras u otro tema.`);
      return;
    }
    const puzzle = mode === 'wordsearch' ? makeWordsearch(words, Math.random, count)
      : makeCrossword(words, Math.random, count === 4 ? 9 : count === 6 ? 11 : 13, count);
    sessions[mode] = null;
    if (!puzzle) {
      message(mode, mode === 'wordsearch'
        ? 'Aquí todavía no hay palabras para jugar. Elige otro tema.'
        : 'Estas palabras no se pueden cruzar. Elige otro tema.');
      return;
    }
    if (puzzle.entries.length !== count) {
      message(mode, `No se pudo formar un tablero con ${count} palabras de este tema. Prueba otra vez, otro tema o menos palabras.`);
      return;
    }
    sessions[mode] = { puzzle, solved: new Set(), assisted: new Set(), active: 0, start: null, values: new Map(), invalid: new Set(), phase: 'play' };
    el(mode, 'setup').classList.add('hidden');
    el(mode, 'discovery').replaceChildren();
    play(mode);
  }

  function play(mode) {
    const state = sessions[mode];
    if (!state) return;
    state.phase = 'play';
    services.stopAudio();
    ['setup', 'results', 'preview-area'].forEach(name => el(mode, name)?.classList.add('hidden'));
    el(mode, 'peek-review')?.classList.remove('hidden');
    el(mode, 'play-area').classList.remove('hidden');
    buildBoard(mode);
    renderClues(mode);
    selectClue(mode, 0);
    message(mode, '');
  }

  function buildBoard(mode) {
    const { puzzle } = sessions[mode];
    const board = el(mode, 'board');
    board.replaceChildren();
    board.style.setProperty('--letter-cols', puzzle.cols);
    puzzle.board.forEach((row, r) => row.forEach((letter, c) => {
      if (!letter) {
        const block = node('span', undefined, 'letter-cell letter-block');
        block.setAttribute('aria-hidden', 'true');
        board.append(block);
        return;
      }
      if (mode === 'crossword') {
        board.append(crosswordCell(r, c));
        return;
      }
      const cell = button('', event => {
        if (mode === 'wordsearch') {
          if (event.detail === 0 || performance.now() > (sessions[mode].suppressClickUntil || 0)) chooseEndpoint(r, c);
        }
      }, 'letter-cell');
      cell.dataset.cell = key(r, c);
      cell.append(node('span', mode === 'wordsearch' ? letter : '', 'letter-glyph'));
      const first = puzzle.entries.find(entry => key(...entry.cells[0]) === key(r, c));
      if (mode === 'crossword' && first) cell.append(node('span', String(first.number), 'letter-number'));
      cell.setAttribute('aria-label', `Fila ${r + 1}, columna ${c + 1}: ${mode === 'wordsearch' ? letter : 'vacía'}`);
      board.append(cell);
    }));
    if (mode === 'wordsearch') {
      const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlay.setAttribute('class', 'letter-selection-overlay');
      overlay.setAttribute('aria-hidden', 'true');
      board.append(overlay);
      if (!board._letterResizeObserver) {
        board._letterResizeObserver = new ResizeObserver(() => {
          if (sessions.wordsearch) paintSelection(sessions.wordsearch);
        });
        board._letterResizeObserver.observe(board);
      }
    }
    paintBoard(mode);
  }

  function paintBoard(mode) {
    const state = sessions[mode];
    const solvedCells = new Set(state.puzzle.entries.filter(e => state.solved.has(e.word.id)).flatMap(e => e.cells.map(c => key(...c))));
    const activeCells = new Set(state.puzzle.entries[state.active].cells.map(c => key(...c)));
    el(mode, 'board').querySelectorAll('[data-cell]').forEach(cell => {
      const position = cell.dataset.cell;
      const solved = solvedCells.has(position);
      cell.classList.toggle('is-solved', solved);
      cell.classList.toggle('is-active-clue', mode === 'crossword' && activeCells.has(position));
      const selected = Boolean(state.start && key(...state.start) === position);
      cell.classList.toggle('is-selected', selected);
      if (mode === 'wordsearch') cell.setAttribute('aria-pressed', String(selected));
      if (mode === 'crossword') {
        const [r, c] = position.split(',').map(Number);
        const input = cell.querySelector('input');
        const letter = solved ? state.puzzle.board[r][c] : state.values.get(position) || '';
        if (input.value !== letter) input.value = letter;
        input.readOnly = solved;
        input.setAttribute('aria-label', `Fila ${r + 1}, columna ${c + 1}: ${letter || 'vacía'}`);
        const invalid = state.puzzle.entries.some(e => state.invalid.has(e.word.id) && e.cells.some(c => key(...c) === position));
        input.setAttribute('aria-invalid', String(invalid && !solved));
      }
    });
    if (mode === 'wordsearch') paintSelection(state);
  }

  function renderClues(mode) {
    if (mode === 'crossword') return;
    const state = sessions[mode];
    el(mode, 'clues').replaceChildren(...state.puzzle.entries.map((entry, i) => {
      const solved = state.solved.has(entry.word.id);
      const clue = node('div', undefined, 'letter-clue');
      clue.setAttribute('role', 'listitem');
      if (entry.word.image) {
        const picture = node('img');
        picture.alt = '';
        picture.src = entry.word.image;
        picture.onerror = () => {
          if (picture.src.includes('_nobg.png')) picture.src = picture.src.replace('_nobg.png', '.jpg');
          else picture.hidden = true;
        };
        clue.append(picture);
      }
      clue.append(node('span', `${solved ? '✓ ' : ''}${entry.word.spanish}`));
      clue.setAttribute('aria-label', `${entry.word.spanish}${solved ? ', encontrada' : ', por encontrar'}`);
      clue.dataset.index = i;
      clue.classList.toggle('is-solved', solved);
      return clue;
    }));
  }

  function selectClue(mode, index) {
    const state = sessions[mode];
    state.active = index;
    const entry = state.puzzle.entries[index];
    const picture = el(mode, 'clue-image');
    picture.hidden = !entry.word.image;
    picture.onerror = () => {
      if (picture.src.includes('_nobg.png')) picture.src = picture.src.replace('_nobg.png', '.jpg');
      else picture.hidden = true;
    };
    picture.src = entry.word.image || '';
    el(mode, 'clue-title').textContent = mode === 'crossword'
      ? `${entry.number} ${entry.dr ? '↓' : '→'} ${entry.word.spanish}` : entry.word.spanish;
    el(mode, 'word-help').textContent = '';
    if (el(mode, 'hint')) el(mode, 'hint').disabled = state.solved.has(entry.word.id);
    el(mode, 'discovery').replaceChildren();
    paintBoard(mode);
  }

  function chooseEndpoint(r, c) {
    const mode = 'wordsearch';
    const state = sessions[mode];
    if (state.phase !== 'play') return;
    if (!state.start) {
      state.start = [r, c];
      paintBoard(mode);
      message(mode, 'Toca el final de la palabra.');
      return;
    }
    const [startR, startC] = state.start;
    const deltaR = r - startR;
    const deltaC = c - startC;
    const straight = deltaR === 0 || deltaC === 0 || Math.abs(deltaR) === Math.abs(deltaC);
    const cells = straight ? Array.from({ length: Math.max(Math.abs(deltaR), Math.abs(deltaC)) + 1 }, (_, i) =>
      [startR + i * Math.sign(deltaR), startC + i * Math.sign(deltaC)]) : [];
    const letters = cells.map(([y, x]) => state.puzzle.board[y][x]);
    state.start = null;
    const entry = state.puzzle.entries.find(e => e.letters.join('') === letters.join('') ||
      e.letters.join('') === [...letters].reverse().join(''));
    if (entry && !state.solved.has(entry.word.id)) {
      // También aceptamos apariciones válidas creadas por el relleno aleatorio.
      entry.cells = entry.letters.join('') === letters.join('') ? cells : [...cells].reverse();
      completeWord(mode, entry);
    }
    else {
      paintBoard(mode);
      message(mode, entry ? '¡Esa ya la encontraste!' : '¡Inténtalo otra vez! Sigue las letras de la palabra.');
    }
  }

  function crosswordCell(r, c) {
    const state = sessions.crossword;
    const position = key(r, c);
    const cell = node('span', undefined, 'letter-cell letter-input-cell');
    cell.dataset.cell = position;
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    input.setAttribute('aria-describedby', 'crossword-clue-title crossword-feedback');
    const matches = () => state.puzzle.entries.map((entry, i) => ({ entry, i }))
      .filter(({ entry }) => entry.cells.some(coord => key(...coord) === position));
    input.addEventListener('focus', () => {
      const choices = matches();
      if (!choices.some(({ i }) => i === state.active)) {
        selectClue('crossword', (choices.find(({ entry }) => !state.solved.has(entry.word.id)) || choices[0]).i);
      }
      input.select();
    });
    input.addEventListener('pointerdown', () => {
      // Un segundo toque en un cruce cambia entre horizontal y vertical.
      if (document.activeElement === input) {
        const choices = matches();
        const current = choices.findIndex(({ i }) => i === state.active);
        if (choices.length > 1) selectClue('crossword', choices[(current + 1) % choices.length].i);
      }
    });
    function write() {
      if (input.readOnly) return;
      const entry = state.puzzle.entries[state.active];
      const offset = entry.cells.findIndex(coord => key(...coord) === position);
      const letters = Array.from(normalize(input.value)).filter(letter => /^[\p{L}']$/u.test(letter));
      state.invalid.delete(entry.word.id);
      if (!letters.length) state.values.delete(position);
      else {
        letters.forEach((letter, i) => {
          const coord = entry.cells[offset + i];
          if (!coord) return;
          const target = el('crossword', 'board').querySelector('[data-cell="' + key(...coord) + '"] input');
          if (!target.readOnly) state.values.set(key(...coord), letter);
        });
      }
      paintBoard('crossword');
      const completed = state.puzzle.entries.filter(e => !state.solved.has(e.word.id) &&
        e.cells.map(coord => state.values.get(key(...coord)) || '').join('') === e.letters.join(''));
      if (completed.length) {
        completed.forEach(e => completeWord('crossword', e));
        return;
      }
      if (entry.cells.every(coord => state.values.has(key(...coord)))) {
        review('crossword', entry);
        state.invalid.add(entry.word.id);
        paintBoard('crossword');
        message('crossword', '¡Casi! Revisa las letras y los acentos.');
      } else message('crossword', '');
      if (letters.length) {
        const next = entry.cells.slice(offset + letters.length).find(coord =>
          !el('crossword', 'board').querySelector('[data-cell="' + key(...coord) + '"] input').readOnly);
        if (next) el('crossword', 'board').querySelector('[data-cell="' + key(...next) + '"] input').focus({ preventScroll: true });
      }
    }
    input.addEventListener('input', event => { if (!event.isComposing) write(); });
    input.addEventListener('keydown', event => {
      const entry = state.puzzle.entries[state.active];
      const offset = entry.cells.findIndex(coord => key(...coord) === position);
      if (event.key === 'Backspace' && !input.value) {
        const previous = entry.cells.slice(0, offset).reverse().find(coord =>
          !el('crossword', 'board').querySelector('[data-cell="' + key(...coord) + '"] input').readOnly);
        if (previous) {
          event.preventDefault();
          state.values.delete(key(...previous));
          state.invalid.delete(entry.word.id);
          paintBoard('crossword');
          el('crossword', 'board').querySelector('[data-cell="' + key(...previous) + '"] input').focus({ preventScroll: true });
        }
      }
      const arrows = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      if (arrows[event.key]) {
        event.preventDefault();
        const [dr, dc] = arrows[event.key];
        const target = el('crossword', 'board').querySelector('[data-cell="' + key(r + dr, c + dc) + '"] input');
        if (target) {
          const direction = matches().find(({ entry }) => entry.dr === Math.abs(dr));
          if (direction) selectClue('crossword', direction.i);
          target.focus({ preventScroll: true });
        }
      }
    });
    cell.append(input);
    const first = state.puzzle.entries.find(entry => key(...entry.cells[0]) === position);
    if (first) cell.append(node('span', String(first.number), 'letter-number'));
    return cell;
  }

  function focusCrosswordNext() {
    const state = sessions.crossword;
    const entry = state.puzzle.entries[state.active];
    const position = entry.cells.find(coord => !state.values.has(key(...coord))) || entry.cells[0];
    el('crossword', 'board').querySelector('[data-cell="' + key(...position) + '"] input')?.focus({ preventScroll: true });
  }

  function completeWord(mode, entry) {
    const state = sessions[mode];
    state.solved.add(entry.word.id);
    if (mode === 'crossword') {
      entry.cells.forEach((coord, i) => state.values.set(key(...coord), entry.letters[i]));
      state.invalid.delete(entry.word.id);
    }
    renderClues(mode);
    const next = state.puzzle.entries.findIndex(e => !state.solved.has(e.word.id));
    if (next >= 0) {
      selectClue(mode, next);
      if (mode === 'crossword') focusCrosswordNext();
    }
    paintBoard(mode);
    message(mode, `¡Correcto! ${entry.word.raramuri} significa ${entry.word.spanish}.`);
    if (entry.word.audio) services.playAudio(entry.word.audio);
    if (next < 0) {
      state.phase = 'complete';
      if (el(mode, 'hint')) el(mode, 'hint').disabled = true;
      el(mode, 'peek-review')?.classList.add('hidden');
      el(mode, 'play-area').classList.add('hidden');
      el(mode, 'results').classList.remove('hidden');
      el(mode, 'summary').textContent = `¡Jugaste con ${state.solved.size} palabras en rarámuri!`;
      el(mode, 'review-list').replaceChildren(...state.puzzle.entries.map(e => wordCard(mode, e)));
      el(mode, 'results-title').focus();
    }
  }

  root.LetterGames = { ...api, mount, setup, open(mode) {
    if (modes.includes(mode) && services) showSetup(mode);
  } };
})(typeof window !== 'undefined' ? window : globalThis);

