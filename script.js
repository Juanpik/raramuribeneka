// script.js — Rarámuri Be'neka
// Conserva toda la funcionalidad original: léxico con filtros y búsqueda,
// lista de repaso (localStorage), audio, memorama, quiz y flashcards.

document.addEventListener('DOMContentLoaded', () => {
    // --- DATOS ---
    let lexiconData = [];
    let phrasesData = [];
    let currentCategoryFilter = 'all';
    let repasarLexiconIds = [];
    let currentAudio = null;

    // --- ICONOS DE CATEGORÍA ---
    const categoryIcons = {
        'Naturaleza': '🌳', 'Comida y bebida': '🍎', 'Verbos': '🏃‍♂️',
        'Animales': '🐾', 'Partes del cuerpo': '🖐️', 'Objetos': '🔨',
        'Personas': '🧍‍♀️', 'Vestimenta': '🧦', 'Colores': '🎨',
        'Lugares': '🏡', 'Adjetivos': '✨', 'all': '',
        'repasar': '⭐'
    };
    const defaultCategoryIcon = '🏷️';

    // --- ELEMENTOS DEL DOM ---
    const loadingMessageEl = document.getElementById('loading-message');
    const errorMessageEl = document.getElementById('error-message');
    const mainContentEl = document.getElementById('main-content-inner');
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');

    const lexiconGrid = document.getElementById('lexicon-grid');
    const lexiconSearchInput = document.getElementById('lexicon-search');
    const categoryFiltersContainer = document.getElementById('category-filters');

    const phrasesList = document.getElementById('phrases-list');

    const memoramaSetup = document.getElementById('memorama-setup');
    const memoramaCategorySelect = document.getElementById('memorama-category');
    const memoramaGameArea = document.getElementById('memorama-game-area');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const memoramaGrid = document.getElementById('memorama-grid');
    const memoramaAttemptsEl = document.getElementById('memorama-attempts');
    const resetMemoramaBtn = document.getElementById('reset-memorama');
    const memoramaWinMessage = document.getElementById('memorama-win-message');
    const memoramaDataErrorEl = document.getElementById('memorama-data-error');

    const quizContainer = document.getElementById('quiz-container');
    const quizSetup = document.getElementById('quiz-setup');
    const quizLengthSelect = document.getElementById('quiz-length');
    const quizCategorySelect = document.getElementById('quiz-category');
    const startQuizBtn = document.getElementById('start-quiz');
    const quizQuestionArea = document.getElementById('quiz-question-area');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    const quizImageContainer = document.getElementById('quiz-image-container');
    const quizQuestionEl = document.getElementById('quiz-question');
    const quizOptionsEl = document.getElementById('quiz-options');
    const quizTextInputArea = document.getElementById('quiz-text-input-area');
    const quizTextAnswerInput = document.getElementById('quiz-text-answer');
    const submitTextAnswerBtn = document.getElementById('submit-text-answer');
    const quizFeedbackEl = document.getElementById('quiz-feedback');
    const nextQuestionBtn = document.getElementById('next-question');
    const quizResultsEl = document.getElementById('quiz-results');
    const quizScoreEl = document.getElementById('quiz-score');
    const quizTotalEl = document.getElementById('quiz-total');
    const restartQuizBtn = document.getElementById('restart-quiz');
    const retryMissedQuizBtn = document.getElementById('retry-missed-quiz');
    const quizDataErrorEl = document.getElementById('quiz-data-error');

    const flashcardsContainer = document.getElementById('flashcards-container');
    const flashcardsSetupControls = document.getElementById('flashcards-setup-controls');
    const flashcardCategorySelect = document.getElementById('flashcard-category');
    const flashcardsDataErrorEl = document.getElementById('flashcards-data-error');
    const flashcardsLoadingEl = document.getElementById('flashcards-loading');
    const flashcardsErrorEl = document.getElementById('flashcards-error');
    const flashcardAreaEl = document.getElementById('flashcard-area');
    const flashcardCounterEl = document.getElementById('flashcard-counter');
    const flashcardEl = document.getElementById('flashcard');
    const flashcardFrontEl = document.getElementById('flashcard-front');
    const flashcardBackEl = document.getElementById('flashcard-back');
    const prevFlashcardBtn = document.getElementById('prev-flashcard-btn');
    const flipFlashcardBtn = document.getElementById('flip-flashcard-btn');
    const nextFlashcardBtn = document.getElementById('next-flashcard-btn');
    const shuffleFlashcardsBtn = document.getElementById('shuffle-flashcards-btn');

    const guessSetup = document.getElementById('guess-setup');
    const guessCategorySelect = document.getElementById('guess-category');
    const startGuessBtn = document.getElementById('start-guess');
    const guessDataErrorEl = document.getElementById('guess-data-error');
    const guessGameArea = document.getElementById('guess-game-area');
    const guessLivesEl = document.getElementById('guess-lives');
    const guessScoreEl = document.getElementById('guess-score');
    const guessImageContainer = document.getElementById('guess-image-container');
    const guessSpanishWordEl = document.getElementById('guess-spanish-word');
    const guessWordSlotsEl = document.getElementById('guess-word-slots');
    const guessKeyboardEl = document.getElementById('guess-keyboard');
    const guessFeedbackEl = document.getElementById('guess-feedback');
    const guessNextBtn = document.getElementById('guess-next-btn');
    const guessRoundEnd = document.getElementById('guess-round-end');
    const guessRoundTitle = document.getElementById('guess-round-title');
    const guessRoundMessage = document.getElementById('guess-round-message');
    const guessPlayAgainBtn = document.getElementById('guess-play-again');

    let memoramaActive = false;
    let mCards = [];
    let mFlippedElements = [];
    let mMatchedPairsCount = 0;
    let mTotalPairs = 0;
    let mAttempts = 0;
    let mLockBoard = false;

    let allQuizQuestions = [];
    let currentQuizSet = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let quizActive = false;
    let missedQuestions = [];

    let flashcardData = [];
    let currentFlashcardIndex = 0;
    let isFlashcardFlipped = false;

    const GUESS_MAX_LIVES = 5;
    let guessPool = [];
    let guessCurrentWord = null;
    let guessRevealedLetters = new Set();
    let guessWrongLetters = new Set();
    let guessLivesLeft = GUESS_MAX_LIVES;
    let guessRoundScore = 0;
    let guessActive = false;
    const GUESS_KEYBOARD_LETTERS = ['a','b','c','d','e','g','h','i','j','k','l','m','n','o','p','r','s','t','u','w','y',"'",'á','é','í','ó','ú'];

    // --- "PALABRAS A REPASAR" (LocalStorage) ---
    const REPASAR_STORAGE_KEY = 'repasarLexiconIds';

    function loadRepasarIds() {
        try {
            const storedIds = localStorage.getItem(REPASAR_STORAGE_KEY);
            repasarLexiconIds = storedIds ? JSON.parse(storedIds) : [];
        } catch (e) {
            repasarLexiconIds = [];
        }
    }

    function saveRepasarIds() {
        try { localStorage.setItem(REPASAR_STORAGE_KEY, JSON.stringify(repasarLexiconIds)); } catch (e) {}
        updateAllRepasarOptions();
    }

    function addRepasarId(id) {
        if (!repasarLexiconIds.includes(id)) {
            repasarLexiconIds.push(id);
            saveRepasarIds();
        }
    }

    function removeRepasarId(id) {
        repasarLexiconIds = repasarLexiconIds.filter(repasarId => repasarId !== id);
        saveRepasarIds();
    }

    function isRepasarItem(id) {
        return repasarLexiconIds.includes(id);
    }

    function getRepasarItems() {
        return lexiconData.filter(item => repasarLexiconIds.includes(item.id));
    }

    // --- AUDIO ---
    function playAudio(audioSrc) {
        if (!audioSrc) return;
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentAudio = new Audio(audioSrc);
        currentAudio.play().catch(error => {
            console.error(`Error reproduciendo audio: ${audioSrc}`, error);
        });
    }

    // --- CARGA DE DATOS ---
    async function loadData() {
        try {
            if (loadingMessageEl) loadingMessageEl.style.display = 'flex';
            if (errorMessageEl) errorMessageEl.style.display = 'none';
            if (mainContentEl) mainContentEl.hidden = true;

            const response = await fetch('data.json', { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Error HTTP al cargar data.json: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (!data || typeof data !== 'object' || !Array.isArray(data.lexicon) || !Array.isArray(data.phrases)) {
                throw new Error("El archivo data.json no tiene el formato esperado.");
            }

            lexiconData = data.lexicon;
            phrasesData = data.phrases;

            loadRepasarIds();

            if (loadingMessageEl) loadingMessageEl.style.display = 'none';
            if (mainContentEl) mainContentEl.hidden = false;
            if (errorMessageEl) errorMessageEl.style.display = 'none';

            initializeApplication();

        } catch (error) {
            console.error("Error al cargar/procesar datos:", error);
            if (loadingMessageEl) loadingMessageEl.style.display = 'none';
            if (errorMessageEl) {
                errorMessageEl.textContent = `Error cargando datos: ${error.message}. Revisa data.json y la consola.`;
                errorMessageEl.style.display = 'block';
            }
            if (mainContentEl) mainContentEl.hidden = true;
        }
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function normalizeAnswer(text) {
        return text ? String(text).toLowerCase().trim() : '';
    }

    // --- NAVEGACIÓN ---
    function setupNavigation() {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.getAttribute('data-section');
                contentSections.forEach(section => section.classList.remove('active'));
                navButtons.forEach(btn => btn.classList.remove('active'));

                const currentSection = document.getElementById(sectionId);
                if (currentSection) currentSection.classList.add('active');
                button.classList.add('active');

                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }

                if (sectionId === 'memorama') resetMemoramaView();
                else if (sectionId === 'quiz') resetQuizView();
                else if (sectionId === 'flashcards') initializeFlashcardsView();
                else if (sectionId === 'guess') resetGuessView();
                if (sectionId === 'lexicon') filterAndDisplayLexicon();
            });
        });
        const aboutButton = document.querySelector('.nav-btn[data-section="about"]');
        const aboutSection = document.getElementById('about');
        if (aboutButton && aboutSection) {
            aboutButton.classList.add('active');
            aboutSection.classList.add('active');
        } else if (navButtons.length > 0 && contentSections.length > 0) {
            navButtons[0].classList.add('active');
            contentSections[0].classList.add('active');
        }
    }

    function updateRepasarOptionInSelect(selectElement) {
        if (!selectElement) return;
        let repasarOption = selectElement.querySelector('option[value="repasar"]');
        const repasarCount = repasarLexiconIds.length;
        if (repasarCount > 0) {
            if (!repasarOption) {
                repasarOption = document.createElement('option');
                repasarOption.value = 'repasar';
                const allOption = selectElement.querySelector('option[value="all"]');
                if (allOption && allOption.nextSibling) selectElement.insertBefore(repasarOption, allOption.nextSibling);
                else if (allOption) selectElement.appendChild(repasarOption);
                else selectElement.insertBefore(repasarOption, selectElement.firstChild);
            }
            repasarOption.textContent = `⭐ Palabras a repasar (${repasarCount})`;
            repasarOption.disabled = false;
        } else {
            if (repasarOption) {
                if (selectElement.value === 'repasar') selectElement.value = 'all';
                repasarOption.disabled = true;
                repasarOption.textContent = `⭐ Palabras a repasar (0) — marca algunas`;
            }
        }
    }

    function updateAllRepasarOptions() {
        [quizCategorySelect, memoramaCategorySelect, flashcardCategorySelect, guessCategorySelect].forEach(sel => {
            updateRepasarOptionInSelect(sel);
        });
    }

    function populateCategorySelect(selectElement, categories) {
        if (!selectElement || !categories) return;
        const currentValue = selectElement.value;
        selectElement.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Todas las categorías';
        selectElement.appendChild(allOption);
        categories.filter(cat => cat !== 'all' && cat !== 'repasar').forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
        updateRepasarOptionInSelect(selectElement);
        if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
            selectElement.value = currentValue;
        } else if (selectElement.options.length > 0) {
            selectElement.value = selectElement.options[0].value;
        }
    }

    function getUniqueCategories(data) {
        const categories = new Set();
        data.forEach(item => {
            if (item.category && item.category.trim() !== '') {
                categories.add(item.category.trim());
            }
        });
        return Array.from(categories).sort();
    }

    function populateCategoryFilters() {
        if (!categoryFiltersContainer || !lexiconData) return;
        const uniqueCategories = getUniqueCategories(lexiconData);
        const categoriesForButtons = ['all', ...uniqueCategories];
        categoryFiltersContainer.innerHTML = '';
        if (categoriesForButtons.length <= 1) {
            categoryFiltersContainer.style.display = 'none';
            return;
        }
        categoryFiltersContainer.style.display = 'flex';
        categoriesForButtons.forEach(category => {
            const button = document.createElement('button');
            const categoryName = category === 'all' ? 'Todos' : category;
            let icon = category === 'all' ? (categoryIcons['all'] || '') : (categoryIcons[category] || defaultCategoryIcon);
            button.textContent = icon ? `${icon} ${categoryName}` : categoryName;
            button.dataset.category = category;
            button.classList.add('category-filter-btn');
            if (category === currentCategoryFilter) button.classList.add('active');
            button.addEventListener('click', handleCategoryFilterClick);
            categoryFiltersContainer.appendChild(button);
        });
    }

    function handleCategoryFilterClick(event) {
        currentCategoryFilter = event.currentTarget.dataset.category;
        document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        filterAndDisplayLexicon();
    }

    function displayLexiconItems(itemsToShow) {
        if (!lexiconGrid) return;
        lexiconGrid.innerHTML = '';

        if (!itemsToShow || itemsToShow.length === 0) {
            const isFiltered = (lexiconSearchInput && lexiconSearchInput.value) || currentCategoryFilter !== 'all';
            const message = isFiltered ? 'No se encontraron coincidencias.' : 'No hay datos léxicos.';
            lexiconGrid.innerHTML = `<p class="text-center text-secondary" style="grid-column: 1 / -1;">${message}</p>`;
            return;
        }

        itemsToShow.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('lexicon-item');
            div.dataset.id = item.id;

            const imgSrc = item.image || 'images/placeholder.png';
            const spanishText = item.spanish || '???';
            const raramuriText = item.raramuri || '???';

            div.innerHTML = `
                <img src="${imgSrc}"
                     alt="${spanishText}"
                     loading="lazy"
                     class="${isRepasarItem(item.id) ? 'repasar-image-marked' : ''}"
                     title="${isRepasarItem(item.id) ? 'Quitar de repasar (clic en imagen)' : 'Marcar para repasar (clic en imagen)'}">
                <div class="lexicon-word-container">
                    <p class="raramuri-word" lang="rar">${raramuriText}</p>
                    ${item.audio ? `<button class="play-audio-btn lexicon-audio-btn" data-audio-src="${item.audio}" aria-label="Reproducir audio de ${raramuriText}">🔊</button>` : ''}
                </div>
                <p class="spanish-word">${spanishText}</p>
            `;
            lexiconGrid.appendChild(div);

            const imageElementInDOM = div.querySelector('img');
            if (imageElementInDOM) {
                imageElementInDOM.addEventListener('error', function handleImgError() {
                    this.removeEventListener('error', handleImgError);
                    this.src = 'images/placeholder.png';
                    this.alt = `Error al cargar: ${raramuriText}`;
                });
                imageElementInDOM.addEventListener('click', () => {
                    toggleRepasarItemPorImagen(item.id, imageElementInDOM);
                });
            }

            if (item.audio) {
                const audioButtonInDOM = div.querySelector('.play-audio-btn.lexicon-audio-btn');
                if (audioButtonInDOM) {
                    audioButtonInDOM.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playAudio(e.currentTarget.dataset.audioSrc);
                    });
                }
            }
        });
    }

    function toggleRepasarItemPorImagen(itemId, imageElement) {
        if (isRepasarItem(itemId)) {
            removeRepasarId(itemId);
            imageElement.classList.remove('repasar-image-marked');
            imageElement.title = "Marcar para repasar (clic en imagen)";
        } else {
            addRepasarId(itemId);
            imageElement.classList.add('repasar-image-marked');
            imageElement.title = "Quitar de repasar (clic en imagen)";
        }
    }

    function filterAndDisplayLexicon() {
        if (!lexiconData) return;
        const searchTerm = lexiconSearchInput ? lexiconSearchInput.value.toLowerCase().trim() : '';
        let filteredItems = lexiconData;

        if (currentCategoryFilter !== 'all') {
            filteredItems = filteredItems.filter(item => item.category && item.category === currentCategoryFilter);
        }
        if (searchTerm) {
            filteredItems = filteredItems.filter(item =>
                ((item.raramuri ? item.raramuri.toLowerCase() : '').includes(searchTerm) ||
                (item.spanish ? item.spanish.toLowerCase() : '').includes(searchTerm))
            );
        }
        displayLexiconItems(filteredItems);
    }

    function setupSearch() {
        if (lexiconSearchInput) {
            lexiconSearchInput.addEventListener('input', filterAndDisplayLexicon);
        }
    }

    function populatePhrases() {
        if (!phrasesList) return;
        phrasesList.innerHTML = '';
        if (!phrasesData || phrasesData.length === 0) {
            phrasesList.innerHTML = '<li class="text-secondary">No hay frases disponibles.</li>';
            return;
        }
        phrasesData.forEach(phrase => {
            if (phrase.raramuri && phrase.spanish) {
                const li = document.createElement('li');
                li.innerHTML = `<span class="raramuri-phrase" lang="rar">${phrase.raramuri}</span><span class="spanish-phrase">${phrase.spanish}</span>`;
                phrasesList.appendChild(li);
            }
        });
    }

    // --- MEMORAMA ---
    function resetMemoramaView() {
        if (memoramaSetup) memoramaSetup.style.display = 'flex';
        if (memoramaGameArea) memoramaGameArea.hidden = true;
        if (memoramaWinMessage) memoramaWinMessage.hidden = true;
        if (memoramaDataErrorEl) memoramaDataErrorEl.hidden = true;
        if (memoramaGrid) memoramaGrid.innerHTML = '';
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        updateRepasarOptionInSelect(memoramaCategorySelect);
        memoramaActive = false; mCards = []; mFlippedElements = []; mMatchedPairsCount = 0; mTotalPairs = 0; mAttempts = 0; mLockBoard = false;
        if (memoramaAttemptsEl) memoramaAttemptsEl.textContent = '0';
    }

    function createMemoramaFaceContent(cardInfo, faceElement) {
        if (!cardInfo || !faceElement) return;
        faceElement.innerHTML = '';
        try {
            if (cardInfo.type === 'image' && cardInfo.value) {
                const img = document.createElement('img');
                img.src = cardInfo.value; img.alt = cardInfo.altText || "Imagen Memorama"; img.loading = 'lazy';
                img.onerror = function () {
                    this.style.display = 'none';
                    const eP = document.createElement('p'); eP.textContent = 'Error Img!'; eP.style.color = 'var(--error-red)';
                    faceElement.appendChild(eP);
                };
                faceElement.appendChild(img);
            } else if (cardInfo.type === 'text' && cardInfo.value) {
                const textP = document.createElement('p'); textP.textContent = cardInfo.value; textP.setAttribute('lang', 'rar'); faceElement.appendChild(textP);
            } else {
                const fallbackP = document.createElement('p'); fallbackP.textContent = '??'; fallbackP.style.opacity = '0.5'; faceElement.appendChild(fallbackP);
            }
        } catch (e) {
            console.error("[Memorama] Excepción en createMemoramaFaceContent:", e, cardInfo);
        }
    }

    function prepareCardData(requestedPairs) {
        const selectedCategory = memoramaCategorySelect ? memoramaCategorySelect.value : 'all';
        let itemsForCategory;
        if (selectedCategory === 'repasar') {
            itemsForCategory = getRepasarItems();
            if (itemsForCategory.length === 0) {
                if (memoramaDataErrorEl) { memoramaDataErrorEl.textContent = `No has marcado palabras para repasar. Ve a la sección Léxico y marca algunas haciendo clic en su imagen ⭐.`; memoramaDataErrorEl.hidden = false; }
                if (memoramaGameArea) memoramaGameArea.hidden = true; if (memoramaSetup) memoramaSetup.style.display = 'flex';
                difficultyButtons.forEach(btn => btn.classList.remove('selected')); return null;
            }
        } else if (selectedCategory !== 'all') {
            itemsForCategory = lexiconData.filter(item => item.category && item.category === selectedCategory);
        } else { itemsForCategory = lexiconData; }
        const validItems = itemsForCategory.filter(item => item && item.id != null && item.image && item.raramuri && item.spanish);
        if (validItems.length < requestedPairs) {
            const categoryDisplayName = selectedCategory === 'all' ? "todas las categorías" : selectedCategory === 'repasar' ? "tus palabras a repasar" : `la categoría "${selectedCategory}"`;
            if (memoramaDataErrorEl) { memoramaDataErrorEl.textContent = `Datos insuficientes (${validItems.length}) con imagen en ${categoryDisplayName} para ${requestedPairs} pares. Intenta otra categoría/dificultad o marca más palabras para repasar.`; memoramaDataErrorEl.hidden = false; }
            if (memoramaGameArea) memoramaGameArea.hidden = true; if (memoramaSetup) memoramaSetup.style.display = 'flex';
            difficultyButtons.forEach(btn => btn.classList.remove('selected')); return null;
        }
        if (memoramaDataErrorEl) memoramaDataErrorEl.hidden = true;
        const shuffledValidItems = shuffleArray(validItems);
        return shuffledValidItems.slice(0, requestedPairs);
    }

    function buildMemoramaGrid() {
        if (!memoramaGrid) return;
        memoramaGrid.innerHTML = '';
        mCards.forEach((cardData, index) => {
            const cardElement = document.createElement('div'); cardElement.classList.add('memorama-card');
            if (cardData.id === undefined || cardData.id === null) return;
            cardElement.dataset.id = cardData.id; cardElement.dataset.index = index;
            const frontFace = document.createElement('div'); frontFace.classList.add('mem-card-face', 'mem-card-front'); createMemoramaFaceContent(cardData, frontFace);
            const backFace = document.createElement('div'); backFace.classList.add('mem-card-face', 'mem-card-back');
            cardElement.appendChild(frontFace); cardElement.appendChild(backFace); cardElement.addEventListener('click', handleMemoramaCardClick);
            memoramaGrid.appendChild(cardElement);
        });
        let columns = Math.ceil(Math.sqrt(mCards.length)); columns = Math.max(2, Math.min(columns, 5));
        memoramaGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    function startMemorama(numPairs) {
        resetMemoramaView();
        const itemsForGame = prepareCardData(numPairs); if (!itemsForGame) { memoramaActive = false; return; }
        mTotalPairs = itemsForGame.length; memoramaActive = true; mCards = []; mAttempts = 0; mMatchedPairsCount = 0; mFlippedElements = []; mLockBoard = false;
        if (memoramaAttemptsEl) memoramaAttemptsEl.textContent = mAttempts; if (memoramaWinMessage) memoramaWinMessage.hidden = true;
        itemsForGame.forEach(item => {
            mCards.push({ id: item.id, type: 'image', value: item.image, altText: item.spanish });
            mCards.push({ id: item.id, type: 'text', value: item.raramuri });
        });
        mCards = shuffleArray(mCards); buildMemoramaGrid();
        if (memoramaSetup) memoramaSetup.style.display = 'none'; if (memoramaGameArea) memoramaGameArea.hidden = false;
    }

    function handleMemoramaCardClick(event) {
        if (!memoramaActive || mLockBoard || !event.currentTarget) return;
        const clickedCardElement = event.currentTarget;
        if (clickedCardElement.classList.contains('flipped') || clickedCardElement.classList.contains('matched')) return;
        clickedCardElement.classList.add('flipped'); mFlippedElements.push(clickedCardElement);
        if (mFlippedElements.length === 2) { mLockBoard = true; mAttempts++; if (memoramaAttemptsEl) memoramaAttemptsEl.textContent = mAttempts; checkMemoramaMatch(); }
    }

    function checkMemoramaMatch() {
        const [card1, card2] = mFlippedElements;
        if (!card1 || !card2) { mFlippedElements = []; mLockBoard = false; return; }
        const isMatch = card1.dataset.id === card2.dataset.id;
        if (isMatch) {
            mMatchedPairsCount++;
            setTimeout(() => {
                card1.classList.add('matched'); card2.classList.add('matched'); mFlippedElements = []; mLockBoard = false;
                if (mMatchedPairsCount === mTotalPairs) {
                    if (memoramaWinMessage) { memoramaWinMessage.textContent = `¡Felicidades! ${mTotalPairs} pares en ${mAttempts} intentos.`; memoramaWinMessage.hidden = false; }
                    memoramaActive = false;
                }
            }, 300);
        } else {
            setTimeout(() => { card1.classList.remove('flipped'); card2.classList.remove('flipped'); mFlippedElements = []; mLockBoard = false; }, 1000);
        }
    }

    function setupMemoramaControls() {
        if (!memoramaSetup || !resetMemoramaBtn || difficultyButtons.length === 0 || !memoramaCategorySelect) return;
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pairs = parseInt(button.getAttribute('data-pairs'));
                if (isNaN(pairs) || pairs <= 0) return;
                difficultyButtons.forEach(btn => btn.classList.remove('selected')); button.classList.add('selected'); startMemorama(pairs);
            });
        });
        resetMemoramaBtn.addEventListener('click', () => {
            const selectedBtn = document.querySelector('#memorama-setup .difficulty-btn.selected');
            if (selectedBtn) { const pairs = parseInt(selectedBtn.getAttribute('data-pairs')); if (!isNaN(pairs) && pairs > 0) { startMemorama(pairs); } else { resetMemoramaView(); } }
            else { resetMemoramaView(); }
        });
        memoramaCategorySelect.addEventListener('change', () => { resetMemoramaView(); });
    }

    // --- QUIZ ---
    function getWrongOptions(correctItem, count, sourceData, field) {
        if (!correctItem || !field || !sourceData) return [];
        const correctValueNorm = normalizeAnswer(correctItem[field]);
        const wrongAnswerPool = sourceData.filter(item => item && item.id !== correctItem.id && item[field] && normalizeAnswer(item[field]) !== correctValueNorm);
        const shuffledWrongs = shuffleArray([...wrongAnswerPool]); let options = new Set();
        for (const item of shuffledWrongs) { if (options.size >= count) break; options.add(item[field]); }
        let attempts = 0; const maxAttempts = sourceData.length * 2;
        while (options.size < count && attempts < maxAttempts) {
            const randomItem = sourceData[Math.floor(Math.random() * sourceData.length)];
            if (randomItem && randomItem[field] && normalizeAnswer(randomItem[field]) !== correctValueNorm) { options.add(randomItem[field]); }
            attempts++;
        }
        return Array.from(options);
    }

    function generateQuizQuestions(numQuestions) {
        const selectedCategory = quizCategorySelect ? quizCategorySelect.value : 'all';
        let categoryFilteredItems;
        if (selectedCategory === 'repasar') {
            categoryFilteredItems = getRepasarItems();
            if (categoryFilteredItems.length === 0) {
                if (quizDataErrorEl) {
                    quizDataErrorEl.textContent = `No has marcado palabras para repasar. Ve a la sección Léxico y marca algunas haciendo clic en su imagen ⭐.`;
                    quizDataErrorEl.hidden = false;
                }
                return [];
            }
        } else if (selectedCategory === 'all') {
            categoryFilteredItems = lexiconData.filter(item => item && item.id != null && item.raramuri && item.spanish);
        } else {
            categoryFilteredItems = lexiconData.filter(item =>
                item && item.id != null && item.raramuri && item.spanish &&
                item.category && item.category === selectedCategory
            );
        }

        if (categoryFilteredItems.length < 1) {
            if (quizDataErrorEl) {
                const catDisplay = selectedCategory === 'all' ? 'todas las categorías' :
                    selectedCategory === 'repasar' ? "tus palabras a repasar" :
                        `la categoría "${selectedCategory}"`;
                quizDataErrorEl.textContent = `Datos insuficientes (${categoryFilteredItems.length}) para ${catDisplay}.`;
                quizDataErrorEl.hidden = false;
            }
            return [];
        } else {
            if (quizDataErrorEl) quizDataErrorEl.hidden = true;
        }

        const availableLexiconItems = categoryFilteredItems;
        const availableImageItems = availableLexiconItems.filter(item => item.image);
        const potentialQuestions = [];

        availableLexiconItems.forEach(item => {
            potentialQuestions.push({ type: 'MC_RaSp', item: item, question: `¿Qué significa "${item.raramuri}"?`, answer: item.spanish });
            potentialQuestions.push({ type: 'MC_SpRa', item: item, question: `¿Cómo se dice "${item.spanish}" en rarámuri?`, answer: item.raramuri });
            potentialQuestions.push({ type: 'TXT_SpRa', item: item, question: `Escribe "${item.spanish}" en rarámuri:`, answer: item.raramuri });
        });
        availableImageItems.forEach(item => {
            potentialQuestions.push({ type: 'MC_ImgRa', item: item, question: `¿Qué es esto en rarámuri?`, answer: item.raramuri, image: item.image });
            potentialQuestions.push({ type: 'TXT_ImgRa', item: item, question: `Escribe en rarámuri qué ves:`, answer: item.raramuri, image: item.image });
        });

        const shuffledPotentialQuestions = shuffleArray(potentialQuestions);
        let questionsToGenerate = 0;
        const totalPotential = shuffledPotentialQuestions.length;

        if (totalPotential === 0) {
            if (quizDataErrorEl) {
                const catDisplay = selectedCategory === 'all' ? 'estas categorías' :
                    selectedCategory === 'repasar' ? "tus palabras a repasar" :
                        `la categoría "${selectedCategory}"`;
                quizDataErrorEl.textContent = `No se pudieron generar preguntas para ${catDisplay}.`;
                quizDataErrorEl.hidden = false;
            }
            return [];
        }

        if (numQuestions === 'all') { questionsToGenerate = totalPotential; }
        else { questionsToGenerate = Math.min(parseInt(numQuestions), totalPotential); }
        questionsToGenerate = Math.max(1, questionsToGenerate);
        const finalQuestions = shuffledPotentialQuestions.slice(0, questionsToGenerate);

        finalQuestions.forEach(q => {
            if (q.type.startsWith('MC_')) {
                let wrongOptions = []; let field = '';
                if (q.type === 'MC_RaSp') field = 'spanish';
                else if (q.type === 'MC_SpRa' || q.type === 'MC_ImgRa') field = 'raramuri';

                if (field && q.item) {
                    const potentialWrongPool = availableLexiconItems.filter(item => item && item.id !== q.item.id);
                    wrongOptions = getWrongOptions(q.item, 3, potentialWrongPool, field);
                    const allOptions = [q.answer, ...wrongOptions];
                    const uniqueOptions = Array.from(new Set(allOptions.filter(opt => opt && opt.trim() !== '')));
                    q.options = shuffleArray(uniqueOptions.slice(0, 4));
                } else { q.options = [q.answer]; }

                while (q.options.length < 2 && q.options.length < availableLexiconItems.length && availableLexiconItems.length >= 2) {
                    let randomItem = availableLexiconItems[Math.floor(Math.random() * availableLexiconItems.length)];
                    if (randomItem && randomItem[field] && randomItem[field] !== q.answer && !q.options.includes(randomItem[field])) {
                        q.options.push(randomItem[field]);
                    } else {
                        break;
                    }
                }
            }
        });
        return finalQuestions;
    }

    function updateQuizProgressBar() {
        if (!quizProgressBar || !currentQuizSet || currentQuizSet.length === 0) return;
        const pct = (currentQuestionIndex / currentQuizSet.length) * 100;
        quizProgressBar.style.width = `${pct}%`;
    }

    function startQuiz(isRetry = false) {
        quizActive = true; score = 0; currentQuestionIndex = 0;
        if (quizDataErrorEl) quizDataErrorEl.hidden = true;

        if (!isRetry) {
            const selectedLength = quizLengthSelect ? quizLengthSelect.value : '5';
            allQuizQuestions = generateQuizQuestions(selectedLength);
            currentQuizSet = allQuizQuestions;
            missedQuestions = [];
        } else {
            currentQuizSet = shuffleArray([...missedQuestions]);
            missedQuestions = [];
            if (currentQuizSet.length === 0) { alert("¡Felicidades! No hubo preguntas falladas."); resetQuizView(); return; }
        }

        if (!currentQuizSet || currentQuizSet.length === 0) {
            if (quizQuestionArea) quizQuestionArea.hidden = true;
            if (quizSetup) quizSetup.style.display = 'flex';
            if (quizResultsEl) quizResultsEl.hidden = true;
            if (retryMissedQuizBtn) retryMissedQuizBtn.hidden = true;
            quizActive = false;
            return;
        }

        if (quizSetup) quizSetup.style.display = 'none';
        if (quizResultsEl) quizResultsEl.hidden = true;
        if (retryMissedQuizBtn) retryMissedQuizBtn.hidden = true;
        if (quizQuestionArea) quizQuestionArea.hidden = false;
        if (nextQuestionBtn) nextQuestionBtn.hidden = true;
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentQuizSet.length) { showResults(); return; }
        quizActive = true;
        updateQuizProgressBar();
        const q = currentQuizSet[currentQuestionIndex];

        if (!q || typeof q.type === 'undefined' || typeof q.question === 'undefined' || typeof q.answer === 'undefined') {
            if (quizFeedbackEl) { quizFeedbackEl.textContent = "Error al cargar pregunta."; quizFeedbackEl.className = 'quiz-feedback incorrect'; }
            quizActive = false; if (nextQuestionBtn) nextQuestionBtn.hidden = false;
            setTimeout(goToNextQuestion, 1000);
            return;
        }

        if (quizQuestionEl) quizQuestionEl.textContent = q.question;
        if (quizImageContainer) quizImageContainer.innerHTML = '';
        if (quizOptionsEl) { quizOptionsEl.innerHTML = ''; quizOptionsEl.style.display = 'none'; }
        if (quizTextInputArea) quizTextInputArea.hidden = true;
        if (quizTextAnswerInput) { quizTextAnswerInput.value = ''; quizTextAnswerInput.className = ''; quizTextAnswerInput.disabled = false; }
        if (submitTextAnswerBtn) submitTextAnswerBtn.disabled = false;
        if (quizFeedbackEl) { quizFeedbackEl.textContent = ''; quizFeedbackEl.className = 'quiz-feedback'; }
        if (nextQuestionBtn) nextQuestionBtn.hidden = true;

        if (q.image && quizImageContainer) {
            const img = document.createElement('img'); img.src = q.image; img.alt = `Imagen: ${q.question}`; img.loading = 'lazy';
            img.onerror = function () { this.alt = 'Error img'; this.src = 'images/placeholder.png'; };
            quizImageContainer.appendChild(img);
        }

        if (q.type.startsWith('MC_') && quizOptionsEl) {
            quizOptionsEl.style.display = 'flex';
            if (!Array.isArray(q.options) || q.options.length === 0) {
                quizOptionsEl.innerHTML = '<p style="color:var(--error-red);">Error opciones.</p>';
                quizActive = false; if (nextQuestionBtn) nextQuestionBtn.hidden = false;
            } else {
                q.options.forEach(option => {
                    const button = document.createElement('button'); button.textContent = option; button.disabled = false;
                    button.addEventListener('click', handleMCAnswer);
                    quizOptionsEl.appendChild(button);
                });
            }
        } else if (q.type.startsWith('TXT_') && quizTextInputArea && quizTextAnswerInput && submitTextAnswerBtn) {
            quizTextInputArea.hidden = false;
            if (q.answer) quizTextAnswerInput.setAttribute('lang', 'rar'); else quizTextAnswerInput.removeAttribute('lang');
            setTimeout(() => { if (quizTextAnswerInput) quizTextAnswerInput.focus(); }, 100);
        } else {
            if (quizFeedbackEl) { quizFeedbackEl.textContent = "Error: Tipo desconocido."; quizFeedbackEl.className = 'quiz-feedback incorrect'; }
            quizActive = false; if (nextQuestionBtn) nextQuestionBtn.hidden = false;
        }
    }

    function handleMCAnswer(event) {
        if (!quizActive || !quizOptionsEl || !quizFeedbackEl || !nextQuestionBtn) return;
        quizActive = false;
        const selectedButton = event.currentTarget;
        const selectedAnswer = selectedButton.textContent;
        const currentQuestion = currentQuizSet[currentQuestionIndex];

        if (!currentQuestion || typeof currentQuestion.answer === 'undefined') {
            if (quizFeedbackEl) { quizFeedbackEl.textContent = "Error verificando respuesta."; quizFeedbackEl.className = 'quiz-feedback incorrect'; }
            quizOptionsEl.querySelectorAll('button').forEach(btn => btn.disabled = true);
            if (nextQuestionBtn) nextQuestionBtn.hidden = false;
            return;
        }
        const correctAnswer = currentQuestion.answer;
        const optionButtons = quizOptionsEl.querySelectorAll('button');
        optionButtons.forEach(btn => btn.disabled = true);

        if (selectedAnswer === correctAnswer) {
            score++; selectedButton.classList.add('correct');
            quizFeedbackEl.textContent = '¡Correcto!'; quizFeedbackEl.className = 'quiz-feedback correct';
        } else {
            selectedButton.classList.add('incorrect');
            quizFeedbackEl.innerHTML = `Incorrecto. Correcto: <strong lang="${currentQuestion.answer.includes(' ') ? 'es' : 'rar'}">${correctAnswer}</strong>`; quizFeedbackEl.className = 'quiz-feedback incorrect';
            if (currentQuestion.item && !missedQuestions.some(mq => mq.item.id === currentQuestion.item.id)) {
                missedQuestions.push(JSON.parse(JSON.stringify(currentQuestion)));
            }
            optionButtons.forEach(btn => { if (btn.textContent === correctAnswer) btn.classList.add('correct'); });
        }
        if (nextQuestionBtn) nextQuestionBtn.hidden = false;
    }

    function handleTextAnswer() {
        if (!quizActive || !quizTextAnswerInput || !submitTextAnswerBtn || !quizFeedbackEl || !nextQuestionBtn) return;
        quizActive = false;
        const currentQuestion = currentQuizSet[currentQuestionIndex];
        if (!currentQuestion || typeof currentQuestion.answer === 'undefined') {
            if (quizFeedbackEl) { quizFeedbackEl.textContent = "Error verificando respuesta."; quizFeedbackEl.className = 'quiz-feedback incorrect'; }
            if (quizTextAnswerInput) quizTextAnswerInput.disabled = true;
            if (submitTextAnswerBtn) submitTextAnswerBtn.disabled = true;
            if (nextQuestionBtn) nextQuestionBtn.hidden = false;
            return;
        }
        const userAnswer = normalizeAnswer(quizTextAnswerInput.value);
        const correctAnswerNorm = normalizeAnswer(currentQuestion.answer);
        const originalCorrectAnswer = currentQuestion.answer;

        if (quizTextAnswerInput) quizTextAnswerInput.disabled = true;
        if (submitTextAnswerBtn) submitTextAnswerBtn.disabled = true;

        if (userAnswer === correctAnswerNorm && userAnswer !== '') {
            score++; if (quizTextAnswerInput) quizTextAnswerInput.classList.add('correct');
            quizFeedbackEl.textContent = '¡Correcto!'; quizFeedbackEl.className = 'quiz-feedback correct';
        } else {
            if (quizTextAnswerInput) quizTextAnswerInput.classList.add('incorrect');
            quizFeedbackEl.innerHTML = `Incorrecto. Correcto: <strong lang="rar">${originalCorrectAnswer}</strong>`; quizFeedbackEl.className = 'quiz-feedback incorrect';
            if (currentQuestion.item && !missedQuestions.some(mq => mq.item.id === currentQuestion.item.id)) {
                missedQuestions.push(JSON.parse(JSON.stringify(currentQuestion)));
            }
        }
        if (nextQuestionBtn) nextQuestionBtn.hidden = false;
    }

    function goToNextQuestion() {
        currentQuestionIndex++;
        setTimeout(displayQuestion, 50);
    }

    function showResults() {
        if (quizQuestionArea) quizQuestionArea.hidden = true;
        if (quizResultsEl) quizResultsEl.hidden = false;
        if (quizScoreEl) quizScoreEl.textContent = score;
        if (quizTotalEl && currentQuizSet) quizTotalEl.textContent = currentQuizSet.length;
        if (quizProgressBar) quizProgressBar.style.width = '100%';
        quizActive = false;
        const wasMainQuizRound = (currentQuizSet === allQuizQuestions);
        if (missedQuestions.length > 0 && wasMainQuizRound && retryMissedQuizBtn) {
            retryMissedQuizBtn.hidden = false;
        } else if (retryMissedQuizBtn) {
            retryMissedQuizBtn.hidden = true;
        }
    }

    function resetQuizView() {
        quizActive = false; allQuizQuestions = []; currentQuizSet = []; missedQuestions = [];
        score = 0; currentQuestionIndex = 0;

        if (quizSetup) quizSetup.style.display = 'flex';
        if (quizQuestionArea) quizQuestionArea.hidden = true;
        if (quizResultsEl) quizResultsEl.hidden = true;
        if (retryMissedQuizBtn) retryMissedQuizBtn.hidden = true;
        if (quizProgressBar) quizProgressBar.style.width = '0%';

        if (quizCategorySelect) {
            if (quizCategorySelect.options.length > 0) quizCategorySelect.value = 'all';
            if (lexiconData.length > 0 && quizCategorySelect.options.length <= 1) {
                const uniqueCategories = getUniqueCategories(lexiconData);
                populateCategorySelect(quizCategorySelect, uniqueCategories);
            } else {
                updateRepasarOptionInSelect(quizCategorySelect);
            }
            quizCategorySelect.disabled = (Array.from(quizCategorySelect.options).filter(opt => opt.value !== 'repasar').length <= 1) && repasarLexiconIds.length === 0;
        }
        if (quizDataErrorEl) quizDataErrorEl.hidden = true;

        if (quizImageContainer) quizImageContainer.innerHTML = '';
        if (quizFeedbackEl) { quizFeedbackEl.textContent = ''; quizFeedbackEl.className = 'quiz-feedback'; }
        if (quizOptionsEl) quizOptionsEl.innerHTML = '';
        if (quizTextInputArea) quizTextInputArea.hidden = true;
        if (quizTextAnswerInput) { quizTextAnswerInput.value = ''; quizTextAnswerInput.className = ''; quizTextAnswerInput.removeAttribute('lang'); }
        if (quizQuestionEl) quizQuestionEl.textContent = '';
        if (quizLengthSelect) quizLengthSelect.value = "5";
    }

    function setupQuizControls() {
        if (!startQuizBtn || !nextQuestionBtn || !restartQuizBtn || !retryMissedQuizBtn || !submitTextAnswerBtn || !quizTextAnswerInput || !quizLengthSelect || !quizCategorySelect) return;
        startQuizBtn.addEventListener('click', () => startQuiz(false));
        nextQuestionBtn.addEventListener('click', goToNextQuestion);
        restartQuizBtn.addEventListener('click', resetQuizView);
        retryMissedQuizBtn.addEventListener('click', () => startQuiz(true));
        submitTextAnswerBtn.addEventListener('click', handleTextAnswer);
        quizTextAnswerInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !submitTextAnswerBtn.disabled) handleTextAnswer();
        });
        quizCategorySelect.addEventListener('change', () => {
            if (quizDataErrorEl) quizDataErrorEl.hidden = true;
        });
    }

    // --- FLASHCARDS ---
    function prepareFlashcardData() {
        if (flashcardsLoadingEl) flashcardsLoadingEl.hidden = false;
        if (flashcardAreaEl) flashcardAreaEl.hidden = true;
        if (flashcardsErrorEl) flashcardsErrorEl.hidden = true;
        if (flashcardsDataErrorEl) flashcardsDataErrorEl.hidden = true;

        const selectedCategory = flashcardCategorySelect ? flashcardCategorySelect.value : 'all';
        let categoryFilteredLexicon;

        if (selectedCategory === 'repasar') {
            categoryFilteredLexicon = getRepasarItems();
            if (categoryFilteredLexicon.length === 0) {
                if (flashcardsDataErrorEl) {
                    flashcardsDataErrorEl.textContent = `No has marcado palabras para repasar. Ve a la sección Léxico y marca algunas haciendo clic en su imagen ⭐.`;
                    flashcardsDataErrorEl.hidden = false;
                }
                if (flashcardsLoadingEl) flashcardsLoadingEl.hidden = true;
                flashcardData = [];
                return false;
            }
        } else if (selectedCategory === 'all') {
            categoryFilteredLexicon = lexiconData.filter(item =>
                item && item.id != null && item.raramuri && (item.spanish || item.image)
            );
        } else {
            categoryFilteredLexicon = lexiconData.filter(item =>
                item && item.id != null && item.raramuri && (item.spanish || item.image) &&
                (item.category && item.category === selectedCategory)
            );
        }

        if (categoryFilteredLexicon.length === 0) {
            if (flashcardsDataErrorEl) {
                const catDisplay = selectedCategory === 'all' ? 'todas las categorías' :
                    selectedCategory === 'repasar' ? "tus palabras a repasar" :
                        `la categoría "${selectedCategory}"`;
                flashcardsDataErrorEl.textContent = `No hay datos para ${catDisplay}.`;
                flashcardsDataErrorEl.hidden = false;
            }
            if (flashcardsLoadingEl) flashcardsLoadingEl.hidden = true;
            flashcardData = [];
            return false;
        }
        if (flashcardsDataErrorEl) flashcardsDataErrorEl.hidden = true;

        flashcardData = shuffleArray([...categoryFilteredLexicon]);
        currentFlashcardIndex = 0;
        isFlashcardFlipped = false;

        if (flashcardsLoadingEl) flashcardsLoadingEl.hidden = true;
        if (flashcardAreaEl) flashcardAreaEl.hidden = false;
        return true;
    }

    function displayCurrentFlashcard() {
        if (!flashcardData || flashcardData.length === 0 || !flashcardAreaEl || flashcardAreaEl.hidden) {
            if (flashcardCounterEl) flashcardCounterEl.textContent = '';
            if (flashcardAreaEl && (!flashcardData || flashcardData.length === 0)) {
                flashcardAreaEl.hidden = true;
            }
            return;
        }

        if (currentFlashcardIndex < 0 || currentFlashcardIndex >= flashcardData.length) {
            currentFlashcardIndex = 0;
            if (!flashcardData[currentFlashcardIndex]) {
                if (flashcardsErrorEl) { flashcardsErrorEl.textContent = 'Error al mostrar tarjeta.'; flashcardsErrorEl.hidden = false; }
                if (flashcardAreaEl) flashcardAreaEl.hidden = true;
                return;
            }
        }
        const cardData = flashcardData[currentFlashcardIndex];
        if (flashcardEl) flashcardEl.classList.remove('flipped');
        isFlashcardFlipped = false;

        if (flashcardFrontEl) {
            let frontContentHTML = '';
            if (cardData.image) {
                frontContentHTML += `<img src="${cardData.image}" alt="${cardData.spanish || 'Flashcard'}" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png';">`;
            } else if (cardData.spanish) {
                frontContentHTML += `<p class="flashcard-text-content">${cardData.spanish}</p>`;
            } else { frontContentHTML += '<p class="flashcard-text-content">???</p>'; }
            flashcardFrontEl.innerHTML = frontContentHTML;
        }
        if (flashcardBackEl) {
            let backHTML = `<p class="flashcard-text-content" lang="rar">${cardData.raramuri || '???'}</p>`;
            if (cardData.audio) {
                backHTML += `<button class="play-audio-btn flashcard-audio-btn" data-audio-src="${cardData.audio}" aria-label="Reproducir audio de ${cardData.raramuri}">🔊</button>`;
            }
            flashcardBackEl.innerHTML = backHTML;

            if (cardData.audio) {
                const audioButtonInDOM = flashcardBackEl.querySelector('.play-audio-btn.flashcard-audio-btn');
                if (audioButtonInDOM) {
                    audioButtonInDOM.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playAudio(e.currentTarget.dataset.audioSrc);
                    });
                }
            }
        }

        if (flashcardCounterEl) flashcardCounterEl.textContent = `Tarjeta ${currentFlashcardIndex + 1} de ${flashcardData.length}`;
    }

    function flipFlashcard() {
        if (!flashcardData || flashcardData.length === 0) return;
        flashcardEl.classList.toggle('flipped');
        isFlashcardFlipped = !isFlashcardFlipped;
    }

    function nextFlashcard() {
        if (!flashcardData || flashcardData.length === 0) return;
        currentFlashcardIndex++;
        if (currentFlashcardIndex >= flashcardData.length) currentFlashcardIndex = 0;
        displayCurrentFlashcard();
    }

    function prevFlashcard() {
        if (!flashcardData || flashcardData.length === 0) return;
        currentFlashcardIndex--;
        if (currentFlashcardIndex < 0) currentFlashcardIndex = flashcardData.length - 1;
        displayCurrentFlashcard();
    }

    function shuffleFlashcards() {
        if (prepareFlashcardData()) {
            displayCurrentFlashcard();
        } else {
            if (flashcardAreaEl) flashcardAreaEl.hidden = true;
            if (flashcardCounterEl) flashcardCounterEl.textContent = '';
        }
    }

    function setupFlashcardsControls() {
        if (!flashcardEl || !prevFlashcardBtn || !flipFlashcardBtn || !nextFlashcardBtn || !shuffleFlashcardsBtn || !flashcardCategorySelect || !flashcardsSetupControls || !flashcardsDataErrorEl) {
            if (flashcardsErrorEl) { flashcardsErrorEl.textContent = "Error: Controles Flashcards no encontrados."; flashcardsErrorEl.hidden = false; }
            if (flashcardsSetupControls) flashcardsSetupControls.style.display = 'none';
            return;
        }
        const flashcardDisplayArea = document.getElementById('flashcard-display-area');
        if (flashcardDisplayArea) flashcardDisplayArea.addEventListener('click', (e) => {
            if (!e.target.closest('#flashcard-controls') && !e.target.classList.contains('play-audio-btn')) {
                flipFlashcard();
            }
        });
        flipFlashcardBtn.addEventListener('click', flipFlashcard);
        nextFlashcardBtn.addEventListener('click', nextFlashcard);
        prevFlashcardBtn.addEventListener('click', prevFlashcard);
        shuffleFlashcardsBtn.addEventListener('click', shuffleFlashcards);

        flashcardCategorySelect.addEventListener('change', () => {
            if (prepareFlashcardData()) {
                displayCurrentFlashcard();
            } else {
                if (flashcardAreaEl) flashcardAreaEl.hidden = true;
                if (flashcardCounterEl) flashcardCounterEl.textContent = '';
            }
        });
    }

    function initializeFlashcardsView() {
        if (flashcardsDataErrorEl) flashcardsDataErrorEl.hidden = true;

        if (lexiconData.length > 0 && flashcardCategorySelect) {
            if (flashcardCategorySelect.options.length <= 1) {
                const uniqueCategories = getUniqueCategories(lexiconData);
                populateCategorySelect(flashcardCategorySelect, uniqueCategories);
            } else {
                updateRepasarOptionInSelect(flashcardCategorySelect);
            }
            flashcardCategorySelect.disabled = (Array.from(flashcardCategorySelect.options).filter(opt => opt.value !== 'repasar').length <= 1) && repasarLexiconIds.length === 0;

        } else if (lexiconData.length === 0) {
            if (flashcardCategorySelect) flashcardCategorySelect.disabled = true;
            if (flashcardsSetupControls) flashcardsSetupControls.style.display = 'flex';
            if (flashcardsDataErrorEl) {
                flashcardsDataErrorEl.textContent = 'No hay datos léxicos para Flashcards.';
                flashcardsDataErrorEl.hidden = false;
            }
            if (flashcardsLoadingEl) flashcardsLoadingEl.hidden = true;
            if (flashcardAreaEl) flashcardAreaEl.hidden = true;
            return;
        }

        if (prepareFlashcardData()) {
            displayCurrentFlashcard();
        } else {
            if (flashcardAreaEl) flashcardAreaEl.hidden = true;
        }
    }

    // --- ADIVINA LA PALABRA ---
    function normalizeGuessChar(ch) {
        return ch ? ch.toLowerCase() : ch;
    }

    function buildGuessPool() {
        const selectedCategory = guessCategorySelect ? guessCategorySelect.value : 'all';
        let items;
        if (selectedCategory === 'repasar') {
            items = getRepasarItems();
        } else if (selectedCategory === 'all') {
            items = lexiconData;
        } else {
            items = lexiconData.filter(item => item.category && item.category === selectedCategory);
        }
        return items.filter(item => item && item.id != null && item.image && item.raramuri && item.spanish);
    }

    function resetGuessView() {
        guessActive = false;
        guessRoundScore = 0;
        if (guessSetup) guessSetup.style.display = 'flex';
        if (guessGameArea) guessGameArea.hidden = true;
        if (guessRoundEnd) guessRoundEnd.hidden = true;
        if (guessDataErrorEl) guessDataErrorEl.hidden = true;
        if (guessFeedbackEl) { guessFeedbackEl.textContent = ''; guessFeedbackEl.className = 'quiz-feedback'; }
        if (guessNextBtn) guessNextBtn.hidden = true;
        updateRepasarOptionInSelect(guessCategorySelect);
    }

    function startGuessRound() {
        guessPool = shuffleArray(buildGuessPool());
        if (guessPool.length === 0) {
            const selectedCategory = guessCategorySelect ? guessCategorySelect.value : 'all';
            const catDisplay = selectedCategory === 'all' ? 'todas las categorías' :
                selectedCategory === 'repasar' ? "tus palabras a repasar" :
                    `la categoría "${selectedCategory}"`;
            if (guessDataErrorEl) {
                guessDataErrorEl.textContent = selectedCategory === 'repasar'
                    ? `No has marcado palabras para repasar. Ve a la sección Léxico y marca algunas haciendo clic en su imagen ⭐.`
                    : `No hay datos disponibles para ${catDisplay}.`;
                guessDataErrorEl.hidden = false;
            }
            return;
        }
        if (guessDataErrorEl) guessDataErrorEl.hidden = true;
        guessRoundScore = 0;
        if (guessSetup) guessSetup.style.display = 'none';
        if (guessRoundEnd) guessRoundEnd.hidden = true;
        if (guessGameArea) guessGameArea.hidden = false;
        nextGuessWord();
    }

    function nextGuessWord() {
        if (guessPool.length === 0) {
            showGuessRoundEnd(true);
            return;
        }
        guessCurrentWord = guessPool.pop();
        guessRevealedLetters = new Set();
        guessWrongLetters = new Set();
        guessLivesLeft = GUESS_MAX_LIVES;
        guessActive = true;

        if (guessImageContainer) {
            guessImageContainer.innerHTML = `<img src="${guessCurrentWord.image}" alt="${guessCurrentWord.spanish}" loading="lazy" onerror="this.onerror=null; this.src='images/placeholder.png';">`;
        }
        if (guessSpanishWordEl) guessSpanishWordEl.textContent = guessCurrentWord.spanish;
        if (guessFeedbackEl) { guessFeedbackEl.textContent = ''; guessFeedbackEl.className = 'quiz-feedback'; }
        if (guessNextBtn) guessNextBtn.hidden = true;
        if (guessScoreEl) guessScoreEl.textContent = guessRoundScore;

        renderGuessLives();
        renderGuessSlots();
        renderGuessKeyboard();
    }

    function renderGuessLives() {
        if (!guessLivesEl) return;
        guessLivesEl.innerHTML = '';
        for (let i = 0; i < GUESS_MAX_LIVES; i++) {
            const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            heart.setAttribute('viewBox', '0 0 24 24');
            heart.setAttribute('class', 'guess-life-heart' + (i >= guessLivesLeft ? ' lost' : ''));
            heart.innerHTML = '<path d="M12 20.5C12 20.5 3 15.2 3 8.8C3 5.8 5.2 3.8 7.8 3.8C9.6 3.8 11.1 4.8 12 6.3C12.9 4.8 14.4 3.8 16.2 3.8C18.8 3.8 21 5.8 21 8.8C21 15.2 12 20.5 12 20.5Z"/>';
            guessLivesEl.appendChild(heart);
        }
    }

    function renderGuessSlots() {
        if (!guessWordSlotsEl || !guessCurrentWord) return;
        guessWordSlotsEl.innerHTML = '';
        const word = guessCurrentWord.raramuri;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            if (ch === ' ') {
                const gap = document.createElement('div');
                gap.classList.add('guess-slot', 'gap');
                guessWordSlotsEl.appendChild(gap);
                continue;
            }
            const slot = document.createElement('div');
            slot.classList.add('guess-slot');
            const normCh = normalizeGuessChar(ch);
            if (guessRevealedLetters.has(normCh) || !/[a-záéíóú']/i.test(ch)) {
                slot.textContent = ch;
            }
            guessWordSlotsEl.appendChild(slot);
        }
    }

    function renderGuessKeyboard() {
        if (!guessKeyboardEl) return;
        guessKeyboardEl.innerHTML = '';
        GUESS_KEYBOARD_LETTERS.forEach(letter => {
            const btn = document.createElement('button');
            btn.classList.add('guess-key');
            btn.textContent = letter;
            btn.dataset.letter = letter;
            if (guessRevealedLetters.has(letter)) { btn.classList.add('correct'); btn.disabled = true; }
            if (guessWrongLetters.has(letter)) { btn.classList.add('incorrect'); btn.disabled = true; }
            btn.addEventListener('click', () => handleGuessLetter(letter));
            guessKeyboardEl.appendChild(btn);
        });
    }

    function handleGuessLetter(letter) {
        if (!guessActive || !guessCurrentWord) return;
        const wordLower = guessCurrentWord.raramuri.toLowerCase();
        if (guessRevealedLetters.has(letter) || guessWrongLetters.has(letter)) return;

        if (wordLower.includes(letter)) {
            guessRevealedLetters.add(letter);
            renderGuessSlots();
            renderGuessKeyboard();
            checkGuessWordComplete();
        } else {
            guessWrongLetters.add(letter);
            guessLivesLeft--;
            renderGuessLives();
            renderGuessKeyboard();
            if (guessLivesLeft <= 0) {
                handleGuessWordFailed();
            }
        }
    }

    function checkGuessWordComplete() {
        const word = guessCurrentWord.raramuri.toLowerCase();
        const lettersOnly = word.split('').filter(ch => /[a-záéíóú']/i.test(ch));
        const allRevealed = lettersOnly.every(ch => guessRevealedLetters.has(ch));
        if (allRevealed) {
            guessActive = false;
            guessRoundScore++;
            if (guessScoreEl) guessScoreEl.textContent = guessRoundScore;
            if (guessFeedbackEl) { guessFeedbackEl.textContent = '¡Muy bien! Completaste la palabra.'; guessFeedbackEl.className = 'quiz-feedback correct'; }
            revealFullGuessWord();
            if (guessNextBtn) guessNextBtn.hidden = false;
        }
    }

    function handleGuessWordFailed() {
        guessActive = false;
        if (guessFeedbackEl) {
            guessFeedbackEl.innerHTML = `Sin intentos. La palabra era: <strong lang="rar">${guessCurrentWord.raramuri}</strong>`;
            guessFeedbackEl.className = 'quiz-feedback incorrect';
        }
        revealFullGuessWord();
        disableGuessKeyboard();
        if (guessNextBtn) guessNextBtn.hidden = false;
    }

    function revealFullGuessWord() {
        if (!guessWordSlotsEl || !guessCurrentWord) return;
        guessWordSlotsEl.innerHTML = '';
        const word = guessCurrentWord.raramuri;
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            if (ch === ' ') {
                const gap = document.createElement('div');
                gap.classList.add('guess-slot', 'gap');
                guessWordSlotsEl.appendChild(gap);
                continue;
            }
            const slot = document.createElement('div');
            slot.classList.add('guess-slot', 'revealed');
            slot.textContent = ch;
            guessWordSlotsEl.appendChild(slot);
        }
        disableGuessKeyboard();
    }

    function disableGuessKeyboard() {
        if (!guessKeyboardEl) return;
        guessKeyboardEl.querySelectorAll('.guess-key').forEach(btn => btn.disabled = true);
    }

    function showGuessRoundEnd(finishedAll) {
        if (guessGameArea) guessGameArea.hidden = true;
        if (guessRoundEnd) guessRoundEnd.hidden = false;
        if (guessRoundTitle) guessRoundTitle.textContent = finishedAll ? '¡Terminaste la ronda!' : 'Ronda terminada';
        if (guessRoundMessage) guessRoundMessage.textContent = `Adivinaste ${guessRoundScore} palabra${guessRoundScore === 1 ? '' : 's'} en esta ronda.`;
    }

    function setupGuessControls() {
        if (!startGuessBtn || !guessNextBtn || !guessPlayAgainBtn || !guessCategorySelect) return;
        startGuessBtn.addEventListener('click', startGuessRound);
        guessNextBtn.addEventListener('click', nextGuessWord);
        guessPlayAgainBtn.addEventListener('click', resetGuessView);
        guessCategorySelect.addEventListener('change', () => {
            if (guessDataErrorEl) guessDataErrorEl.hidden = true;
        });
        document.addEventListener('keydown', (e) => {
            const guessSection = document.getElementById('guess');
            if (!guessSection || !guessSection.classList.contains('active')) return;
            if (!guessActive) return;
            const key = e.key.toLowerCase();
            if (GUESS_KEYBOARD_LETTERS.includes(key)) {
                handleGuessLetter(key);
            }
        });
    }

    // --- INICIALIZACIÓN GENERAL ---
    function initializeApplication() {
        if (!mainContentEl || !navButtons || !contentSections || !lexiconGrid || !phrasesList || !memoramaGrid || !quizContainer || !flashcardsContainer || !categoryFiltersContainer || !quizCategorySelect || !flashcardCategorySelect || !memoramaCategorySelect || !guessCategorySelect || !flashcardsSetupControls || !flashcardsDataErrorEl || !quizDataErrorEl) {
            if (errorMessageEl) { errorMessageEl.textContent = "Error crítico al iniciar: elementos faltantes. Consulta la consola."; errorMessageEl.style.display = 'block'; }
            if (loadingMessageEl) loadingMessageEl.style.display = 'none';
            if (mainContentEl) mainContentEl.hidden = true;
            return;
        }

        setupNavigation();
        populatePhrases();
        setupSearch();
        populateCategoryFilters();

        if (lexiconData.length > 0) {
            const uniqueCategories = getUniqueCategories(lexiconData);
            populateCategorySelect(quizCategorySelect, uniqueCategories);
            populateCategorySelect(flashcardCategorySelect, uniqueCategories);
            populateCategorySelect(memoramaCategorySelect, uniqueCategories);
            populateCategorySelect(guessCategorySelect, uniqueCategories);

            [quizCategorySelect, flashcardCategorySelect, memoramaCategorySelect, guessCategorySelect].forEach(sel => {
                if (sel) {
                    const nonRepasarOptionsCount = Array.from(sel.options).filter(opt => opt.value !== 'repasar').length;
                    sel.disabled = nonRepasarOptionsCount <= 1 && repasarLexiconIds.length === 0;
                }
            });

        } else {
            [quizCategorySelect, flashcardCategorySelect, memoramaCategorySelect, guessCategorySelect].forEach(sel => {
                if (sel) sel.disabled = true;
            });

            const noDataMsg = 'No hay datos léxicos disponibles.';
            if (flashcardsDataErrorEl && flashcardsSetupControls) { flashcardsSetupControls.style.display = 'flex'; flashcardsDataErrorEl.textContent = noDataMsg; flashcardsDataErrorEl.hidden = false; if (flashcardAreaEl) flashcardAreaEl.hidden = true; }
            if (quizDataErrorEl && quizSetup) { quizSetup.style.display = 'flex'; quizDataErrorEl.textContent = noDataMsg; quizDataErrorEl.hidden = false; if (quizQuestionArea) quizQuestionArea.hidden = true; if (quizResultsEl) quizResultsEl.hidden = true; }
            if (memoramaDataErrorEl && memoramaSetup) { memoramaSetup.style.display = 'flex'; memoramaDataErrorEl.textContent = noDataMsg; memoramaDataErrorEl.hidden = false; if (memoramaGameArea) memoramaGameArea.hidden = true; }
            if (guessDataErrorEl && guessSetup) { guessSetup.style.display = 'flex'; guessDataErrorEl.textContent = noDataMsg; guessDataErrorEl.hidden = false; if (guessGameArea) guessGameArea.hidden = true; }
        }

        setupMemoramaControls();
        setupQuizControls();
        setupFlashcardsControls();
        setupGuessControls();

        updateAllRepasarOptions();
        filterAndDisplayLexicon();
    }

    loadData();
});
