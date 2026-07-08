import React, { useState, useMemo } from 'react';
import { serializeBoard, getDifficultyConstraints, getModeEndings } from '../utils/gameLogic';

export default function Results({ score, foundWords, allWords, isAnalyzing, previousResult, isDuel, boardState, difficulty, mode, onRetry, onMenu, onAnalysis }) {
  const [tab, setTab] = useState('target'); // 'found', 'target', 'top', 'previous'
  const [selectedLength, setSelectedLength] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentWords = tab === 'previous' && previousResult ? previousResult.foundWords : foundWords;
  const currentScore = tab === 'previous' && previousResult ? previousResult.score : score;

  const missedWords = useMemo(() => {
    return allWords.filter(w => !foundWords.find(fw => fw.word === w.word));
  }, [allWords, foundWords]);

  const { targetWordsAll, targetWordsByLength, targetLengths, topMissed, minLength, maxLength } = useMemo(() => {
    const { minLength, maxLength } = getDifficultyConstraints(difficulty || 'medium');
    const modeEndings = getModeEndings(mode);
    
    // Целевые слова (все: и найденные, и пропущенные любой длины)
    const targetAll = allWords.filter(w => {
      const endingValid = modeEndings.length > 0 ? modeEndings.some(ending => w.word.toUpperCase().endsWith(ending)) : true;
      return endingValid;
    }).slice(0, 500);

    const byLength = {};
    targetAll.forEach(w => {
      if (!byLength[w.length]) byLength[w.length] = [];
      byLength[w.length].push(w);
    });
    
    const lengths = Object.keys(byLength).map(Number).sort((a, b) => a - b);
    
    const top = [...missedWords].sort((a, b) => b.points - a.points).slice(0, 100);
    return { targetWordsAll: targetAll, targetWordsByLength: byLength, targetLengths: lengths, topMissed: top, minLength, maxLength };
  }, [allWords, missedWords, difficulty, mode]);

  React.useEffect(() => {
    if (tab === 'target' && targetLengths.length > 0 && (!selectedLength || !targetLengths.includes(selectedLength))) {
      setSelectedLength(targetLengths[0]);
    }
  }, [tab, targetLengths, selectedLength]);

  const displayedTargetWords = selectedLength ? (targetWordsByLength[selectedLength] || []) : [];
  const missedDisplayedTargetWords = displayedTargetWords.filter(w => !foundWords.find(fw => fw.word === w.word));
  const missedTargetCount = targetWordsAll.filter(w => !foundWords.find(fw => fw.word === w.word)).length;

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
          Целевые ({isAnalyzing ? '...' : missedTargetCount})
        </div>
        <div 
          className={`tab ${tab === 'top' ? 'active' : ''}`}
          onClick={() => setTab('top')}
          style={{ flex: 1, padding: '8px 5px', textAlign: 'center' }}
        >
          Топ-100 ({isAnalyzing ? '...' : topMissed.length})
        </div>
      </div>

      {tab === 'target' && targetLengths.length > 0 && (
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0', marginBottom: '5px', scrollbarWidth: 'none' }}>
          {targetLengths.map(len => {
            const wordsOfLen = targetWordsByLength[len];
            const foundOfLen = wordsOfLen.filter(w => foundWords.find(fw => fw.word === w.word)).length;
            const allOfLen = wordsOfLen.length;
            const isCompleted = foundOfLen === allOfLen;
            return (
              <div 
                  key={len}
                  onClick={() => setSelectedLength(len)}
                  className={`sub-tab ${selectedLength === len ? 'selected' : (isCompleted ? 'completed' : '')}`}
                >
                {len} букв ({foundOfLen}/{allOfLen})
              </div>
            );
          })}
        </div>
      )}

      <div className="word-list" style={{ flex: 1, minHeight: 0, marginTop: tab === 'target' ? '5px' : '15px' }}>
        {isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ fontSize: '24px', marginBottom: '15px', animation: 'spin 2s linear infinite' }}>⏳</div>
            <div style={{ fontWeight: '600' }}>Анализируем все 5 слоев поля...</div>
            <div style={{ fontSize: '12px', marginTop: '10px' }}>Это займет пару секунд</div>
          </div>
        ) : (
          <>
            {tab === 'found' && (
              currentWords.slice(0, 1000).map((w, i) => (
                <div key={i} className="word-item">
                  <span style={{ fontWeight: '600' }}>{w.word}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>+{w.points}</span>
                </div>
              ))
            )}
            {tab === 'found' && currentWords.length > 1000 && (
              <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>
                ...и еще {currentWords.length - 1000} слов
              </div>
            )}
            {tab === 'target' && (
              displayedTargetWords.map((w, i) => {
                const isFound = foundWords.find(fw => fw.word === w.word);
                return (
                  <div key={i} className="word-item" style={{ 
                    opacity: isFound ? 1 : 0.7, 
                    borderLeft: isFound ? '3px solid #10b981' : '3px solid transparent',
                    backgroundColor: isFound ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                  }}>
                    <span style={{ fontWeight: isFound ? 'bold' : 'normal', color: isFound ? '#10b981' : 'var(--text-main)' }}>
                      {w.word}
                    </span>
                    <span style={{ color: isFound ? '#10b981' : 'var(--text-muted)' }}>
                      {isFound ? '✓ Найдено' : w.points}
                    </span>
                  </div>
                );
              })
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
            {(tab === 'target' && displayedTargetWords.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Нет целевых слов</div>
            )}
            {(tab === 'top' && topMissed.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Нет пропущенных слов</div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {tab === 'found' && 'Будут разобраны ваши найденные слова'}
        {tab === 'target' && `Будут разобраны ненайденные слова из ${selectedLength} букв`}
        {tab === 'top' && 'Будут разобраны 100 самых дорогих слов'}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '10px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <button className="btn green" style={{ width: '100%', marginBottom: '10px' }} 
          onClick={() => {
            if (tab === 'found') onAnalysis(currentWords);
            else if (tab === 'target') onAnalysis(missedDisplayedTargetWords);
            else if (tab === 'top') onAnalysis(topMissed);
            else onAnalysis(missedDisplayedTargetWords);
          }} 
          disabled={(allWords.length === 0 && !isAnalyzing) || (tab === 'target' && missedDisplayedTargetWords.length === 0)}
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
