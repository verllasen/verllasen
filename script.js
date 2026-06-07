// Глобальные переменные состояния
let examData = [];
let testQuestions = [];
let userAnswers = {}; 
let currentIndex = 0;
let currentMode = 'learn';

// Таймер
let timerInterval;
let secondsElapsed = 0;

document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Инициализация
function init() {
    const loader = document.getElementById('loader');
    const errorEl = document.getElementById('error');

    // Проверяем тему в localStorage
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelector('#theme-toggle i').className = 'ri-sun-line';
    }

    // Получаем предмет из URL
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject') || 'math'; // по умолчанию теория вероятности

    let dataFile = '';
    let title = '';

    if (subject === 'mdk0103') {
        dataFile = '0103МДК.json';
        title = 'Разработка мобильных приложений (01.03 МДК)';
    } else if (subject === 'mdk0502') {
        dataFile = 'МДК_0502.json';
        title = 'Компьютерная графика и мультимедиа (05.02 МДК)';
    } else {
        dataFile = 'теория-вероятностей.json';
        title = 'Экзамен теория вероятности';
    }

    // Обновляем заголовок
    document.title = title;
    const headerTitleEl = document.getElementById('header-title');
    if (headerTitleEl) {
        headerTitleEl.textContent = title;
    }

    fetch(dataFile)
        .then(response => {
            if (!response.ok) throw new Error('Не удалось загрузить файл данных.');
            return response.json();
        })
        .then(data => {
            // Перемешиваем варианты ответов один раз при загрузке
            examData = data.map((item, index) => ({
                ...item,
                id: `q-${index}`,
                choices: shuffleArray([...item.choices])
            }));
            
            loader.classList.add('hidden');
            document.getElementById('searchInput').addEventListener('input', handleSearch);
            switchTab('learn');
        })
        .catch(err => {
            loader.classList.add('hidden');
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        });
}

// Управление темой
window.toggleTheme = function() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        document.querySelector('#theme-toggle i').className = 'ri-moon-line';
    } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.querySelector('#theme-toggle i').className = 'ri-sun-line';
    }
};

// Управление вкладками и экранами
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add('active');

    stopTimer();
    document.getElementById('timer-badge').classList.add('hidden');

    if (tabName === 'learn') {
        currentMode = 'learn';
        switchView('view-learn');
        renderLearnList(examData);
    } else if (tabName === 'test-single') {
        switchView('view-test-setup');
    } else if (tabName === 'test-list') {
        startTest('list', 'all-ordered');
    }
};

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= ШПАРГАЛКА (Обучение) =================
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderLearnList(examData);
        return;
    }
    const filtered = examData.filter(item => {
        const inQ = item.question.toLowerCase().includes(query);
        const inC = item.choices.some(c => c.toLowerCase().includes(query));
        const inA = item.correctAnswers.some(a => a.toLowerCase().includes(query));
        return inQ || inC || inA;
    });
    renderLearnList(filtered);
}

function renderLearnList(items) {
    const container = document.getElementById('qaList');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '';
    if (items.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        container.innerHTML = items.map(item => getQuestionHtml(item, 'learn')).join('');
    }
}

window.toggleAccordion = function(id) {
    const card = document.getElementById(`learn-card-${id}`);
    const body = document.getElementById(`learn-body-${id}`);
    const isExpanded = card.classList.contains('expanded');
    
    document.querySelectorAll('#qaList .card.expanded').forEach(c => {
        if (c.id !== `learn-card-${id}`) {
            c.classList.remove('expanded');
            const otherId = c.id.replace('learn-card-', '');
            const otherBody = document.getElementById(`learn-body-${otherId}`);
            if (otherBody) otherBody.style.maxHeight = null;
        }
    });

    if (isExpanded) {
        card.classList.remove('expanded');
        body.style.maxHeight = null;
    } else {
        card.classList.add('expanded');
        body.style.maxHeight = body.scrollHeight + "px";
    }
};

// ================= ТАЙМЕР =================
function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    updateTimerUI();
    document.getElementById('timer-badge').classList.remove('hidden');
    
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    const display = `${m}:${s}`;
    document.getElementById('timer-display').textContent = display;
}

