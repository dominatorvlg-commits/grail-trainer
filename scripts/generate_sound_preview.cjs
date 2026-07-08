const fs = require('fs');
const path = require('path');

const soundsDir = 'C:/Users/yscov/.gemini/antigravity/brain/728fc46d-2409-42b4-9f59-d941024c9a91/scratch/sounds/addons/kenney_ui_audio';
const files = fs.readdirSync(soundsDir).filter(f => f.endsWith('.wav'));

const actions = {
  'Выделение буквы (Нарастающий звук)': files.filter(f => f.startsWith('rollover') || ['click1.wav', 'click2.wav', 'switch1.wav', 'switch2.wav'].includes(f)).slice(0, 10),
  'Клик в меню': files.filter(f => f.startsWith('click') || f.startsWith('mouse')).slice(0, 10),
  'Обычное слово (до 20 очков)': ['switch1.wav', 'switch2.wav', 'switch3.wav', 'switch4.wav', 'switch5.wav', 'switch6.wav', 'switch7.wav', 'switch8.wav', 'switch9.wav', 'switch10.wav'],
  'Среднее слово (21-50 очков)': ['switch11.wav', 'switch12.wav', 'switch13.wav', 'switch14.wav', 'switch15.wav', 'switch16.wav', 'switch17.wav', 'switch18.wav', 'switch19.wav', 'switch20.wav'],
  'Дорогое слово (51-100 очков)': ['switch21.wav', 'switch22.wav', 'switch23.wav', 'switch24.wav', 'switch25.wav', 'switch26.wav', 'switch27.wav', 'switch28.wav', 'switch29.wav', 'switch30.wav'],
  'СУПЕР слово (101+ очков)': ['switch31.wav', 'switch32.wav', 'switch33.wav', 'switch34.wav', 'switch35.wav', 'switch36.wav', 'switch37.wav', 'switch38.wav'],
  'Неверное слово (Ошибка)': ['switch11.wav', 'switch12.wav', 'switch13.wav', 'switch14.wav', 'switch15.wav', 'switch16.wav', 'switch17.wav', 'switch18.wav'],
  'Тиканье таймера': ['click1.wav', 'click2.wav', 'click3.wav', 'click4.wav', 'click5.wav', 'switch2.wav', 'switch4.wav', 'rollover1.wav', 'rollover2.wav', 'rollover3.wav'],
  'Старт игры': ['switch1.wav', 'switch14.wav', 'switch15.wav', 'switch22.wav', 'switch23.wav', 'switch33.wav', 'switch34.wav', 'switch38.wav'],
  'Мелодия конца игры': ['switch20.wav', 'switch21.wav', 'switch30.wav', 'switch31.wav', 'switch32.wav', 'switch33.wav', 'switch36.wav', 'switch37.wav']
};

let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sound Preview</title>
  <style>
    body { font-family: sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .category { margin-bottom: 30px; background: #16213e; padding: 15px; border-radius: 8px; }
    .category h2 { margin-top: 0; color: #e94560; }
    .sound-item { display: inline-flex; align-items: center; background: #0f3460; padding: 10px; margin: 5px; border-radius: 5px; width: 250px;}
    .sound-item button { margin-right: 10px; background: #e94560; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
    .sound-item button:hover { background: #ff5e7e; }
  </style>
</head>
<body>
  <h1>Предпросмотр звуков для игры</h1>
  <p>Послушайте варианты и напишите мне в чат, какие номера/файлы вы выбрали для каждой категории.</p>
`;

for (let [action, actionFiles] of Object.entries(actions)) {
  html += `<div class="category"><h2>${action}</h2><div>`;
  actionFiles.forEach((file, idx) => {
    html += `<div class="sound-item">
      <button onclick="new Audio('scratch/sounds/addons/kenney_ui_audio/${file}').play()">Play</button>
      <span>Вариант ${idx + 1} (${file})</span>
    </div>`;
  });
  html += `</div></div>`;
}

html += `</body></html>`;

fs.writeFileSync('C:/Users/yscov/.gemini/antigravity/brain/728fc46d-2409-42b4-9f59-d941024c9a91/sound_preview.html', html, 'utf8');
