// Глобальные переменные состояния
let examData = [];
let testQuestions = [];
let userAnswers = {}; // { 'q-1': ['ответ1', 'ответ2'] }
let currentIndex = 0;
let currentMode = 'learn'; // learn, test-single, test-list

document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Инициализация
function init() {
    const loader = document.getElementById('loader');
    const errorEl = document.getElementById('error');

    fetch('теория-вероятностей.json')
        .then(response => {
            if (!response.ok) throw new Error('Не удалось загрузить файл данных.');
            return response.json();
        })
        .then(data => {
            examData = data.map((item, index) => ({
                ...item,
                id: `q-${index}`
            }));
            loader.classList.add('hidden');
            
            // Настройка поиска для режима шпаргалки
            document.getElementById('searchInput').addEventListener('input', handleSearch);
            
            // Запускаем режим по умолчанию
            switchTab('learn');
        })
        .catch(err => {
            loader.classList.add('hidden');
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        });
}

// Управление вкладками и экранами
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add('active');

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
    window.scrollTo(0, 0);
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

// Аккордеон для шпаргалки
window.toggleAccordion = function(id) {
    const card = document.getElementById(`card-${id}`);
    const body = document.getElementById(`body-${id}`);
    const isExpanded = card.classList.contains('expanded');
    
    document.querySelectorAll('.card.expanded').forEach(c => {
        if (c.id !== `card-${id}`) {
            c.classList.remove('expanded');
            document.getElementById(`body-${c.id.replace('card-','')}`).style.maxHeight = null;
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

// ================= УПРАВЛЕНИЕ ТЕСТАМИ =================
function shuffle(array) {
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
    
    let pool = [...examData];
    
    if (type === '50-random') {
        testQuestions = shuffle(pool).slice(0, 50);
    } else if (type === 'all-random') {
        testQuestions = shuffle(pool);
    } else {
        testQuestions = pool; // all-ordered
    }

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
    
    // Обновляем прогресс
    document.getElementById('ts-current').textContent = currentIndex + 1;
    document.getElementById('ts-total').textContent = testQuestions.length;
    const progressPercent = ((currentIndex) / testQuestions.length) * 100;
    document.getElementById('ts-progress').style.width = `${progressPercent}%`;
    
    // Рендерим вопрос
    container.innerHTML = getQuestionHtml(item, 'test');
    
    // Кнопки навигации
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

// ================= ТЕСТ СПИСКОМ =================
function renderListTest() {
    const container = document.getElementById('tl-container');
    container.innerHTML = testQuestions.map(item => getQuestionHtml(item, 'test')).join('');
}

// ================= ВЫБОР ОТВЕТОВ =================
window.toggleChoice = function(qId, choiceIndex) {
    const item = testQuestions.find(q => q.id === qId);
    if (!item) return;
    
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
        userAnswers[qId] = [choiceStr]; // Single selection overrides
    }
    
    // Перерендер конкретного вопроса
    const newHtml = getQuestionHtml(item, 'test');
    document.getElementById(`card-${qId}`).outerHTML = newHtml;
};

// ================= ЗАВЕРШЕНИЕ И РЕЗУЛЬТАТЫ =================
window.finishTest = function() {
    // Подсчет результатов
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
    
    document.getElementById('errors-container').classList.add('hidden');
    switchView('view-results');
};

window.showErrors = function() {
    const container = document.getElementById('errors-list');
    container.innerHTML = testQuestions.map(item => getQuestionHtml(item, 'result')).join('');
    document.getElementById('errors-container').classList.remove('hidden');
    
    // Плавный скролл к ошибкам
    document.getElementById('errors-container').scrollIntoView({ behavior: 'smooth' });
};

// ================= ГЕНЕРАЦИЯ HTML ВОПРОСА =================
// mode: 'learn' | 'test' | 'result'
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
            if (isSelected) {
                className += ' selected';
                iconClass = isMulti ? 'ri-checkbox-fill' : 'ri-radio-button-fill';
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

        const onClick = mode === 'test' ? `onclick="toggleChoice('${item.id}', ${idx})"` : '';
        
        choicesHtml += `
            <div class="${className}" ${onClick}>
                <i class="${iconClass}"></i>
                <span>${choice}</span>
            </div>
        `;
    });

    if (mode === 'learn') {
        return `
            <div class="card" id="card-${item.id}">
                <button class="card-header" onclick="toggleAccordion('${item.id}')">
                    <span class="card-title">${item.question}</span>
                    <i class="ri-arrow-down-s-line chevron"></i>
                </button>
                <div class="card-body" id="body-${item.id}">
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
        // Для тестов и результатов (карточка всегда открыта)
        return `
            <div class="card open-card" id="card-${item.id}">
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