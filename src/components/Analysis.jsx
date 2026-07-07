import React, { useState, useEffect, useRef } from 'react';
import { calculatePoints, isValidWord, BOARD_SIZE, LAYERS_COUNT } from '../utils/gameLogic';

const Tile = React.memo(({ r, c, letter, multiplier, isSelected, hintTargetLetter, onDown }) => {
  const tileClass = `tile-${multiplier}`;
  return (
    <div 
      data-row={r}
      data-col={c}
      className={`tile ${tileClass} ${isSelected ? 'selected' : ''}`}
      onPointerDown={(e) => onDown(e, r, c)}
    >
      <span className="letter-text">{letter}</span>
      {hintTargetLetter && (
        <div className="hint-badge">
          <span className="hint-badge-text">{hintTargetLetter}</span>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.letter === next.letter &&
         prev.multiplier === next.multiplier &&
         prev.isSelected === next.isSelected &&
         prev.hintTargetLetter === next.hintTargetLetter;
});

export default function Analysis({ initialBoard, initialWords, onExit, workerRef }) {
  const [board, setBoard] = useState(initialBoard);
  const [words, setWords] = useState(initialWords);
  const [wordIndex, setWordIndex] = useState(0);
  
  const [selectedPath, setSelectedPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const boardRef = useRef(null);
  const boardRectRef = useRef(null);
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

  const handlePointerDown = React.useCallback((e, r, c) => {
    if (e.isPrimary === false) return;
    e.preventDefault();
    if (isCalculating) return;
    
    setIsDragging(true);
    initialDragCell.current = { r, c };
    setSelectedPath([{ r, c }]);
    
    if (boardRef.current) {
      boardRectRef.current = boardRef.current.getBoundingClientRect();
    }
  }, [isCalculating]);

  const handlePointerMove = (e) => {
    if (!isDragging || e.isPrimary === false || isCalculating) return;
    if (!boardRectRef.current) return;
    e.preventDefault();

    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const rect = boardRectRef.current;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const gap = 8;
    const cellWidth = (rect.width - 4 * gap) / 5;
    const cellHeight = (rect.height - 4 * gap) / 5;
    
    const c = Math.floor(x / (cellWidth + gap));
    const r = Math.floor(y / (cellHeight + gap));
    
    if (c < 0 || c >= 5 || r < 0 || r >= 5) return;
    
    const startX = c * (cellWidth + gap);
    const startY = r * (cellHeight + gap);
    if (x > startX + cellWidth || y > startY + cellHeight) return;
    
    const centerX = startX + cellWidth / 2;
    const centerY = startY + cellHeight / 2;
    
    const distance = Math.hypot(x - centerX, y - centerY);
    const maxRadius = Math.min(cellWidth, cellHeight) * 0.40;
    
    if (distance > maxRadius) return;

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
    
    let newBoard = board;
    
    if (selectedPath.length > 1) {
      newBoard = board.map(row => [...row]);
      selectedPath.forEach(p => {
        const cell = { ...newBoard[p.r][p.c] };
        cell.currentLayer = (cell.currentLayer + 1) % LAYERS_COUNT;
        newBoard[p.r][p.c] = cell;
      });
      setBoard(newBoard);
    } else if (selectedPath.length === 1) {
      const { r, c } = selectedPath[0];
      newBoard = board.map(row => [...row]);
      const cell = { ...newBoard[r][c] };
      cell.currentLayer = (cell.currentLayer + 1) % LAYERS_COUNT;
      newBoard[r][c] = cell;
      setBoard(newBoard);
    }
    
    const currentHint = words[wordIndex];
    if (selectedPath.length > 0 && currentHint && currentHint.path) {
      const currentWordOnHintPath = currentHint.path.map(p => {
        const cell = newBoard[p.r][p.c];
        return cell.layers[cell.currentLayer];
      }).join('');
      
      if (currentWordOnHintPath === currentHint.word) {
        if (wordIndex < words.length - 1) {
          setWordIndex(wordIndex + 1);
        }
      }
    }
    
    setSelectedPath([]);
    initialDragCell.current = null;
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
              const isSelected = !!selectedPath.find(p => p.r === r && p.c === c);
              const hintIndex = hintPath?.findIndex(p => p.r === r && p.c === c);
              const hintTargetLetter = (hintIndex !== undefined && hintIndex !== -1 && currentHint) ? currentHint.word[hintIndex] : null;
              
              return (
                <Tile
                  key={`${r}-${c}`}
                  r={r}
                  c={c}
                  letter={cell.layers[cell.currentLayer]}
                  multiplier={cell.multiplier}
                  isSelected={isSelected}
                  hintTargetLetter={hintTargetLetter}
                  onDown={handlePointerDown}
                />
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
