const fs = require('fs');
const path = require('path');

let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sound Preview (Web Audio Synth)</title>
  <style>
    body { font-family: sans-serif; background: #1a1a2e; color: #fff; padding: 20px; }
    .category { margin-bottom: 30px; background: #16213e; padding: 15px; border-radius: 8px; }
    .category h2 { margin-top: 0; color: #e94560; }
    .sound-item { display: flex; align-items: center; background: #0f3460; padding: 10px; margin: 5px 0; border-radius: 5px; width: 450px; justify-content: space-between;}
    .sound-item button { margin-right: 10px; background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px;}
    .sound-item button:hover { background: #ff5e7e; }
    .desc { font-size: 14px; color: #ccc; flex-grow: 1; text-align: right; }
  </style>
</head>
<body>
  <h1>Предпросмотр звуков (Синтезатор / Вариант 1)</h1>
  <p>Я понял вас! Стандартные "клики" действительно скучноваты для геймплея. В головоломках со словами обычно используют "стеклянные", "деревянные" или "музыкальные" звуки (ксилофон, колокольчики).</p>
  <p>Послушайте, как звучит <b>Программная генерация (Вариант 1)</b>, который я изначально рекомендовал. Это чистые математические звуки, они генерируются кодом и идеально подходят для таких игр.</p>

  <div class="category">
    <h2>1. Выделение буквы (Свайп)</h2>
    <div class="sound-item">
      <button onclick="playSwipe()">Свайп (клик-клик!)</button>
      <span class="desc">Стеклянный "бульк", тон растет</span>
    </div>
  </div>

  <div class="category">
    <h2>2. Найденные слова (Успех)</h2>
    <div class="sound-item">
      <button onclick="playSuccess(1)">Обычное слово (до 20)</button>
      <span class="desc">Короткий приятный "Дзинь"</span>
    </div>
    <div class="sound-item">
      <button onclick="playSuccess(2)">Среднее слово (21-50)</button>
      <span class="desc">Двойной перезвон</span>
    </div>
    <div class="sound-item">
      <button onclick="playSuccess(3)">Дорогое слово (51-100)</button>
      <span class="desc">Мажорное арпеджио</span>
    </div>
    <div class="sound-item">
      <button onclick="playSuccess(4)">СУПЕР слово (101+)</button>
      <span class="desc">Торжественный аккорд с эхо</span>
    </div>
  </div>

  <div class="category">
    <h2>3. Ошибка / Нет слова</h2>
    <div class="sound-item">
      <button onclick="playError()">Сброс выделения</button>
      <span class="desc">Глухой деревянный стук</span>
    </div>
  </div>

  <div class="category">
    <h2>4. Таймер</h2>
    <div class="sound-item">
      <button onclick="playTick()">Тиканье (последние 10 сек)</button>
      <span class="desc">Резкий и четкий метроном</span>
    </div>
  </div>

  <script>
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    function playTone(freq, type, duration, vol, delay=0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    }

    let swipePitch = 0;
    let swipeTimeout;
    function playSwipe() {
      const baseFreq = 220; // Lowered from 440
      const freq = baseFreq * Math.pow(1.05946309, swipePitch); 
      
      playTone(freq, 'sine', 0.3, 0.4);
      playTone(freq * 2, 'triangle', 0.2, 0.1);
      
      swipePitch += 1;
      clearTimeout(swipeTimeout);
      swipeTimeout = setTimeout(() => { swipePitch = 0; }, 1000); 
    }

    function playSuccess(level) {
      if (level === 1) {
        playTone(440, 'sine', 0.4, 0.5); // Lowered from 880
        playTone(880, 'sine', 0.6, 0.2); // Lowered from 1760
      } else if (level === 2) {
        playTone(440, 'sine', 0.3, 0.4, 0); 
        playTone(554.37, 'sine', 0.5, 0.4, 0.1); 
      } else if (level === 3) {
        playTone(440, 'sine', 0.3, 0.3, 0); 
        playTone(554.37, 'sine', 0.3, 0.3, 0.08); 
        playTone(659.25, 'sine', 0.6, 0.4, 0.16); 
      } else if (level === 4) {
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          playTone(freq, 'sine', 1.5, 0.3, i * 0.05);
          playTone(freq/2, 'triangle', 1.5, 0.2, i * 0.05);
        });
      }
    }

    function playError() {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }

    function playTick() {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/yscov/.gemini/antigravity/brain/728fc46d-2409-42b4-9f59-d941024c9a91/sound_preview_synth.html', html, 'utf8');
