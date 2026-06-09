const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('03.01МДК.html', 'utf8');
const $ = cheerio.load(html);

const results = [];

$('.que').each((i, elem) => {
  const qElem = $(elem);
  const questionText = qElem.find('.qtext').text().trim();
  
  if (!questionText) return;

  const choices = [];
  qElem.find('.answer div').each((j, ansElem) => {
    let text = $(ansElem).find('label').text().trim();
    text = text.replace(/^[a-zа-я]\.\s*/i, '').trim();
    if (text) {
      choices.push(text);
    }
  });

  let correctAnswers = [];
  
  const feedback = qElem.find('.rightanswer').text().trim();
  if (feedback) {
    let correctText = feedback.replace(/^Правильный ответ:\s*/i, '').trim();
    correctAnswers.push(correctText);
  }

  if (correctAnswers.length === 0) {
    qElem.find('.answer div.correct').each((j, ansElem) => {
      let text = $(ansElem).find('label').text().trim();
      text = text.replace(/^[a-zа-я]\.\s*/i, '').trim();
      if (text) {
        correctAnswers.push(text);
      }
    });
  }

  // Handle case where feedback is like "Правильные ответы: A, B"
  if (correctAnswers.length === 1 && correctAnswers[0].includes(', ')) {
      const parts = correctAnswers[0].split(', ').map(p => p.trim());
      // Check if parts match the choices
      const allPartsInChoices = parts.every(p => choices.includes(p));
      if (allPartsInChoices) {
          correctAnswers = parts;
      }
  }

  results.push({
    question: questionText,
    choices: choices,
    correctAnswers: correctAnswers
  });
});

fs.writeFileSync('03.01МДК.json', JSON.stringify(results, null, 2));
console.log('Found ' + results.length + ' questions.');
