import React, { useState, useMemo } from 'react';
import { serializeBoard, getDifficultyConstraints } from '../utils/gameLogic';

export default function Results({ score, foundWords, allWords, isAnalyzing, previousResult, isDuel, boardState, difficulty, onRetry, onMenu, onAnalysis }) {
  const [tab, setTab] = useState('target'); // 'found', 'target', 'top', 'previous'
  const [copied, setCopied] = useState(false);

  const currentWords = tab === 'previous' && previousResult ? previousResult.foundWords : foundWords;
  const currentScore = tab === 'previous' && previousResult ? previousResult.score : score;

  const missedWords = useMemo(() => {
    return allWords.filter(w => !foundWords.find(fw => fw.word === w.word));
  }, [allWords, foundWords]);

  const { targetMissed, topMissed, minLength, maxLength } = useMemo(() => {
    const { minLength, maxLength } = getDifficultyConstraints(difficulty || 'medium');
    const target = missedWords.filter(w => w.length >= minLength && w.length <= maxLength).slice(0, 500);
    const top = [...missedWords].sort((a, b) => b.points - a.points).slice(0, 100);
    return { targetMissed: target, topMissed: top, minLength, maxLength };
  }, [missedWords, difficulty]);

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

      <div className="tabs" style={{ fontSize: '13px', display: 'flex', gap: '5px' }}>
        <div 
          className={`tab ${tab === 'found' ? 'active' : ''}`}
          onClick={() => setTab('found')}
          style={{ flex: 1, padding: '8px 5px', textAlign: 'center' }}
        >
          Найденные ({currentWords.length})
        </div>
        <div 
          className={`tab ${tab === 'target' ? 'active' : ''}`}
          onClick={() => setTab('target')}
          style={{ flex: 1, padding: '8px 5px', textAlign: 'center' }}
        >
          Целевые {minLength}-{maxLength} ({isAnalyzing ? '...' : targetMissed.length})
        </div>
        <div 
          className={`tab ${tab === 'top' ? 'active' : ''}`}
          onClick={() => setTab('top')}
          style={{ flex: 1, padding: '8px 5px', textAlign: 'center' }}
        >
          Топ-100 ({isAnalyzing ? '...' : topMissed.length})
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
            {tab === 'found' && (
              currentWords.map((w, i) => (
                <div key={i} className="word-item">
                  <span style={{ fontWeight: '600' }}>{w.word}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>+{w.points}</span>
                </div>
              ))
            )}
            {tab === 'target' && (
              targetMissed.map((w, i) => (
                <div key={i} className="word-item" style={{ opacity: 0.7 }}>
                  <span>{w.word}</span>
                  <span>{w.points}</span>
                </div>
              ))
            )}
            {tab === 'top' && (
              topMissed.map((w, i) => (
                <div key={i} className="word-item" style={{ opacity: 0.7 }}>
                  <span>{w.word}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{w.points}</span>
                </div>
              ))
            )}
            
            {(tab === 'found' && currentWords.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Вы ничего не нашли</div>
            )}
            {(tab === 'target' && targetMissed.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Нет пропущенных целевых слов</div>
            )}
            {(tab === 'top' && topMissed.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Нет пропущенных слов</div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {tab === 'found' && 'Будут разобраны ваши найденные слова'}
        {tab === 'target' && `Будут разобраны ненайденные слова от ${minLength} до ${maxLength} букв`}
        {tab === 'top' && 'Будут разобраны 100 самых дорогих слов'}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '10px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <button className="btn green" style={{ width: '100%', marginBottom: '10px' }} 
          onClick={() => {
            if (tab === 'found') onAnalysis(currentWords);
            else if (tab === 'target') onAnalysis(targetMissed);
            else if (tab === 'top') onAnalysis(topMissed);
            else onAnalysis(targetMissed);
          }} 
          disabled={allWords.length === 0 && !isAnalyzing}
        >
          Разбор поля
        </button>
        <button className="btn" style={{ width: '100%', marginBottom: '10px', background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} onClick={onRetry}>
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
