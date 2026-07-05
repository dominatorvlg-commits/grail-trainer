import React, { useState } from 'react';
import { COMBINATIONS } from '../data/combinations.js';

const DIFF_HINTS = {
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

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1 style={{ marginBottom: '0', textAlign: 'left' }}>Грааль Тренажер</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{theme === 'light' ? '☀️' : '🌙'}</span>
          <label className="switch" style={{ width: '36px', height: '20px' }}>
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
              onChange={(e) => setIsInfinite(e.target.checked)} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
          Сложность генерации:
        </div>
        
        <div className="diff-selector">
          <input type="radio" id="diff-easy" className="diff-radio" name="diff" value="easy" checked={difficulty === 'easy'} onChange={() => setDifficulty('easy')} />
          <label htmlFor="diff-easy" className="diff-label easy">Легко</label>
          
          <input type="radio" id="diff-medium" className="diff-radio" name="diff" value="medium" checked={difficulty === 'medium'} onChange={() => setDifficulty('medium')} />
          <label htmlFor="diff-medium" className="diff-label medium">Средне</label>
          
          <input type="radio" id="diff-hard" className="diff-radio" name="diff" value="hard" checked={difficulty === 'hard'} onChange={() => setDifficulty('hard')} />
          <label htmlFor="diff-hard" className="diff-label hard">Сложно</label>
          
          <input type="radio" id="diff-classic" className="diff-radio" name="diff" value="classic" checked={difficulty === 'classic'} onChange={() => setDifficulty('classic')} />
          <label htmlFor="diff-classic" className="diff-label classic">Классика</label>
          
          <input type="radio" id="diff-max" className="diff-radio" name="diff" value="max" checked={difficulty === 'max'} onChange={() => setDifficulty('max')} />
          <label htmlFor="diff-max" className="diff-label max">Макс. слов</label>
          
          <input type="radio" id="diff-random" className="diff-radio" name="diff" value="random_diff" checked={difficulty === 'random_diff'} onChange={() => setDifficulty('random_diff')} />
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
            onClick={() => onStart(key, false, isInfinite, difficulty)}
          >
            {COMBINATIONS[key].name}
          </button>
        ))}
        
        <button 
          className="btn green" 
          onClick={() => onStart('mixed', false, isInfinite, difficulty)}
        >
          Смешанный режим
        </button>
        
        <button 
          className="btn purple" 
          onClick={() => onStart('random', false, isInfinite, difficulty)}
        >
          Случайный режим
        </button>
      </div>
    </div>
  );
}
