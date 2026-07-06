import React, { useState } from 'react';
import { serializeBoard } from '../utils/gameLogic';

export default function Results({ score, foundWords, allWords, isAnalyzing, previousResult, boardState, onRetry, onMenu }) {
  const [tab, setTab] = useState('current'); // 'current', 'previous', 'missed'
  const [copied, setCopied] = useState(false);

  const currentWords = tab === 'previous' && previousResult ? previousResult.foundWords : foundWords;
  const currentScore = tab === 'previous' && previousResult ? previousResult.score : score;

  const missedWords = allWords.filter(w => !foundWords.find(fw => fw.word === w.word));

  const handleShare = () => {
    if (!boardState) return;
    const code = serializeBoard(boardState);
    const url = window.location.origin + window.location.pathname + '?board=' + code;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="screen">
      <h1>Результаты</h1>
      
      {previousResult && (
        <div className="tabs">
          <div 
            className={`tab ${tab === 'current' ? 'active' : ''}`}
            onClick={() => setTab('current')}
          >
            Текущий
          </div>
          <div 
            className={`tab ${tab === 'previous' ? 'active' : ''}`}
            onClick={() => setTab('previous')}
          >
            Прошлый
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '5px' }}>ИТОГОВЫЙ СЧЕТ</div>
        <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--accent-gold)' }}>
          {currentScore}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '5px' }}>
          Найдено слов: {currentWords.length} / {allWords.length || '?'}
        </div>
      </div>

      <div className="tabs" style={{ fontSize: '14px' }}>
        <div 
          className={`tab ${tab !== 'missed' ? 'active' : ''}`}
          onClick={() => setTab(previousResult ? 'current' : 'current')}
        >
          Найденные
        </div>
        <div 
          className={`tab ${tab === 'missed' ? 'active' : ''}`}
          onClick={() => setTab('missed')}
        >
          Пропущенные ({missedWords.length})
        </div>
      </div>

      <div className="word-list">
        {isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ fontSize: '24px', marginBottom: '15px', animation: 'spin 2s linear infinite' }}>⏳</div>
            <div style={{ fontWeight: '600' }}>Анализируем все 5 слоев поля...</div>
            <div style={{ fontSize: '12px', marginTop: '10px' }}>Это займет пару секунд</div>
          </div>
        ) : (
          <>
            {tab === 'missed' ? (
              missedWords.map((w, i) => (
                <div key={i} className="word-item" style={{ opacity: 0.7 }}>
                  <span>{w.word}</span>
                  <span>{w.points}</span>
                </div>
              ))
            ) : (
              currentWords.map((w, i) => (
                <div key={i} className="word-item">
                  <span style={{ fontWeight: '600' }}>{w.word}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>+{w.points}</span>
                </div>
              ))
            )}
            {(tab === 'missed' ? missedWords : currentWords).length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>
                Ничего нет
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {boardState && (
          <button className="btn" style={{ background: '#3b82f6', color: '#fff' }} onClick={handleShare}>
            {copied ? 'Ссылка скопирована!' : 'Поделиться полем'}
          </button>
        )}
        <button className="btn green" onClick={onRetry}>Повторить битву</button>
        <button className="btn purple" onClick={onMenu}>В главное меню</button>
      </div>
    </div>
  );
}