function stopTimer() {
    clearInterval(timerInterval);
}

// ================= УПРАВЛЕНИЕ ТЕСТАМИ =================
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

window.startTest = function(mode, type) {
    userAnswers = {};
    currentIndex = 0;
    currentMode = mode;
    
    // Сбрасываем подсказки
    examData.forEach(item => item.hintShown = false);
    
    let pool = [...examData];
    
    if (type === '50-random') {
        testQuestions = shuffleArray(pool).slice(0, 50);
    } else if (type === 'all-random') {
        testQuestions = shuffleArray(pool);
    } else {
        testQuestions = pool; 
    }

    startTimer();

    if (mode === 'single') {
        switchView('view-test-single');
        renderSingleQuestion();
    } else if (mode === 'list') {
        switchView('view-test-list');
        renderListTest();
    }
};

// ================= ТЕСТ ПО ОДНОМУ =================
function renderSingleQuestion() {
    const container = document.getElementById('ts-question-container');
    const item = testQuestions[currentIndex];
    
    document.getElementById('ts-current').textContent = currentIndex + 1;
    document.getElementById('ts-total').textContent = testQuestions.length;
    const progressPercent = ((currentIndex) / testQuestions.length) * 100;
    document.getElementById('ts-progress').style.width = `${progressPercent}%`;
    
    container.innerHTML = getQuestionHtml(item, 'test');
    
    document.getElementById('ts-prev').style.visibility = currentIndex > 0 ? 'visible' : 'hidden';
    
    if (currentIndex === testQuestions.length - 1) {
        document.getElementById('ts-next').classList.add('hidden');
        document.getElementById('ts-finish').classList.remove('hidden');
    } else {
        document.getElementById('ts-next').classList.remove('hidden');
        document.getElementById('ts-finish').classList.add('hidden');
    }
}

window.tsNext = function() {
    if (currentIndex < testQuestions.length - 1) {
        currentIndex++;
        renderSingleQuestion();
    }
};

window.tsPrev = function() {
    if (currentIndex > 0) {
        currentIndex--;
        renderSingleQuestion();
    }
};

window.showHint = function() {
    if (currentMode !== 'single') return;
    const item = testQuestions[currentIndex];
    item.hintShown = true;
    renderSingleQuestion();
};

// ================= ТЕСТ СПИСКОМ =================
function renderListTest() {
    const container = document.getElementById('tl-container');
    container.innerHTML = testQuestions.map(item => getQuestionHtml(item, 'test')).join('');
}

// ================= ВЫБОР ОТВЕТОВ =================
window.toggleChoice = function(qId, choiceIndex) {
    const item = testQuestions.find(q => q.id === qId);
    if (!item) return;
    
    // Если уже показана подсказка, не даем менять ответ (чтобы не читерить)
    if (item.hintShown && currentMode === 'single') return;
    
    const choiceStr = item.choices[choiceIndex];
    const isMulti = item.correctAnswers.length > 1;
    
    if (!userAnswers[qId]) userAnswers[qId] = [];
    
    if (isMulti) {
        if (userAnswers[qId].includes(choiceStr)) {
            userAnswers[qId] = userAnswers[qId].filter(c => c !== choiceStr);
        } else {
            userAnswers[qId].push(choiceStr);
        }
    } else {
        userAnswers[qId] = [choiceStr];
    }
    
    if (currentMode === 'single') {
        renderSingleQuestion();
    } else {
        const newHtml = getQuestionHtml(item, 'test');
        const cardElement = document.getElementById(`test-card-${qId}`);
        if (cardElement) {
            cardElement.outerHTML = newHtml;
        }
    }
};

