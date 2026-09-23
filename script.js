// script.js — Rarámuri Be'neka! (Versión 2)

(function () {
  'use strict';

  // ==========================================
  // 1. SISTEMA DE AUDIO Y SINTETIZADOR FX
  // ==========================================
  const AudioPlayer = {
    currentAudio: null,
    play(src) {
      if (!src) return;
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      try {
        this.currentAudio = new Audio(src);
        this.currentAudio.play().catch(err => {
          console.warn('Audio no disponible:', src);
        });
      } catch (e) {
        console.warn('Error inicializando audio:', e);
      }
    },
    stop() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
    }
  };

  // Efectos de sonido dinámicos estilo Duolingo/Babadum (Web Audio API)
  const SoundFX = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playTone(freq, duration, type = 'sine', gainVal = 0.1) {
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch(e) {}
    },
    playSuccess() {
      setTimeout(() => this.playTone(523.25, 0.14, 'triangle', 0.12), 0);
      setTimeout(() => this.playTone(659.25, 0.14, 'triangle', 0.12), 85);
      setTimeout(() => this.playTone(783.99, 0.35, 'triangle', 0.14), 170);
    },
    playFlip() {
      this.playTone(420, 0.05, 'sine', 0.08);
    },
    playError() {
      this.playTone(190, 0.25, 'sawtooth', 0.09);
    },
    playWin() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        setTimeout(() => this.playTone(n, 0.28, 'triangle', 0.15), idx * 100);
      });
    },
    playVasijaCrack() {
      try {
        const audio = new Audio('audio/vasija_crack.wav');
        audio.volume = 0.85;
        audio.play().catch(() => {
          this.playTone(320, 0.08, 'sawtooth', 0.12);
          setTimeout(() => this.playTone(540, 0.06, 'triangle', 0.08), 20);
        });
      } catch(e) {
        this.playTone(320, 0.08, 'sawtooth', 0.12);
      }
    },
    playVasijaShatter() {
      try {
        const audio = new Audio('audio/vasija_shatter.wav');
        audio.volume = 0.95;
        audio.play().catch(() => {
          this.playTone(160, 0.35, 'sawtooth', 0.2);
          setTimeout(() => this.playTone(880, 0.15, 'triangle', 0.12), 40);
          setTimeout(() => this.playTone(620, 0.2, 'triangle', 0.1), 120);
        });
      } catch(e) {
        this.playTone(160, 0.35, 'sawtooth', 0.2);
      }
    }
  };

  // ==========================================
  // 2. SISTEMA DE CONFETI CELEBRATORIO (CANVAS)
  // ==========================================
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,
    init() {
      this.canvas = document.getElementById('confetti-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
      }
    },
    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },
    burst(x, y, count = 36) {
      if (!this.canvas || !this.ctx) return;
      const colors = ['#C20E22', '#E5A93C', '#2E8B57', '#FFFFFF', '#D61327'];
      const startX = x || window.innerWidth / 2;
      const startY = y || window.innerHeight / 2;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        this.particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 6,
          alpha: 1,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12
        });
      }

      if (!this.animId) this.loop();
    },
    loop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravedad suave
        p.alpha -= 0.02;
        p.rotation += p.vRot;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.animId = null;
      }
    }
  };

  // Sellos e ilustraciones culturales artesanales para el Selector de Categorías (12 nuevos iconos limpios)
  const CATEGORY_STAMP_ICONS = {
    'Todas': `<img src="images/cat_icons/cat_todas.png" alt="Todas" class="stamp-icon-img">`,
    'Repasar': `<img src="images/cat_icons/cat_repasar.png" alt="Repasar" class="stamp-icon-img">`,
    'Adjetivos': `<img src="images/cat_icons/cat_adjetivos.png" alt="Adjetivos" class="stamp-icon-img">`,
    'Animales': `<img src="images/cat_icons/cat_animales.png" alt="Animales" class="stamp-icon-img">`,
    'Comida y bebida': `<img src="images/cat_icons/cat_comida.png" alt="Comida y bebida" class="stamp-icon-img">`,
    'Lugares': `<img src="images/cat_icons/cat_lugares.png" alt="Lugares" class="stamp-icon-img">`,
    'Naturaleza': `<img src="images/cat_icons/cat_naturaleza.png" alt="Naturaleza" class="stamp-icon-img">`,
    'Objetos': `<img src="images/cat_icons/cat_objetos.png" alt="Objetos" class="stamp-icon-img">`,
    'Objetos y hogar': `<img src="images/cat_icons/cat_objetos.png" alt="Objetos y hogar" class="stamp-icon-img">`,
    'Partes del cuerpo': `<img src="images/cat_icons/cat_cuerpo.png" alt="Partes del cuerpo" class="stamp-icon-img">`,
    'Personas': `<img src="images/cat_icons/cat_personas.png" alt="Personas" class="stamp-icon-img">`,
    'Verbos': `<img src="images/cat_icons/cat_verbos.png" alt="Verbos" class="stamp-icon-img">`,
    'Vestimenta': `<img src="images/cat_icons/cat_vestimenta.png" alt="Vestimenta" class="stamp-icon-img">`
  };

  // Emojis de categorías (para los selects nativos de práctica, emparejados con los nuevos iconos)
  const CATEGORY_ICONS = {
    'Todas': '🗂️',
    'Repasar': '🔄',
    'Adjetivos': '✨',
    'Animales': '🦌',
    'Comida y bebida': '🌽',
    'Lugares': '🏠',
    'Naturaleza': '🍃',
    'Objetos': '🏺',
    'Partes del cuerpo': '✋',
    'Personas': '👥',
    'Verbos': '🏃',
    'Vestimenta': '👕',
    'Objetos y hogar': '🏺'
  };

  // Imágenes recortadas con fondo transparente (Cutouts flotantes)
  const NOBG_CUTOUTS = {
    'huarache': 'images/huarache_nobg.png',
    'perro': 'images/perro_nobg.png',
    'conejo': 'images/conejo_nobg.png',
    'manzana': 'images/manzana_nobg.png',
    'árbol': 'images/arbol_nobg.png',
    'arbol': 'images/arbol_nobg.png'
  };

  // Alfabeto Rarámuri
  const RARAMURI_ALPHABET = [
    'a', 'b', 'c', 'd', 'e', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'r', 's', 't', 'u', 'w', 'y', "'", 'á', 'é', 'í', 'ó', 'ú'
  ];

  // ==========================================
  // 3. ESTADO DE LA APLICACIÓN
  // ==========================================
  const State = {
    lexicon: [],
    phrases: [],
    categories: [],
    repasarIds: new Set(),
    activeCategory: 'Todas',
    searchTerm: '',
    
    guess: {
      pool: [],
      currentWord: null,
      guessedLetters: new Set(),
      lives: 5,
      maxLives: 5,
      score: 0,
      category: 'Todas'
    },

    quiz: {
      questions: [],
      currentIndex: 0,
      score: 0,
      missedQuestions: [],
      category: 'Todas',
      totalQuestions: 5
    },

    memorama: {
      cards: [],
      flippedCards: [],
      matchedCount: 0,
      totalPairs: 4,
      attempts: 0,
      locked: false,
      category: 'Todas'
    },

    flashcards: {
      deck: [],
      currentIndex: 0,
      isFlipped: false,
      category: 'Todas'
    }
  };

  // ==========================================
  // 4. INICIALIZACIÓN
  // ==========================================
  async function initApp() {
    Confetti.init();
    loadRepasarFromStorage();
    window.LetterGames.mount();
    setupNavigation();

    try {
      let data;
      if (typeof window !== 'undefined' && window.APP_DATA) {
        data = window.APP_DATA;
      } else {
        const response = await fetch('data.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Error al cargar data.json');
        data = await response.json();
      }

      // Filtrar palabras válidas (con rarámuri no vacío)
      State.lexicon = (data.lexicon || []).filter(item => item.raramuri && item.raramuri.trim() !== '');
      State.phrases = data.phrases || [];

      // Aplicar versión con fondo transparente a todas las ilustraciones con cache-busting
      State.lexicon.forEach(item => {
        if (item.image && typeof item.image === 'string') {
          item.image = item.image.replace(/\.jpg$/i, '_nobg.png?v=3');
        }
      });

      // Categorías
      const catSet = new Set();
      State.lexicon.forEach(item => {
        if (item.category) catSet.add(item.category.trim());
      });
      State.categories = Array.from(catSet).sort();

      // Cargar contornos vectoriales si no están en cache global
      if (typeof WORD_CONTOURS === 'undefined') {
        try {
          const cRes = await fetch('contours.json', { cache: 'no-cache' });
          if (cRes.ok) {
            window.WORD_CONTOURS = await cRes.json();
          }
        } catch (e) {
          console.warn('Contornos no disponibles:', e);
        }
      }

      setupCategoryDropdown();
      setupSearchAndRepasar();
      renderLexicon();
      renderPhrases();
      populateDropdowns();
      setupAhorcado();
      setupQuiz();
      setupMemorama();
      setupFlashcards();
      window.LetterGames.setup({
        getWords: getWordsBySelection,
        playAudio: src => AudioPlayer.play(src),
        stopAudio: () => AudioPlayer.stop(),
        isReviewed: id => State.repasarIds.has(id),
        onReview: id => {
          State.repasarIds.add(id);
          saveRepasarToStorage();
          renderLexicon();
        }
      });

      // Navegación profunda opcional por hash o query (ej: #memorama, ?game=memorama&pairs=8)
      const hash = (window.location.hash || '').replace('#', '').toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const targetGame = ['memorama', 'quiz', 'guess', 'flashcards', 'wordsearch', 'crossword'].includes(hash)
        ? hash 
        : urlParams.get('game');

      if (targetGame) {
        switchMainSection('practice', () => openPracticeGame(targetGame));

        if (targetGame === 'memorama') {
          const pairsParam = parseInt(urlParams.get('pairs'), 10);
          if ([4, 6, 8].includes(pairsParam)) {
            State.memorama.totalPairs = pairsParam;
            document.querySelectorAll('#memorama-diff-options .pill-toggle').forEach(b => {
              b.classList.toggle('active', parseInt(b.dataset.pairs, 10) === pairsParam);
            });
          }
          if (urlParams.get('autostart') === 'true') {
            startMemorama();
          }
        } else if (targetGame === 'guess' && urlParams.get('autostart') === 'true') {
          document.getElementById('guess-start-btn')?.click();
          const errs = parseInt(urlParams.get('errors'), 10);
          if (!isNaN(errs) && errs > 0) {
            State.guess.lives = Math.max(0, State.guess.maxLives - errs);
            renderAhorcadoHUD();
            if (State.guess.lives === 0) {
              triggerAhorcadoGameOver();
            }
          }
          const testGuesses = urlParams.get('test_guess');
          if (testGuesses) {
            testGuesses.split(',').forEach((letter, idx) => {
              setTimeout(() => handleAhorcadoGuess(letter.trim()), idx * 450);
            });
          }
        }
      } else if (hash === 'frases' || hash === 'phrases' || urlParams.get('tab') === 'phrases' || urlParams.get('tab') === 'frases') {
        const tab = document.querySelector('.nav-tab[data-section="phrases"]');
        if (tab) tab.click();
      } else if (hash === 'proyecto' || hash === 'about' || urlParams.get('tab') === 'about' || urlParams.get('tab') === 'proyecto') {
        const tab = document.querySelector('.nav-tab[data-section="about"]');
        if (tab) tab.click();
      } else if (urlParams.get('tab') === 'practice') {
        const mode = urlParams.get('mode');
        if (mode) {
          switchMainSection('practice', () => {
            openPracticeGame(mode);
            if (urlParams.get('autostart') === 'true') {
              if (mode === 'guess') {
                document.getElementById('guess-start-btn')?.click();
                const errs = parseInt(urlParams.get('errors'), 10);
                if (!isNaN(errs) && errs > 0) {
                  State.guess.lives = Math.max(0, State.guess.maxLives - errs);
                  renderAhorcadoHUD();
                  if (State.guess.lives === 0) {
                    triggerAhorcadoGameOver();
                  }
                }
                const testGuesses = urlParams.get('test_guess');
                if (testGuesses) {
                  testGuesses.split(',').forEach((letter, idx) => {
                    setTimeout(() => handleAhorcadoGuess(letter.trim()), idx * 450);
                  });
                }
              }
              if (mode === 'quiz') document.getElementById('quiz-start-btn')?.click();
              if (mode === 'memorama') document.getElementById('memorama-start-btn')?.click();
              if (mode === 'wordsearch' || mode === 'crossword') {
                if (urlParams.get('preview') === 'true') {
                  document.getElementById(`${mode}-preview`)?.click();
                } else {
                  document.getElementById(`${mode}-start`)?.click();
                }
              }
            }
            if (urlParams.get('preview') === 'true' && (mode === 'wordsearch' || mode === 'crossword')) {
              document.getElementById(`${mode}-preview`)?.click();
            }
            if (urlParams.get('flip') === 'true' && mode === 'flashcards') {
              setTimeout(() => {
                toggleFlashcardFlip();
              }, 300);
            }
          });
        } else {
          const practiceTab = document.querySelector('.nav-tab[data-section="practice"]');
          if (practiceTab) practiceTab.click();
        }
      }

      if (urlParams.get('open_cat') === 'true') {
        const trigger = document.getElementById('category-dropdown-trigger');
        if (trigger) trigger.click();
      }

      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.classList.add('hidden');
    } catch (err) {
      console.error(err);
      showGlobalError('Hubo un problema al cargar el diccionario.');
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.classList.add('hidden');
    }
  }

  // ==========================================
  // 5. GESTIÓN DE PALABRAS A REPASAR (⭐)
  // ==========================================
  function loadRepasarFromStorage() {
    try {
      const stored = localStorage.getItem('repasarLexiconIds');
      if (stored) {
        State.repasarIds = new Set(JSON.parse(stored));
      }
    } catch (e) {
      State.repasarIds = new Set();
    }
    updateRepasarBadge();
  }

  function saveRepasarToStorage() {
    try {
      localStorage.setItem('repasarLexiconIds', JSON.stringify(Array.from(State.repasarIds)));
    } catch (e) {}
    updateRepasarBadge();
    populateDropdowns();
  }

  function toggleRepasar(id) {
    if (State.repasarIds.has(id)) {
      State.repasarIds.delete(id);
    } else {
      State.repasarIds.add(id);
    }
    saveRepasarToStorage();
    renderLexicon();
  }

  function updateRepasarBadge() {
    const count = State.repasarIds.size;
    const textEl = document.getElementById('repasar-count-text');
    if (textEl) {
      textEl.textContent = `${count} por repasar`;
    }

    const badge = document.getElementById('repasar-badge');
    if (badge) {
      badge.classList.toggle('has-items', count > 0);
      badge.classList.toggle('active', State.activeCategory === '⭐ Palabras a repasar');
    }

    const popoverCountTag = document.getElementById('popover-cats-count');
    if (popoverCountTag && State.categories.length > 0) {
      popoverCountTag.textContent = `${State.categories.length} categorías`;
    }
  }

  function getWordsBySelection(categoryName) {
    if (categoryName === '⭐ Palabras a repasar') {
      return State.lexicon.filter(w => State.repasarIds.has(w.id));
    }
    if (categoryName === 'Todas' || !categoryName) {
      return State.lexicon;
    }
    return State.lexicon.filter(w => w.category === categoryName);
  }

  function populateDropdowns() {
    const dropdownIds = ['guess-category', 'quiz-category', 'memorama-category', 'flashcard-category-select', 'wordsearch-category', 'crossword-category'];
    const repasarCount = State.repasarIds.size;

    dropdownIds.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;

      const currentVal = select.value;
      select.innerHTML = '';

      const allOpt = document.createElement('option');
      allOpt.value = 'Todas';
      allOpt.textContent = 'Todas las categorías';
      select.appendChild(allOpt);

      if (repasarCount > 0) {
        const repOpt = document.createElement('option');
        repOpt.value = '⭐ Palabras a repasar';
        repOpt.textContent = `Palabras a repasar (${repasarCount})`;
        select.appendChild(repOpt);
      }

      State.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });

      if (currentVal) select.value = currentVal;
    });
  }

  // ==========================================
  // 6. NAVEGACIÓN Y PESTAÑAS (TRANSICIONES FLUIDAS Y LOBBY)
  // ==========================================
  let sectionTransitionTimer = null;
  let practiceTransitionTimer = null;

  function isReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function showPracticeLobby() {
    AudioPlayer.stop();
    const lobby = document.getElementById('practice-lobby');
    const activeGame = document.querySelector('.game-view-panel.active:not(.hidden)');

    if (practiceTransitionTimer) {
      clearTimeout(practiceTransitionTimer);
      practiceTransitionTimer = null;
    }

    if (isReducedMotion() || !activeGame || !lobby) {
      if (lobby) {
        lobby.classList.remove('hidden', 'lobby-exiting');
        lobby.classList.add('lobby-entering');
      }
      document.querySelectorAll('.game-view-panel').forEach(p => {
        p.classList.remove('active', 'game-exiting');
        p.classList.add('hidden');
      });
      return;
    }

    activeGame.classList.add('game-exiting');
    practiceTransitionTimer = setTimeout(() => {
      activeGame.classList.remove('active', 'game-exiting');
      activeGame.classList.add('hidden');

      lobby.classList.remove('hidden', 'lobby-exiting');
      lobby.classList.add('lobby-entering');

      document.querySelectorAll('.game-view-panel').forEach(p => {
        p.classList.remove('active', 'game-exiting');
        p.classList.add('hidden');
      });
      practiceTransitionTimer = null;
    }, 120);
  }

  function openPracticeGame(targetGame) {
    AudioPlayer.stop();
    const lobby = document.getElementById('practice-lobby');
    const targetPanel = document.getElementById(`game-${targetGame}`);
    if (!targetPanel) return;
    window.LetterGames.open(targetGame);

    if (practiceTransitionTimer) {
      clearTimeout(practiceTransitionTimer);
      practiceTransitionTimer = null;
    }

    if (isReducedMotion() || !lobby || lobby.classList.contains('hidden')) {
      if (lobby) lobby.classList.add('hidden');
      document.querySelectorAll('.game-view-panel').forEach(panel => {
        if (panel.id === `game-${targetGame}`) {
          panel.classList.remove('hidden', 'game-exiting');
          panel.classList.add('active');
        } else {
          panel.classList.remove('active', 'game-exiting');
          panel.classList.add('hidden');
        }
      });
      if (targetGame === 'flashcards' && State.flashcards.deck.length === 0) {
        startFlashcards();
      }
      return;
    }

    lobby.classList.add('lobby-exiting');
    practiceTransitionTimer = setTimeout(() => {
      lobby.classList.remove('lobby-entering', 'lobby-exiting');
      lobby.classList.add('hidden');

      document.querySelectorAll('.game-view-panel').forEach(panel => {
        if (panel.id === `game-${targetGame}`) {
          panel.classList.remove('hidden', 'game-exiting');
          panel.classList.add('active');
        } else {
          panel.classList.remove('active', 'game-exiting');
          panel.classList.add('hidden');
        }
      });

      if (targetGame === 'flashcards' && State.flashcards.deck.length === 0) {
        startFlashcards();
      }
      practiceTransitionTimer = null;
    }, 120);
  }

  function switchMainSection(targetSection, onComplete) {
    AudioPlayer.stop();
    const currentActive = document.querySelector('.content-section.active:not(.hidden)');
    const target = document.getElementById(`section-${targetSection}`);
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(t => t.classList.toggle('active', t.dataset.section === targetSection));

    if (!target) return;

    if (currentActive && currentActive.id === `section-${targetSection}`) {
      if (typeof onComplete === 'function') {
        onComplete();
      } else if (targetSection === 'practice') {
        showPracticeLobby();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionTransitionTimer) {
      clearTimeout(sectionTransitionTimer);
      sectionTransitionTimer = null;
    }

    if (isReducedMotion() || !currentActive) {
      document.querySelectorAll('.content-section').forEach(sec => {
        if (sec.id === `section-${targetSection}`) {
          sec.classList.remove('hidden', 'section-exiting');
          sec.classList.add('active');
        } else {
          sec.classList.remove('active', 'section-exiting');
          sec.classList.add('hidden');
        }
      });
      if (typeof onComplete === 'function') {
        onComplete();
      } else if (targetSection === 'practice') {
        showPracticeLobby();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    currentActive.classList.add('section-exiting');
    sectionTransitionTimer = setTimeout(() => {
      currentActive.classList.remove('active', 'section-exiting');
      currentActive.classList.add('hidden');

      target.classList.remove('hidden', 'section-exiting');
      target.classList.add('active');

      if (typeof onComplete === 'function') {
        onComplete();
      } else if (targetSection === 'practice') {
        showPracticeLobby();
      }
      sectionTransitionTimer = null;
    }, 120);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupNavigation() {
    window.addEventListener('hashchange', () => {
      const game = window.location.hash.slice(1).toLowerCase();
      if (['guess', 'quiz', 'memorama', 'flashcards', 'wordsearch', 'crossword'].includes(game)) {
        switchMainSection('practice', () => openPracticeGame(game));
      }
    });
    const navTabs = document.querySelectorAll('.nav-tab');

    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetSection = tab.dataset.section;
        switchMainSection(targetSection);
      });
    });

    // Clic en tarjetas interactivas de actividades de práctica
    const practiceCards = document.querySelectorAll('.practice-activity-card');
    practiceCards.forEach(card => {
      card.addEventListener('click', () => {
        const targetGame = card.dataset.game;
        if (targetGame) {
          openPracticeGame(targetGame);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    // Botones "Volver a Práctica" en cada actividad
    const backBtns = document.querySelectorAll('.back-to-lobby-btn');
    backBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        showPracticeLobby();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Subpestañas legacy de apoyo
    const gameTabs = document.querySelectorAll('.mode-tab-btn');
    gameTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetGame = tab.dataset.game;
        if (targetGame) openPracticeGame(targetGame);
      });
    });

    const closeErrorBtn = document.querySelector('.close-error-btn');
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener('click', () => {
        document.getElementById('error-message')?.classList.add('hidden');
      });
    }
  }

  // ==========================================
  // 7. MÓDULO: LÉXICO (SELECTOR A EDITORIAL + PESPUNTE TEXTIL)
  // ==========================================
  function setupCategoryDropdown() {
    const trigger = document.getElementById('category-dropdown-trigger');
    const popover = document.getElementById('category-popover-menu');
    const grid = document.getElementById('category-popover-grid');
    const triggerIcon = document.getElementById('cat-trigger-icon');
    const triggerName = document.getElementById('cat-trigger-name');

    if (!trigger || !popover || !grid) return;

    // Render initial trigger icon
    if (triggerIcon) {
      triggerIcon.innerHTML = CATEGORY_STAMP_ICONS['Todas'] || '';
    }

    function renderPopoverItems() {
      grid.innerHTML = '';

      // Opción 1: Todas
      const todasBtn = createPopoverCatBtn('Todas', 'Todas', CATEGORY_STAMP_ICONS['Todas']);
      grid.appendChild(todasBtn);

      // Opción 2: Repasar
      const repasarCount = State.repasarIds.size;
      const repasarLabel = repasarCount > 0 ? `Repasar (${repasarCount})` : 'Repasar';
      const repasarBtn = createPopoverCatBtn('⭐ Palabras a repasar', repasarLabel, CATEGORY_STAMP_ICONS['Repasar']);
      grid.appendChild(repasarBtn);

      // Categorías de la base de datos
      State.categories.forEach(cat => {
        const icon = CATEGORY_STAMP_ICONS[cat] || CATEGORY_STAMP_ICONS['Objetos'];
        const catBtn = createPopoverCatBtn(cat, cat, icon);
        grid.appendChild(catBtn);
      });
    }

    function createPopoverCatBtn(catValue, displayLabel, iconSvg) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = State.activeCategory === catValue;
      btn.className = 'popover-cat-item' + (isSelected ? ' is-selected' : '');
      btn.innerHTML = `
        <span class="popover-icon-box">${iconSvg || ''}</span>
        <span class="popover-name-wrap">
          <span class="popover-name">${displayLabel}</span>
        </span>
      `;
      btn.addEventListener('click', () => {
        selectCategory(catValue);
        closePopover();
      });
      return btn;
    }

    function togglePopover() {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closePopover();
      } else {
        renderPopoverItems();
        popover.classList.remove('hidden');
        trigger.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }

    function closePopover() {
      popover.classList.add('hidden');
      trigger.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    }

    if (!trigger.dataset.bound) {
      trigger.dataset.bound = 'true';
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover();
      });
    }

    // Cerrar con click fuera
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('category-dropdown-wrap');
      if (wrap && !wrap.contains(e.target)) {
        closePopover();
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePopover();
      }
    });

    renderPopoverItems();
  }

  function selectCategory(catName) {
    State.activeCategory = catName;
    const triggerName = document.getElementById('cat-trigger-name');
    const triggerIcon = document.getElementById('cat-trigger-icon');

    if (triggerName) {
      if (catName === '⭐ Palabras a repasar') {
        triggerName.textContent = 'Repasar';
      } else {
        triggerName.textContent = catName;
      }
    }

    if (triggerIcon) {
      let stampKey = catName;
      if (catName === '⭐ Palabras a repasar') stampKey = 'Repasar';
      triggerIcon.innerHTML = CATEGORY_STAMP_ICONS[stampKey] || CATEGORY_STAMP_ICONS['Todas'];
    }

    // Marcar visualmente el botón seleccionado en el popover
    document.querySelectorAll('.popover-cat-item').forEach(btn => {
      const nameEl = btn.querySelector('.popover-name');
      const isThis = (catName === '⭐ Palabras a repasar' && nameEl?.textContent.includes('Repasar')) ||
                     (nameEl?.textContent === catName);
      btn.classList.toggle('is-selected', isThis);
    });

    updateRepasarBadge();
    renderLexicon();
  }

  function setupSearchAndRepasar() {
    const searchInput = document.getElementById('lexicon-search');
    const clearBtn = document.getElementById('clear-search-btn');

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', (e) => {
        State.searchTerm = e.target.value.trim().toLowerCase();
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', State.searchTerm === '');
        }
        renderLexicon();
      });
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        State.searchTerm = '';
        clearBtn.classList.add('hidden');
        renderLexicon();
      });
    }

    const repasarBadge = document.getElementById('repasar-badge');
    if (repasarBadge && !repasarBadge.dataset.bound) {
      repasarBadge.dataset.bound = 'true';
      repasarBadge.addEventListener('click', () => {
        if (State.activeCategory === '⭐ Palabras a repasar') {
          selectCategory('Todas');
        } else {
          selectCategory('⭐ Palabras a repasar');
        }
      });
    }

    // Hint / Anotación de bitácora discreta
    const hintEl = document.getElementById('repasar-editorial-hint');
    const dismissBtn = document.getElementById('dismiss-hint-btn');
    const hintDismissed = localStorage.getItem('raramuri_hint_dismissed') === 'true';

    if (hintEl && hintDismissed) {
      hintEl.classList.add('hidden');
    }

    if (dismissBtn && !dismissBtn.dataset.bound) {
      dismissBtn.dataset.bound = 'true';
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissRepasarHint();
      });
    }
  }

  function dismissRepasarHint() {
    const hintEl = document.getElementById('repasar-editorial-hint');
    if (hintEl && !hintEl.classList.contains('fade-out') && !hintEl.classList.contains('hidden')) {
      hintEl.classList.add('fade-out');
      try {
        localStorage.setItem('raramuri_hint_dismissed', 'true');
      } catch(e) {}
      setTimeout(() => hintEl.classList.add('hidden'), 350);
    }
  }

  function renderLexicon() {
    const grid = document.getElementById('lexicon-grid');
    const emptyBox = document.getElementById('lexicon-empty');
    if (!grid) return;

    grid.innerHTML = '';

    let items = getWordsBySelection(State.activeCategory);

    if (State.searchTerm) {
      items = items.filter(w => 
        (w.raramuri && w.raramuri.toLowerCase().includes(State.searchTerm)) ||
        (w.spanish && w.spanish.toLowerCase().includes(State.searchTerm))
      );
    }

    if (items.length === 0) {
      if (emptyBox) emptyBox.classList.remove('hidden');
      return;
    } else {
      if (emptyBox) emptyBox.classList.add('hidden');
    }

    items.forEach(item => {
      const card = document.createElement('div');
      const isMarked = State.repasarIds.has(item.id);
      card.className = 'vocab-card-item' + (isMarked ? ' is-stitched' : '');

      const contourData = (typeof WORD_CONTOURS !== 'undefined' && WORD_CONTOURS[item.id]) ? WORD_CONTOURS[item.id] : null;
      const contourPath = contourData ? contourData.d : '';
      const contourW = contourData ? contourData.w : 500;
      const contourH = contourData ? contourData.h : 500;

      card.innerHTML = `
        <div class="card-thumb-wrap" role="button" tabindex="0" title="${isMarked ? 'Descoser de la lista de repaso' : 'Coser silueta para repasar'}" aria-label="${item.spanish}. ${isMarked ? 'En lista de repaso. Toca para descoser.' : 'Toca para coser silueta a la lista de repaso.'}">
          <div class="thumb-inner">
            <img src="${item.image || 'images/placeholder.png'}" alt="${item.spanish}" onerror="this.src='images/placeholder.png'" loading="lazy">
            ${contourPath ? `
              <svg class="sew-contour-svg" viewBox="0 0 ${contourW} ${contourH}" aria-hidden="true">
                <defs>
                  <mask id="sew-mask-${item.id}">
                    <path class="sew-mask-lead" d="${contourPath}" fill="none" stroke="#ffffff" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="0" />
                  </mask>
                </defs>
                <g mask="url(#sew-mask-${item.id})">
                  <path class="sew-contour-path" d="${contourPath}" />
                </g>
              </svg>
            ` : ''}
          </div>
        </div>
        <div class="card-details">
          <div class="card-text-group">
            <div class="word-native-txt">${item.raramuri}</div>
            <div class="word-spanish-txt">${item.spanish}</div>
          </div>
          <div class="card-action-btns">
            ${item.audio ? `
              <button class="card-play-audio-btn" data-audio="${item.audio}" aria-label="Escuchar pronunciación de ${item.raramuri}" title="Escuchar pronunciación">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      // Clic en la ilustración: costura de pespunte con animación en tiempo real
      const thumb = card.querySelector('.card-thumb-wrap');
      if (thumb) {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentlyMarked = State.repasarIds.has(item.id);

          if (!currentlyMarked) {
            State.repasarIds.add(item.id);
            card.classList.add('is-stitched');
            card.classList.remove('just-stitched');
            // Forzar reflow para reiniciar la animación de pespunte
            void card.offsetWidth;
            card.classList.add('just-stitched');
            thumb.setAttribute('title', 'Descoser de la lista de repaso');

            // Sonidos rítmicos de aguja y puntadas recorriendo la silueta
            SoundFX.playTone(880, 0.05, 'triangle', 0.12);
            setTimeout(() => SoundFX.playTone(1046, 0.05, 'triangle', 0.11), 220);
            setTimeout(() => SoundFX.playTone(1318, 0.05, 'triangle', 0.10), 450);
            setTimeout(() => SoundFX.playTone(1760, 0.07, 'sine', 0.08), 680);

            setTimeout(() => {
              card.classList.remove('just-stitched');
            }, 850);

            dismissRepasarHint();
          } else {
            State.repasarIds.delete(item.id);
            card.classList.remove('is-stitched', 'just-stitched');
            thumb.setAttribute('title', 'Coser silueta para repasar');

            // Sonido suave de soltar puntada
            SoundFX.playTone(440, 0.06, 'sine', 0.08);

            if (State.activeCategory === '⭐ Palabras a repasar') {
              card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.85)';
              setTimeout(() => {
                renderLexicon();
              }, 260);
            }
          }

          saveRepasarToStorage();
          updateRepasarBadge();
        });
      }

      const audioBtn = card.querySelector('.card-play-audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          AudioPlayer.play(item.audio);
        });
      }

      grid.appendChild(card);
    });
  }

  // ==========================================
  // 8. MÓDULO: FRASES
  // ==========================================
  function renderPhrases() {
    const list = document.getElementById('phrases-list');
    if (!list) return;

    list.innerHTML = '';
    State.phrases.forEach(phrase => {
      const card = document.createElement('div');
      card.className = 'phrase-card-item';
      card.innerHTML = `
        <div class="phrase-ra-text">${phrase.raramuri}</div>
        <div class="phrase-es-text">${phrase.spanish}</div>
      `;
      list.appendChild(card);
    });
  }

  // ==========================================
  // 9. MÓDULO: AHORCADO (CON VIDAS Y GAME OVER)
  // ==========================================
  function setupAhorcado() {
    const startBtn = document.getElementById('guess-start-btn');
    const nextBtn = document.getElementById('guess-next-btn');
    const retryBtn = document.getElementById('guess-retry-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const catSelect = document.getElementById('guess-category');
        State.guess.category = catSelect ? catSelect.value : 'Todas';
        State.guess.pool = getWordsBySelection(State.guess.category);
        if (State.guess.pool.length === 0) {
          alert('No hay palabras disponibles en esta categoría.');
          return;
        }
        State.guess.score = 0;
        document.getElementById('guess-setup')?.classList.add('hidden');
        document.getElementById('guess-game-area')?.classList.remove('hidden');
        document.getElementById('guess-game-over')?.classList.add('hidden');
        nextAhorcadoWord();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextAhorcadoWord();
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        document.getElementById('guess-game-over')?.classList.add('hidden');
        document.getElementById('guess-game-area')?.classList.remove('hidden');
        nextAhorcadoWord();
      });
    }

    window.addEventListener('keydown', (e) => {
      const guessArea = document.getElementById('guess-game-area');
      if (!guessArea || guessArea.classList.contains('hidden')) return;

      const key = e.key.toLowerCase();
      if (RARAMURI_ALPHABET.includes(key)) {
        handleAhorcadoGuess(key);
      }
    });
  }

  let isGuessAnimating = false;

  function nextAhorcadoWord() {
    const g = State.guess;
    isGuessAnimating = false;
    g.isWon = false;
    if (g.pool.length === 0) {
      g.pool = getWordsBySelection(g.category);
    }

    const randomIndex = Math.floor(Math.random() * g.pool.length);
    g.currentWord = g.pool[randomIndex];
    g.guessedLetters = new Set();
    g.lives = g.maxLives;

    const stage = document.getElementById('guess-vasija-stage');
    if (stage) stage.classList.remove('vibrating', 'shatter-critical');

    renderAhorcadoHUD();
    renderAhorcadoSlots();
    renderAhorcadoKeyboard();

    const hintEl = document.getElementById('guess-hint');
    if (hintEl) hintEl.textContent = g.currentWord.spanish;

    const imgContainer = document.getElementById('guess-image-container');
    if (imgContainer) {
      imgContainer.innerHTML = `<img src="${g.currentWord.image || 'images/placeholder.png'}" alt="${g.currentWord.spanish}" onerror="if(!this.dataset.triedJpg){this.dataset.triedJpg='true';this.src=this.src.replace('_nobg.png','.jpg');}else{this.src='images/placeholder.png';}">`;
    }

    const feedback = document.getElementById('guess-feedback');
    if (feedback) feedback.classList.add('hidden');

    const nextBtn = document.getElementById('guess-next-btn');
    if (nextBtn) nextBtn.classList.add('hidden');
  }

  function renderAhorcadoHUD() {
    const errorCount = State.guess.maxLives - State.guess.lives;
    const vasijaIndex = Math.min(5, Math.max(0, errorCount));

    // 1. Imagen de la Vasija Sekorí (0=intacta, 1..4=agrietándose, 5=rota)
    const vasijaImg = document.getElementById('guess-vasija-img');
    if (vasijaImg) {
      vasijaImg.src = `images/vasija/vasija_${vasijaIndex}.png`;
      vasijaImg.alt = `Vasija Sekorí (Fase ${vasijaIndex} de 5)`;
    }

    // 2. Estado textual descriptivo breve
    const statusLabels = [
      'Intacta',
      '1 grieta',
      '2 grietas',
      'Muy agrietada',
      '¡Casi rota!',
      'La vasija se rompió'
    ];
    const statusClasses = ['intact', 'warning-1', 'warning-1', 'warning-2', 'danger', 'danger'];

    const statusLabel = document.getElementById('vasija-status-label');
    if (statusLabel) {
      statusLabel.textContent = statusLabels[vasijaIndex] || 'Intacta';
      statusLabel.className = `vasija-status-pill ${statusClasses[vasijaIndex] || 'intact'}`;
    }

    // 3. Aciertos acumulados en la cabecera
    const scoreEl = document.getElementById('guess-score');
    if (scoreEl) scoreEl.textContent = State.guess.score;
  }

  function renderAhorcadoSlots(revealedChar = null) {
    const container = document.getElementById('guess-word-slots');
    if (!container || !State.guess.currentWord) return;

    container.innerHTML = '';
    const word = State.guess.currentWord.raramuri.toLowerCase();

    for (let char of word) {
      const slot = document.createElement('div');
      slot.className = 'guess-slot-box';

      if (char === ' ') {
        slot.classList.add('space-slot');
        slot.textContent = ' ';
      } else if (State.guess.guessedLetters.has(char)) {
        slot.textContent = char;
        slot.classList.add('has-letter');
        if (char === revealedChar) {
          slot.classList.add('revealed-pop');
        }
      } else {
        slot.textContent = '';
      }
      container.appendChild(slot);
    }
  }

  function renderAhorcadoKeyboard() {
    const kb = document.getElementById('guess-keyboard');
    if (!kb) return;

    kb.innerHTML = '';
    RARAMURI_ALPHABET.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'key-duo-btn';
      btn.dataset.letter = letter;
      btn.textContent = letter;

      if (State.guess.guessedLetters.has(letter)) {
        const inWord = State.guess.currentWord.raramuri.toLowerCase().includes(letter);
        btn.classList.add(inWord ? 'correct' : 'incorrect');
        btn.disabled = true;
      }

      btn.addEventListener('click', () => handleAhorcadoGuess(letter));
      kb.appendChild(btn);
    });
  }

  function handleAhorcadoGuess(letter) {
    const g = State.guess;
    if (g.lives <= 0 || g.isWon || g.guessedLetters.has(letter) || !g.currentWord || isGuessAnimating) return;

    g.guessedLetters.add(letter);
    const word = g.currentWord.raramuri.toLowerCase();

    const kb = document.getElementById('guess-keyboard');
    const keyBtn = kb ? kb.querySelector(`button[data-letter="${letter}"]`) : null;

    if (word.includes(letter)) {
      if (keyBtn) {
        keyBtn.classList.add('correct');
        keyBtn.disabled = true;
      }
      SoundFX.playFlip();
      renderAhorcadoSlots(letter);
      checkAhorcadoWin();
    } else {
      // Microinteracción 1: la tecla vibra y se apaga en rojo
      if (keyBtn) {
        keyBtn.classList.add('incorrect', 'micro-shake');
        keyBtn.disabled = true;
      }
      SoundFX.playTone(200, 0.07, 'sawtooth', 0.08);

      g.lives--;
      isGuessAnimating = true;

      // Microinteracción 2: vibración breve en la vasija y crujido
      const stage = document.getElementById('guess-vasija-stage');
      if (stage) {
        stage.classList.remove('vibrating');
        void stage.offsetWidth; // Forzar reflow
        stage.classList.add('vibrating');
      }

      if (g.lives > 0) {
        SoundFX.playVasijaCrack();
      } else {
        SoundFX.playVasijaShatter();
      }

      renderAhorcadoHUD();
      isGuessAnimating = false;

      if (g.lives <= 0) {
        setTimeout(() => triggerAhorcadoGameOver(), 550);
      }
    }
  }

  function checkAhorcadoWin() {
    const word = State.guess.currentWord.raramuri.toLowerCase();
    const isComplete = Array.from(word).every(char => char === ' ' || State.guess.guessedLetters.has(char));

    if (isComplete) {
      State.guess.isWon = true;
      State.guess.score++;
      SoundFX.playSuccess();
      Confetti.burst();
      renderAhorcadoHUD();
      if (State.guess.currentWord.audio) {
        AudioPlayer.play(State.guess.currentWord.audio);
      }

      const feedback = document.getElementById('guess-feedback');
      if (feedback) {
        feedback.className = 'guess-feedback-box correct';
        feedback.textContent = '¡Correcto! Has salvado la vasija y completado la palabra.';
        feedback.classList.remove('hidden');
      }

      document.getElementById('guess-next-btn')?.classList.remove('hidden');
    }
  }

  function triggerAhorcadoGameOver() {
    document.getElementById('guess-game-area')?.classList.add('hidden');
    const gameOverScreen = document.getElementById('guess-game-over');
    if (gameOverScreen) {
      gameOverScreen.classList.remove('hidden');
      document.getElementById('guess-reveal-word').textContent = State.guess.currentWord.raramuri;
      document.getElementById('guess-final-score').textContent = State.guess.score;
    }
  }

  // ==========================================
  // 10. MÓDULO: QUIZ
  // ==========================================
  function setupQuiz() {
    const startBtn = document.getElementById('quiz-start-btn');
    const lengthBtns = document.querySelectorAll('#quiz-length-options .pill-toggle');

    lengthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        lengthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.quiz.totalQuestions = btn.dataset.length === 'all' ? 'all' : parseInt(btn.dataset.length, 10);
      });
    });

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const catSelect = document.getElementById('quiz-category');
        State.quiz.category = catSelect ? catSelect.value : 'Todas';
        startQuizRound();
      });
    }

    document.getElementById('quiz-next-btn')?.addEventListener('click', nextQuizQuestion);
    document.getElementById('quiz-restart-btn')?.addEventListener('click', () => {
      document.getElementById('quiz-results')?.classList.add('hidden');
      document.getElementById('quiz-setup')?.classList.remove('hidden');
    });
    document.getElementById('quiz-retry-missed-btn')?.addEventListener('click', retryMissedQuiz);

    const submitTextBtn = document.getElementById('quiz-submit-text');
    const textInput = document.getElementById('quiz-text-input');
    if (submitTextBtn && textInput) {
      submitTextBtn.addEventListener('click', () => handleQuizTextAnswer());
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleQuizTextAnswer();
      });
    }
  }

  function startQuizRound() {
    const words = getWordsBySelection(State.quiz.category);
    if (words.length < 4) {
      alert('Se necesitan al menos 4 palabras en esta categoría para jugar el Quiz.');
      return;
    }

    const count = State.quiz.totalQuestions === 'all' ? words.length : Math.min(State.quiz.totalQuestions, words.length);
    const shuffled = [...words].sort(() => 0.5 - Math.random()).slice(0, count);

    State.quiz.questions = shuffled.map(w => generateQuizQuestion(w, words));
    State.quiz.currentIndex = 0;
    State.quiz.score = 0;
    State.quiz.missedQuestions = [];

    document.getElementById('quiz-setup')?.classList.add('hidden');
    document.getElementById('quiz-results')?.classList.add('hidden');
    document.getElementById('quiz-question-area')?.classList.remove('hidden');

    renderQuizQuestion();
  }

  function generateQuizQuestion(targetWord, allWords) {
    const types = ['MC_RaSp', 'MC_SpRa', 'MC_ImgRa', 'TXT_SpRa'];
    const type = types[Math.floor(Math.random() * types.length)];

    const distractors = allWords.filter(w => w.id !== targetWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [targetWord, ...distractors].sort(() => 0.5 - Math.random());

    return { type, targetWord, options, answered: false };
  }

  function renderQuizQuestion() {
    const q = State.quiz.questions[State.quiz.currentIndex];
    const total = State.quiz.questions.length;

    document.getElementById('quiz-current-q').textContent = State.quiz.currentIndex + 1;
    document.getElementById('quiz-total-q').textContent = total;
    document.getElementById('quiz-progress-bar').style.width = `${((State.quiz.currentIndex) / total) * 100}%`;

    const imgContainer = document.getElementById('quiz-image-container');
    const statementEl = document.getElementById('quiz-question-text');
    const optionsGrid = document.getElementById('quiz-options');
    const textInputArea = document.getElementById('quiz-text-input-area');
    const textInput = document.getElementById('quiz-text-input');
    const feedbackBar = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    feedbackBar.classList.add('hidden');
    nextBtn.classList.add('hidden');

    const fallbackImgHandler = `onerror="if(!this.dataset.triedJpg){this.dataset.triedJpg='true';this.src=this.src.replace('_nobg.png','.jpg');}else{this.src='images/placeholder.png';}"`;

    if (q.type === 'TXT_SpRa') {
      optionsGrid.classList.add('hidden');
      textInputArea.classList.remove('hidden');
      if (textInput) {
        textInput.value = '';
        textInput.disabled = false;
        textInput.focus();
      }
      if (imgContainer) {
        imgContainer.classList.remove('hidden');
        imgContainer.innerHTML = `<img src="${q.targetWord.image || 'images/placeholder.png'}" alt="" ${fallbackImgHandler}>`;
      }
      statementEl.textContent = `Escribe en rarámuri: "${q.targetWord.spanish}"`;
    } else {
      textInputArea.classList.add('hidden');
      optionsGrid.classList.remove('hidden');
      optionsGrid.innerHTML = '';

      if (q.type === 'MC_ImgRa') {
        if (imgContainer) {
          imgContainer.classList.remove('hidden');
          imgContainer.innerHTML = `<img src="${q.targetWord.image || 'images/placeholder.png'}" alt="" ${fallbackImgHandler}>`;
        }
        statementEl.textContent = '¿Cómo se dice esto en rarámuri?';
      } else if (q.type === 'MC_RaSp') {
        if (imgContainer) {
          imgContainer.classList.add('hidden');
          imgContainer.innerHTML = '';
        }
        statementEl.textContent = `¿Qué significa "${q.targetWord.raramuri}"?`;
      } else {
        if (imgContainer) {
          imgContainer.classList.add('hidden');
          imgContainer.innerHTML = '';
        }
        statementEl.textContent = `¿Cómo se dice "${q.targetWord.spanish}" en rarámuri?`;
      }

      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-choice-btn';
        btn.textContent = q.type === 'MC_RaSp' ? opt.spanish : opt.raramuri;

        btn.addEventListener('click', (e) => {
          if (q.answered) return;
          q.answered = true;

          const isCorrect = opt.id === q.targetWord.id;
          if (isCorrect) {
            State.quiz.score++;
            SoundFX.playSuccess();
            Confetti.burst(e.clientX, e.clientY, 25);
            btn.classList.add('correct-choice');
            feedbackBar.className = 'feedback-answer-bar correct';
            feedbackBar.textContent = '¡Correcto! Muy bien hecho.';
            if (q.targetWord.audio) AudioPlayer.play(q.targetWord.audio);
          } else {
            SoundFX.playError();
            State.quiz.missedQuestions.push(q);
            btn.classList.add('wrong-choice');
            feedbackBar.className = 'feedback-answer-bar error';
            feedbackBar.textContent = `Incorrecto. La respuesta era: ${q.type === 'MC_RaSp' ? q.targetWord.spanish : q.targetWord.raramuri}`;
          }
          feedbackBar.classList.remove('hidden');
          nextBtn.classList.remove('hidden');
        });

        optionsGrid.appendChild(btn);
      });
    }
  }

  function handleQuizTextAnswer() {
    const q = State.quiz.questions[State.quiz.currentIndex];
    if (q.answered) return;

    const input = document.getElementById('quiz-text-input');
    const feedbackBar = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    if (!input || !feedbackBar) return;

    q.answered = true;
    input.disabled = true;

    const userAns = input.value.trim().toLowerCase();
    const correctAns = q.targetWord.raramuri.trim().toLowerCase();

    if (userAns === correctAns) {
      State.quiz.score++;
      SoundFX.playSuccess();
      Confetti.burst();
      feedbackBar.className = 'feedback-answer-bar correct';
      feedbackBar.textContent = '¡Exacto! Respuesta correcta.';
      if (q.targetWord.audio) AudioPlayer.play(q.targetWord.audio);
    } else {
      SoundFX.playError();
      State.quiz.missedQuestions.push(q);
      feedbackBar.className = 'feedback-answer-bar error';
      feedbackBar.textContent = `Respuesta correcta: ${q.targetWord.raramuri}`;
    }

    feedbackBar.classList.remove('hidden');
    nextBtn?.classList.remove('hidden');
  }

  function nextQuizQuestion() {
    State.quiz.currentIndex++;
    if (State.quiz.currentIndex < State.quiz.questions.length) {
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    document.getElementById('quiz-question-area')?.classList.add('hidden');
    const results = document.getElementById('quiz-results');
    results?.classList.remove('hidden');

    const total = State.quiz.questions.length;
    const score = State.quiz.score;
    const pct = Math.round((score / total) * 100);

    if (pct >= 70) {
      SoundFX.playWin();
      Confetti.burst(null, null, 60);
    }

    document.getElementById('quiz-score').textContent = score;
    document.getElementById('quiz-score-total').textContent = total;
    document.getElementById('quiz-percentage').textContent = `${pct}%`;

    const retryMissedBtn = document.getElementById('quiz-retry-missed-btn');
    if (retryMissedBtn) {
      retryMissedBtn.classList.toggle('hidden', State.quiz.missedQuestions.length === 0);
    }
  }

  function retryMissedQuiz() {
    State.quiz.questions = [...State.quiz.missedQuestions].map(q => ({ ...q, answered: false }));
    State.quiz.currentIndex = 0;
    State.quiz.score = 0;
    State.quiz.missedQuestions = [];

    document.getElementById('quiz-results')?.classList.add('hidden');
    document.getElementById('quiz-question-area')?.classList.remove('hidden');
    renderQuizQuestion();
  }

  // ==========================================
  // 11. MÓDULO: MEMORAMA (FUNCIONAMIENTO COMPLETO)
  // ==========================================
  function setupMemorama() {
    const startBtn = document.getElementById('memorama-start-btn');
    const diffBtns = document.querySelectorAll('#memorama-diff-options .pill-toggle');
    const resetBtn = document.getElementById('memorama-reset-btn');
    const playAgainBtn = document.getElementById('memorama-play-again');

    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.memorama.totalPairs = parseInt(btn.dataset.pairs, 10);
      });
    });

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const catSelect = document.getElementById('memorama-category');
        State.memorama.category = catSelect ? catSelect.value : 'Todas';
        startMemorama();
      });
    }

    if (resetBtn) resetBtn.addEventListener('click', startMemorama);
    if (playAgainBtn) playAgainBtn.addEventListener('click', startMemorama);
  }

  function startMemorama() {
    const words = getWordsBySelection(State.memorama.category);
    const pairsCount = State.memorama.totalPairs;

    if (words.length < pairsCount) {
      alert(`Se necesitan al menos ${pairsCount} palabras en esta categoría.`);
      return;
    }

    const selectedWords = [...words].sort(() => 0.5 - Math.random()).slice(0, pairsCount);

    const cards = [];
    selectedWords.forEach(w => {
      cards.push({ id: w.id, type: 'image', content: w.image, audio: w.audio });
      cards.push({ id: w.id, type: 'text', content: w.raramuri, audio: w.audio });
    });

    State.memorama.cards = cards.sort(() => 0.5 - Math.random());
    State.memorama.flippedCards = [];
    State.memorama.matchedCount = 0;
    State.memorama.attempts = 0;
    State.memorama.locked = false;

    document.getElementById('memorama-attempts').textContent = '0';
    document.getElementById('memorama-setup')?.classList.add('hidden');
    document.getElementById('memorama-win-banner')?.classList.add('hidden');
    document.getElementById('memorama-game-area')?.classList.remove('hidden');

    renderMemoramaGrid();
  }

  function renderMemoramaGrid() {
    const grid = document.getElementById('memorama-grid');
    if (!grid) return;

    grid.className = 'memorama-cards-stage pairs-' + State.memorama.totalPairs;
    grid.innerHTML = '';
    State.memorama.cards.forEach((cardData, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memo-card-unit';
      cardEl.dataset.index = idx;

      cardEl.innerHTML = `
        <div class="memo-card-inner-box">
          <div class="memo-face memo-back"></div>
          <div class="memo-face memo-front">
            ${cardData.type === 'image' 
              ? `<img src="${cardData.content}" alt="" onerror="this.src='images/placeholder.png'">`
              : `<span class="memo-text-label">${cardData.content}</span>`}
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => handleMemoramaFlip(cardEl, cardData));
      grid.appendChild(cardEl);
    });
  }

  function handleMemoramaFlip(cardEl, cardData) {
    const m = State.memorama;
    if (m.locked || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    SoundFX.playFlip();
    cardEl.classList.add('flipped');
    m.flippedCards.push({ element: cardEl, data: cardData });

    if (m.flippedCards.length === 2) {
      m.attempts++;
      document.getElementById('memorama-attempts').textContent = m.attempts;

      const [c1, c2] = m.flippedCards;
      if (c1.data.id === c2.data.id) {
        m.matchedCount++;
        setTimeout(() => {
          c1.element.classList.add('matched');
          c2.element.classList.add('matched');
          SoundFX.playSuccess();
          const rect = c2.element.getBoundingClientRect();
          Confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);

          if (c1.data.audio) AudioPlayer.play(c1.data.audio);
          m.flippedCards = [];

          if (m.matchedCount === m.totalPairs) {
            setTimeout(() => {
              SoundFX.playWin();
              Confetti.burst(null, null, 60);
              document.getElementById('memorama-win-attempts').textContent = m.attempts;
              document.getElementById('memorama-win-banner')?.classList.remove('hidden');
            }, 500);
          }
        }, 300);
      } else {
        m.locked = true;
        setTimeout(() => {
          SoundFX.playError();
          c1.element.classList.remove('flipped');
          c2.element.classList.remove('flipped');
          m.flippedCards = [];
          m.locked = false;
        }, 750);
      }
    }
  }

  // ==========================================
  // 12. MÓDULO: FLASHCARDS (SIN RECUADROS, COMPACTO Y EDUCATIVO)
  // ==========================================
  function setupFlashcards() {
    const catSelect = document.getElementById('flashcard-category-select');
    const shuffleBtn = document.getElementById('flashcard-shuffle');
    const card = document.getElementById('flashcard');
    const prevBtn = document.getElementById('flashcard-prev');
    const nextBtn = document.getElementById('flashcard-next');
    const flipBtn = document.getElementById('flashcard-flip');
    const audioBtn = document.getElementById('fc-audio-btn');

    if (catSelect) {
      catSelect.addEventListener('change', () => {
        State.flashcards.category = catSelect.value;
        startFlashcards();
      });
    }

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (!State.flashcards.deck || State.flashcards.deck.length === 0) {
          State.flashcards.deck = [...getWordsBySelection(State.flashcards.category)];
        }

        const deck = State.flashcards.deck;
        if (deck.length > 1) {
          const currentWordId = deck[State.flashcards.currentIndex]?.id;

          // Algoritmo de barajado Fisher-Yates
          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }

          // Garantizar que la primera tarjeta visible sea diferente a la actual
          if (deck[0].id === currentWordId) {
            const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1));
            [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
          }
        }

        State.flashcards.currentIndex = 0;
        State.flashcards.isFlipped = false;

        // Feedback visual en el botón de mezclar
        shuffleBtn.classList.remove('is-shuffling');
        void shuffleBtn.offsetWidth;
        shuffleBtn.classList.add('is-shuffling');
        setTimeout(() => shuffleBtn.classList.remove('is-shuffling'), 450);

        // Feedback táctil/animación en la tarjeta
        if (card) {
          card.classList.remove('fc-shuffling');
          void card.offsetWidth;
          card.classList.add('fc-shuffling');
          setTimeout(() => card.classList.remove('fc-shuffling'), 400);
        }

        SoundFX.playFlip();
        renderCurrentFlashcard();
      });
    }

    if (card) {
      card.addEventListener('click', () => toggleFlashcardFlip());
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleFlashcardFlip();
        }
      });
    }

    if (flipBtn) {
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFlashcardFlip();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (State.flashcards.currentIndex > 0) {
          State.flashcards.currentIndex--;
          State.flashcards.isFlipped = false;
          renderCurrentFlashcard();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (State.flashcards.currentIndex < State.flashcards.deck.length - 1) {
          State.flashcards.currentIndex++;
          State.flashcards.isFlipped = false;
          renderCurrentFlashcard();
        }
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = State.flashcards.deck[State.flashcards.currentIndex];
        if (current && current.audio) AudioPlayer.play(current.audio);
      });
    }

    // Atajos de teclado mientras flashcards esté visible
    window.addEventListener('keydown', (e) => {
      const fcPanel = document.getElementById('game-flashcards');
      if (!fcPanel || fcPanel.classList.contains('hidden')) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextBtn?.click();
      } else if (e.key === ' ' && document.activeElement !== card) {
        // Solo si no estamos escribiendo en un input
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
          e.preventDefault();
          toggleFlashcardFlip();
        }
      }
    });
  }

  function startFlashcards() {
    const rawWords = getWordsBySelection(State.flashcards.category);
    State.flashcards.deck = [...rawWords];
    State.flashcards.currentIndex = 0;
    State.flashcards.isFlipped = false;
    renderCurrentFlashcard();
  }

  function toggleFlashcardFlip() {
    State.flashcards.isFlipped = !State.flashcards.isFlipped;
    SoundFX.playFlip();
    const card = document.getElementById('flashcard');
    if (card) {
      card.classList.toggle('flipped', State.flashcards.isFlipped);
    }
    if (State.flashcards.isFlipped) {
      const current = State.flashcards.deck[State.flashcards.currentIndex];
      if (current && current.audio) {
        AudioPlayer.play(current.audio);
      }
    }
  }

  function renderCurrentFlashcard() {
    const card = document.getElementById('flashcard');
    const f = State.flashcards;
    if (card) card.classList.toggle('flipped', f.isFlipped);

    const prevBtn = document.getElementById('flashcard-prev');
    const nextBtn = document.getElementById('flashcard-next');
    const counterEl = document.getElementById('flashcard-counter');
    const progressFill = document.getElementById('flashcard-progress-fill');
    const audioBtn = document.getElementById('fc-audio-btn');

    if (f.deck.length === 0) {
      document.getElementById('fc-spanish').textContent = 'No hay palabras';
      document.getElementById('fc-raramuri').textContent = '---';
      if (counterEl) counterEl.textContent = '0 de 0';
      if (progressFill) progressFill.style.width = '0%';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (audioBtn) audioBtn.style.display = 'none';
      return;
    }

    const word = f.deck[f.currentIndex];
    const imgSrc = word.image || 'images/placeholder.png';
    const fallbackHandler = function() {
      if (!this.dataset.triedJpg) {
        this.dataset.triedJpg = 'true';
        this.src = this.src.replace('_nobg.png', '.jpg');
      } else {
        this.src = 'images/placeholder.png';
      }
    };

    const frontImg = document.getElementById('fc-img');
    const backImg = document.getElementById('fc-img-back');
    if (frontImg) {
      frontImg.src = imgSrc;
      frontImg.onerror = fallbackHandler;
    }
    if (backImg) {
      backImg.src = imgSrc;
      backImg.onerror = fallbackHandler;
    }

    document.getElementById('fc-spanish').textContent = word.spanish;
    document.getElementById('fc-raramuri').textContent = word.raramuri;

    if (audioBtn) {
      audioBtn.style.display = word.audio ? 'inline-flex' : 'none';
      audioBtn.title = `Escuchar pronunciación de ${word.raramuri}`;
      audioBtn.setAttribute('aria-label', `Escuchar pronunciación de ${word.raramuri}`);
    }

    const total = f.deck.length;
    const currentNum = f.currentIndex + 1;
    if (counterEl) counterEl.textContent = `${currentNum} de ${total}`;
    if (progressFill) {
      progressFill.style.width = `${(currentNum / total) * 100}%`;
    }

    if (prevBtn) prevBtn.disabled = (f.currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (f.currentIndex === total - 1);
  }

  function showGlobalError(msg) {
    const errEl = document.getElementById('error-message');
    if (errEl) {
      errEl.querySelector('.error-text').textContent = msg;
      errEl.classList.remove('hidden');
    }
  }

  // ==========================================
  // 13. INICIO AUTOMÁTICO
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

})();

