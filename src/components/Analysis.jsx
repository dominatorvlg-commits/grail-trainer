import React, { useState, useEffect, useRef } from 'react';
import { calculatePoints, isValidWord, BOARD_SIZE, LAYERS_COUNT } from '../utils/gameLogic';

export default function Analysis({ initialBoard, initialWords, onExit, workerRef }) {
  const [board, setBoard] = useState(initialBoard);
  const [words, setWords] = useState(initialWords);
  const [wordIndex, setWordIndex] = useState(0);
  
  const [selectedPath, setSelectedPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const boardRef = useRef(null);
  const initialDragCell = useRef(null);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    
    const handleMessage = (e) => {
      if (e.data.type === 'RESULT') {
        setWords(e.data.words || []);
        setWordIndex(0);
        setIsCalculating(false);
      } else if (e.data.type === 'ERROR') {
        setIsCalculating(false);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [workerRef]);

  const getCellFromEvent = (e) => {
    if (!boardRef.current) return null;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    if (clientX === 0 && clientY === 0) return null;

    const elements = document.elementsFromPoint(clientX, clientY);
    const tile = elements.find(el => el.classList.contains('tile'));
    if (!tile) return null;

    const r = parseInt(tile.getAttribute('data-row'));
    const c = parseInt(tile.getAttribute('data-col'));
    return { r, c };
  };

  const handlePointerDown = (e, r, c) => {
    if (e.isPrimary === false) return;
    e.preventDefault();
    if (isCalculating) return;
    
    setIsDragging(true);
    initialDragCell.current = { r, c };
    setSelectedPath([{ r, c }]);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || e.isPrimary === false || isCalculating) return;
    e.preventDefault();

    const cell = getCellFromEvent(e);
    if (!cell) return;
    
    const { r, c } = cell;

    if (selectedPath.length > 0) {
      setSelectedPath(prev => {
        const existingIndex = prev.findIndex(p => p.r === r && p.c === c);
        if (existingIndex !== -1) {
          return prev.slice(0, existingIndex + 1);
        }
        
        const lastCell = prev[prev.length - 1];
        const dr = r - lastCell.r;
        const dc = c - lastCell.c;
        const distR = Math.abs(dr);
        const distC = Math.abs(dc);
        const isStraightLine = (distR === 0 && distC > 0) || (distC === 0 && distR > 0) || (distR === distC);
        
        if (isStraightLine) {
          const steps = Math.max(distR, distC);
          const stepR = dr / steps;
          const stepC = dc / steps;
          let newPathSegments = [];
          let isValidJump = true;
          for (let i = 1; i <= steps; i++) {
            const intermediateR = lastCell.r + stepR * i;
            const intermediateC = lastCell.c + stepC * i;
            if (prev.find(p => p.r === intermediateR && p.c === intermediateC)) {
              isValidJump = false;
              break;
            }
            newPathSegments.push({ r: intermediateR, c: intermediateC });
          }
          if (isValidJump) return [...prev, ...newPathSegments];
        }
        return prev;
      });
    }
  };

  const handlePointerUp = (e) => {
    if (e && e.isPrimary === false) return;
    if (e) e.preventDefault();
    setIsDragging(false);
    
    if (selectedPath.length > 1) {
      if (submitWord(selectedPath)) {
        // Успешно собрали слово
        const newBoard = board.map(row => [...row]);
        selectedPath.forEach(p => {
          const cell = { ...newBoard[p.r][p.c] };
          cell.currentLayer = (cell.currentLayer + 1) % LAYERS_COUNT;
          newBoard[p.r][p.c] = cell;
        });
        setBoard(newBoard);
        
        // Переход к следующему слову автоматически
        if (wordIndex < words.length - 1) {
          setWordIndex(wordIndex + 1);
        }
      }
    }
    
    setSelectedPath([]);
    initialDragCell.current = null;
  };

  const submitWord = (path) => {
    let wordStr = '';
    const nodes = [];
    path.forEach(p => {
      const cell = board[p.r][p.c];
      const letter = cell.layers[cell.currentLayer];
      wordStr += letter;
      nodes.push({ letter, multiplier: cell.multiplier });
    });

    if (isValidWord(wordStr)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const currentWordStr = selectedPath.map(p => {
    const cell = board[p.r]?.[p.c];
    return cell ? cell.layers[cell.currentLayer] : '';
  }).join('');

  const currentHint = words[wordIndex];
  const hintPath = currentHint ? currentHint.path : [];

  return (
    <div className="screen" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', touchAction: 'none' }}>
      
      <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '5px', marginTop: '15px', fontWeight: 'bold' }}>
        РАЗБОР ПОЛЯ
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <button 
          onClick={() => setWordIndex(i => Math.max(0, i - 1))}
          disabled={wordIndex === 0 || isCalculating}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '40px', height: '40px', color: 'var(--text-main)', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: wordIndex === 0 ? 0.3 : 1 }}
        >
          &lt;
        </button>
        
        <div style={{ minWidth: '180px', textAlign: 'center' }}>
          {isCalculating ? (
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>Анализ...</div>
          ) : currentHint ? (
            <>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '1px' }}>
                {currentHint.word}
              </div>
              <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>
                {currentHint.points} очков
              </div>
            </>
          ) : (
            <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Слов больше нет</div>
          )}
        </div>
        
        <button 
          onClick={() => setWordIndex(i => Math.min(words.length - 1, i + 1))}
          disabled={wordIndex === words.length - 1 || words.length === 0 || isCalculating}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '40px', height: '40px', color: 'var(--text-main)', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: wordIndex === words.length - 1 ? 0.3 : 1 }}
        >
          &gt;
        </button>
      </div>

      <div className="current-word-container" style={{ marginTop: '10px' }}>
        {currentWordStr}
      </div>

      <div 
        className="board-container" 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <div className="board" ref={boardRef}>
          {board.map((row, r) => 
            row.map((cell, c) => {
              const isSelected = selectedPath.find(p => p.r === r && p.c === c);
              const isHint = hintPath?.find(p => p.r === r && p.c === c);
              const isHintStart = isHint && hintPath[0].r === r && hintPath[0].c === c;
              
              const tileClass = `tile-${cell.multiplier}`;
              let extraClass = '';
              if (isSelected) {
                extraClass = 'selected';
              } else if (isHintStart) {
                extraClass = 'hint-start';
              } else if (isHint) {
                extraClass = 'hint-path';
              }
              
              return (
                <div 
                  key={`${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  className={`tile ${tileClass} ${extraClass}`}
                  onPointerDown={(e) => handlePointerDown(e, r, c)}
                >
                  <span className="letter-text">{cell.layers[cell.currentLayer]}</span>
                </div>
              )
            })
          )}
          
          <svg className="svg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {hintPath && hintPath.length > 1 && selectedPath.length === 0 && !isCalculating && (
              <path 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hint-svg-path"
                d={
                  hintPath.map((p, i) => {
                    const x = (p.c * 20) + 10;
                    const y = (p.r * 20) + 10;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')
                } 
              />
            )}
            
            {selectedPath.length > 1 && (
              <path 
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  selectedPath.map((p, i) => {
                    const x = (p.c * 20) + 10;
                    const y = (p.r * 20) + 10;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')
                } 
              />
            )}
          </svg>
        </div>
      </div>
      
      <div style={{ padding: '10px', paddingBottom: 'calc(15px + env(safe-area-inset-bottom, 0px))' }}>
        <button className="btn" style={{ backgroundColor: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} onClick={onExit}>
          Вернуться к статистике
        </button>
      </div>
    </div>
  );
}
