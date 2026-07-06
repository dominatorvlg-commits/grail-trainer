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

      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '10px', padding: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>ИТОГОВЫЙ СЧЕТ</div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-gold)', lineHeight: '1.1' }}>
          {currentScore}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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

      <div style={{ marginTop: 'auto', paddingTop: '10px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <button className="btn green" style={{ width: '100%', marginBottom: '10px' }} onClick={onRetry}>
          Повторить битву
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn purple" style={{ flex: 1, padding: '12px 10px', fontSize: '15px' }} onClick={onMenu}>
            Главное меню
          </button>
          {boardState && (
            <button className="btn" style={{ flex: 1, background: '#3b82f6', color: '#fff', padding: '12px 10px', fontSize: '15px' }} onClick={handleShare}>
              {copied ? 'Скопировано!' : 'Поделиться'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