// ================= ЗАВЕРШЕНИЕ И РЕЗУЛЬТАТЫ =================
window.finishTest = function() {
    stopTimer();
    document.getElementById('timer-badge').classList.add('hidden');
    
    let correctCount = 0;
    
    testQuestions.forEach(q => {
        const correctArr = [...q.correctAnswers].sort();
        const userArr = [...(userAnswers[q.id] || [])].sort();
        
        if (JSON.stringify(correctArr) === JSON.stringify(userArr)) {
            correctCount++;
        }
    });
    
    const total = testQuestions.length;
    const percent = Math.round((correctCount / total) * 100);
    
    document.getElementById('res-score').textContent = correctCount;
    document.getElementById('res-total').textContent = total;
    document.getElementById('res-percent').textContent = `${percent}% правильных ответов`;
    
    // Форматируем итоговое время
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    document.querySelector('#res-time span').textContent = `${m}:${s}`;
    
    document.getElementById('errors-container').classList.add('hidden');
    switchView('view-results');
};

window.showErrors = function() {
    const container = document.getElementById('errors-list');
    container.innerHTML = testQuestions.map(item => getQuestionHtml(item, 'result')).join('');
    document.getElementById('errors-container').classList.remove('hidden');
    
    document.getElementById('errors-container').scrollIntoView({ behavior: 'smooth' });
};

// ================= ГЕНЕРАЦИЯ HTML ВОПРОСА =================
function getQuestionHtml(item, mode) {
    const isMulti = item.correctAnswers.length > 1;
    const uAns = userAnswers[item.id] || [];
    
    let choicesHtml = '';
    
    item.choices.forEach((choice, idx) => {
        let className = 'choice';
        let iconClass = isMulti ? 'ri-checkbox-blank-line' : 'ri-checkbox-blank-circle-line';
        
        if (mode === 'learn') {
            const isCorrect = item.correctAnswers.includes(choice);
            className += isCorrect ? ' correct' : ' neutral';
            iconClass = isCorrect ? 'ri-checkbox-circle-fill' : iconClass;
        } 
        else if (mode === 'test') {
            className += ' selectable';
            const isSelected = uAns.includes(choice);
            const isCorrect = item.correctAnswers.includes(choice);
            
            if (isSelected) {
                className += ' selected';
                iconClass = isMulti ? 'ri-checkbox-fill' : 'ri-radio-button-fill';
            }
            
            // Если включена подсказка в режиме test-single
            if (item.hintShown) {
                if (isCorrect) {
                    className += ' correct';
                    iconClass = 'ri-checkbox-circle-fill';
                } else if (isSelected && !isCorrect) {
                    className += ' incorrect';
                    iconClass = 'ri-close-circle-fill';
                }
                className = className.replace('selectable', ''); // убираем hover-эффекты
            }
        }
        else if (mode === 'result') {
            const isCorrect = item.correctAnswers.includes(choice);
            const isSelected = uAns.includes(choice);
            
            if (isCorrect && isSelected) {
                className += ' correct';
                iconClass = 'ri-checkbox-circle-fill';
            } else if (isCorrect && !isSelected) {
                className += ' missed'; 
                iconClass = 'ri-error-warning-fill';
            } else if (!isCorrect && isSelected) {
                className += ' incorrect'; 
                iconClass = 'ri-close-circle-fill';
            } else {
                className += ' neutral';
            }
        }

        const onClick = (mode === 'test' && !item.hintShown) ? `onclick="toggleChoice('${item.id}', ${idx})"` : '';
        
        choicesHtml += `
            <div class="${className}" ${onClick}>
                <i class="${iconClass}"></i>
                <span>${choice}</span>
            </div>
        `;
    });

    if (mode === 'learn') {
        return `
            <div class="card" id="learn-card-${item.id}">
                <button class="card-header" onclick="toggleAccordion('${item.id}')">
                    <span class="card-title">${item.question}</span>
                    <i class="ri-arrow-down-s-line chevron"></i>
                </button>
                <div class="card-body" id="learn-body-${item.id}">
                    <div class="card-content">
                        <div class="divider"></div>
                        <div class="choices-container">
                            ${choicesHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const idPrefix = mode === 'result' ? 'result-card-' : 'test-card-';
        return `
            <div class="card open-card" id="${idPrefix}${item.id}">
                <div class="card-header">
                    <span class="card-title">${item.question}</span>
                    ${isMulti ? '<span class="badge">Несколько вариантов ответа</span>' : ''}
                </div>
                <div class="card-content">
                    <div class="choices-container">
                        ${choicesHtml}
                    </div>
                </div>
            </div>
        `;
    }
}