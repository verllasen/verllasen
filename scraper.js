const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
    console.log('Запуск браузера...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Переход на страницу авторизации Moodle
    await page.goto('https://dokgtk.ru/login/index.php', { waitUntil: 'networkidle2' });
    console.log('Пожалуйста, авторизуйтесь в открывшемся окне браузера.');
    console.log('После авторизации перейдите на страницу теста и нажмите Enter в этой консоли...');
    
    // Ожидание ввода от пользователя в консоли
    await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
    
    console.log('Начинаем сбор данных...');
    
    // Сбор данных со страницы
    const questions = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('.que').forEach(qElem => {
            const questionText = qElem.querySelector('.qtext')?.innerText.trim();
            if (!questionText) return;
            
            const choices = [];
            qElem.querySelectorAll('.answer div').forEach(ansElem => {
                let text = ansElem.querySelector('label')?.innerText.trim() || '';
                text = text.replace(/^[a-zа-я]\.\s*/i, '').trim();
                if (text) choices.push(text);
            });
            
            const correctAnswers = [];
            const feedback = qElem.querySelector('.rightanswer')?.innerText.trim();
            if (feedback) {
                let correctText = feedback.replace(/^Правильный ответ:\s*/i, '').trim();
                correctAnswers.push(correctText);
            }
            
            if (correctAnswers.length === 0) {
                qElem.querySelectorAll('.answer div.correct').forEach(ansElem => {
                    let text = ansElem.querySelector('label')?.innerText.trim() || '';
                    text = text.replace(/^[a-zа-я]\.\s*/i, '').trim();
                    if (text) correctAnswers.push(text);
                });
            }
            
            results.push({
                question: questionText,
                choices: choices,
                correctAnswers: correctAnswers
            });
        });
        return results;
    });
    
    console.log(`Собрано вопросов: ${questions.length}`);
    fs.writeFileSync('03.01МДК.json', JSON.stringify(questions, null, 2));
    console.log('Данные сохранены в 03.01МДК.json');
    
    await browser.close();
    process.exit(0);
}

scrape().catch(console.error);