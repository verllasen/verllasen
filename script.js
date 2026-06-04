document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const qaList = document.getElementById('qaList');
    const loader = document.getElementById('loader');
    const errorEl = document.getElementById('error');
    const emptyState = document.getElementById('emptyState');

    let examData = [];

    // Загрузка данных
    fetch('теория-вероятностей.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить файл данных. Проверьте путь.');
            }
            return response.json();
        })
        .then(data => {
            // Добавляем уникальные ID для каждой записи
            examData = data.map((item, index) => ({
                ...item,
                id: `q-${index}`
            }));
            
            // Скрываем лоадер и рендерим список
            loader.classList.add('hidden');
            renderList(examData);
        })
        .catch(err => {
            loader.classList.add('hidden');
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        });

    // Обработка поиска
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            renderList(examData);
            return;
        }

        const filtered = examData.filter(item => {
            const inQuestion = item.question.toLowerCase().includes(query);
            const inChoices = item.choices.some(choice => choice.toLowerCase().includes(query));
            const inAnswers = item.correctAnswers.some(ans => ans.toLowerCase().includes(query));
            
            return inQuestion || inChoices || inAnswers;
        });

        renderList(filtered);
    });

    // Функция рендера списка вопросов
    function renderList(items) {
        qaList.innerHTML = '';

        if (items.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.id = item.id;

                let choicesHtml = '';
                
                item.choices.forEach(choice => {
                    const isCorrect = item.correctAnswers.includes(choice);
                    const choiceClass = isCorrect ? 'choice correct' : 'choice incorrect';
                    const iconClass = isCorrect ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line';
                    
                    choicesHtml += `
                        <div class="${choiceClass}">
                            <i class="${iconClass}"></i>
                            <span>${choice}</span>
                        </div>
                    `;
                });

                card.innerHTML = `
                    <button class="card-header" onclick="toggleCard('${item.id}')">
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
                `;
                
                qaList.appendChild(card);
            });
        }
    }

    // Глобальная функция для аккордеона
    window.toggleCard = function(id) {
        const card = document.getElementById(id);
        const body = document.getElementById(`body-${id}`);
        const isExpanded = card.classList.contains('expanded');
        
        // Закрываем все остальные открытые карточки (по желанию, можно убрать этот блок)
        document.querySelectorAll('.card.expanded').forEach(c => {
            if (c.id !== id) {
                c.classList.remove('expanded');
                document.getElementById(`body-${c.id}`).style.maxHeight = null;
            }
        });

        // Открываем или закрываем текущую карточку
        if (isExpanded) {
            card.classList.remove('expanded');
            body.style.maxHeight = null;
        } else {
            card.classList.add('expanded');
            body.style.maxHeight = body.scrollHeight + "px";
        }
    };
});