import React, { useState, useEffect } from 'react';
import { COMBINATIONS } from '../data/combinations.js';
import { soundManager } from '../utils/SoundManager';

const DIFF_HINTS = {
  super_easy: 'Самые простые и часто употребляемые слова (6-10 букв), которые проходят прямо по бонусам. Идеально для старта.',
  easy: 'Поле содержит много длинных слов (8-15 букв), которые специально проходят через максимальное число бонусов.',
  medium: 'Сбалансированное поле со словами средней длины (6-12 букв). Бонусы распределены полу-случайно.',
  hard: 'Короткие слова (4-8 букв), бонусы разбросаны случайным образом вдали от хороших комбинаций. Настоящий вызов!',
  classic: 'Классическая генерация Грааль Тренажера: длинные слова, но без фанатичного притяжения к бонусам.',
  max: 'Поле под завязку набито гигантскими словами (10-15 букв), маршруты которых усыпаны бонусами.',
  random_diff: 'Один из 5 уровней сложности будет выбран случайно. Узнаете только в бою!'
};

export default function Menu({ onStart, theme, onToggleTheme }) {
  const [isInfinite, setIsInfinite] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [boardCode, setBoardCode] = useState('');
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  useEffect(() => {
    setIsMuted(soundManager.isMuted);
  }, []);

  const toggleSound = () => {
    soundManager.playMenuClick();
    setIsMuted(soundManager.toggleMute());
  };

  const handleStart = (mode, isRetry, infinite, diff, board) => {
    soundManager.playMenuClick();
    onStart(mode, isRetry, infinite, diff, board);
  };

  const handlePlayCode = () => {
    let code = boardCode.trim();
    if (!code) return;
    
    try {
      if (code.includes('?board=')) {
        const url = new URL(code.startsWith('http') ? code : 'https://dummy.com/' + code);
        code = url.searchParams.get('board') || code;
      }
    } catch(e) {}

    import('../utils/gameLogic').then(({ deserializeBoard }) => {
      const board = deserializeBoard(code);
      if (board) {
        handleStart('duel', false, false, 'medium', board);
      } else {
        alert('Неверный код поля или ссылка!');
      }
    });
  };

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1 style={{ marginBottom: '0', textAlign: 'left' }}>Грааль Тренажер</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={toggleSound}
            style={{
              background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
              color: isMuted ? 'var(--text-muted)' : 'var(--text-main)', padding: '0 5px'
            }}
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Тема:</span>
          <span style={{ fontSize: '18px' }}>{theme === 'light' ? '☀️' : '🌙'}</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={theme === 'dark'} 
              onChange={onToggleTheme} 
            />
            <span className="slider round" style={{ background: theme === 'light' ? '#cbd5e1' : '#1e293b' }}></span>
          </label>
        </div>
      </div>
      <p style={{ textAlign: 'left', marginBottom: '25px', color: 'var(--text-muted)' }}>Выберите параметры тренировки</p>
      
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Без времени (бесконечно)</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isInfinite} 
              onChange={(e) => {
                soundManager.playMenuClick();
                setIsInfinite(e.target.checked);
              }} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
          Сложность генерации:
        </div>
        
        <div className="diff-selector" style={{ flexWrap: 'wrap' }}>
          <input type="radio" id="diff-super-easy" className="diff-radio" name="diff" value="super_easy" checked={difficulty === 'super_easy'} onChange={() => {soundManager.playMenuClick(); setDifficulty('super_easy')}} />
          <label htmlFor="diff-super-easy" className="diff-label super-easy">Супер легко</label>
          
          <input type="radio" id="diff-easy" className="diff-radio" name="diff" value="easy" checked={difficulty === 'easy'} onChange={() => {soundManager.playMenuClick(); setDifficulty('easy')}} />
          <label htmlFor="diff-easy" className="diff-label easy">Легко</label>
          
          <input type="radio" id="diff-medium" className="diff-radio" name="diff" value="medium" checked={difficulty === 'medium'} onChange={() => {soundManager.playMenuClick(); setDifficulty('medium')}} />
          <label htmlFor="diff-medium" className="diff-label medium">Средне</label>
          
          <input type="radio" id="diff-hard" className="diff-radio" name="diff" value="hard" checked={difficulty === 'hard'} onChange={() => {soundManager.playMenuClick(); setDifficulty('hard')}} />
          <label htmlFor="diff-hard" className="diff-label hard">Сложно</label>
          
          <input type="radio" id="diff-classic" className="diff-radio" name="diff" value="classic" checked={difficulty === 'classic'} onChange={() => {soundManager.playMenuClick(); setDifficulty('classic')}} />
          <label htmlFor="diff-classic" className="diff-label classic">Классика</label>
          
          <input type="radio" id="diff-max" className="diff-radio" name="diff" value="max" checked={difficulty === 'max'} onChange={() => {soundManager.playMenuClick(); setDifficulty('max')}} />
          <label htmlFor="diff-max" className="diff-label max">Макс. слов</label>
          
          <input type="radio" id="diff-random" className="diff-radio" name="diff" value="random_diff" checked={difficulty === 'random_diff'} onChange={() => {soundManager.playMenuClick(); setDifficulty('random_diff')}} />
          <label htmlFor="diff-random" className="diff-label random">Случайно</label>
        </div>
        
        <div className="hint-box">
          {DIFF_HINTS[difficulty]}
        </div>
      </div>

      <div className="mode-list">
        {Object.keys(COMBINATIONS).map(key => (
          <button 
            key={key} 
            className="btn" 
            onClick={() => handleStart(key, false, isInfinite, difficulty)}
          >
            {COMBINATIONS[key].name}
          </button>
        ))}
        
        <button 
          className="btn green" 
          onClick={() => handleStart('mixed', false, isInfinite, difficulty)}
        >
          Смешанный режим
        </button>
        
        <button 
          className="btn purple" 
          onClick={() => handleStart('random', false, isInfinite, difficulty)}
        >
          Случайный режим
        </button>

        {showCodeInput ? (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input 
              type="text" 
              value={boardCode}
              onChange={(e) => setBoardCode(e.target.value)}
              placeholder="Вставьте ссылку или код"
              style={{ 
                flex: 1, padding: '12px', borderRadius: '8px', 
                border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', 
                color: 'var(--text-main)', fontSize: '14px', outline: 'none'
              }}
            />
            <button className="btn green" style={{ width: 'auto', padding: '12px 20px' }} onClick={handlePlayCode}>
              Старт
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <button 
              className="btn duel" 
              onClick={() => {soundManager.playMenuClick(); setShowCodeInput(true)}}
            >
              Ввести номер поля (Дуэль)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
