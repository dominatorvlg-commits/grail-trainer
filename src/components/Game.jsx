import React, { useState, useEffect, useRef } from 'react';
import { generateBoard, isValidWord, calculatePoints, BOARD_SIZE, LAYERS_COUNT } from '../utils/gameLogic';
import { COMBINATIONS } from '../data/combinations';

export default function Game({ mode, difficulty, initialBoard, isInfiniteTime, isDuel, onEnd }) {
  const [board, setBoard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  
  // Отсчет перед игрой для дуэлей
  const [countdown, setCountdown] = useState(isDuel ? 3 : 0);
  const [countdownText, setCountdownText] = useState(isDuel ? '3' : '');
  
  // Состояния для выделения
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPath, setSelectedPath] = useState([]); // [{r, c}]
  const boardRef = useRef(null);
  
  const initialDragCell = useRef(null);

  useEffect(() => {
    if (initialBoard) {
      const restoredBoard = initialBoard.map(row => 
        row.map(cell => ({ ...cell, currentLayer: 0 }))
      );
      setBoard(restoredBoard);
    } else {
      setBoard(generateBoard(mode, difficulty));
    }
  }, [mode, difficulty, initialBoard]);

  useEffect(() => {
    // Отсчет перед началом (3.. 2.. 1..)
    if (countdown > 0) {
      const cdTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCountdownText('ПОЕХАЛИ!');
            setTimeout(() => setCountdownText(''), 1000);
            return 0;
          }
          setCountdownText(String(prev - 1));
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(cdTimer);
    }

    // Игровой таймер
    if (!isInfiniteTime && countdown === 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isInfiniteTime, countdown]);

  const finishGame = () => {
    onEnd(score, foundWords, board);
  };

  const handlePointerDown = (e, r, c) => {
    if (countdown > 0) return; // Блокируем игру во время отсчета
    e.preventDefault();
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(true);
    setSelectedPath([{ r, c }]);
    initialDragCell.current = { r, c };
  };

  const handlePointerEnter = (e, r, c) => {
    if (countdown > 0) return;
    e.preventDefault();
    if (!isDragging) return;
    
    setSelectedPath(prev => {
      if (prev.length >= 2) {
        const prevCell = prev[prev.length - 2];
        if (prevCell.r === r && prevCell.c === c) {
          return prev.slice(0, -1);
        }
      }

      if (prev.length === 0) return prev;
      
      const lastCell = prev[prev.length - 1];
      
      if (lastCell.r === r && lastCell.c === c) {
        return prev;
      }
      
      const isNeighbor = Math.abs(lastCell.r - r) <= 1 && Math.abs(lastCell.c - c) <= 1;
      const isNotAlreadySelected = !prev.find(p => p.r === r && p.c === c);
      
      if (isNeighbor && isNotAlreadySelected) {
        return [...prev, { r, c }];
      }
      
      return prev;
    });
  };

  const handlePointerUp = (e) => {
    if (e) e.preventDefault();
    setIsDragging(false);
    
    if (selectedPath.length > 1) {
      submitWord(selectedPath);
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        selectedPath.forEach(p => {
          const cell = { ...newBoard[p.r][p.c] };
          cell.currentLayer = (cell.currentLayer + 1) % LAYERS_COUNT;
          newBoard[p.r][p.c] = cell;
        });
        return newBoard;
      });
    } else if (selectedPath.length === 1) {
      const { r, c } = selectedPath[0];
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        const cell = { ...newBoard[r][c] };
        cell.currentLayer = (cell.currentLayer + 1) % LAYERS_COUNT;
        newBoard[r][c] = cell;
        return newBoard;
      });
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
      if (!foundWords.find(w => w.word === wordStr)) {
        const points = calculatePoints(wordStr, nodes);
        setScore(prev => prev + points);
        setFoundWords(prev => [{ word: wordStr, points }, ...prev]);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || countdown > 0) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = element ? element.closest('.tile') : null;
    
    if (tile && tile.dataset.row) {
      const r = parseInt(tile.dataset.row);
      const c = parseInt(tile.dataset.col);
      
      const lastCell = selectedPath[selectedPath.length - 1];
      if (!lastCell || lastCell.r !== r || lastCell.c !== c) {
        handlePointerEnter({ preventDefault: () => {} }, r, c);
      }
    }
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

  const getModeName = () => {
    if (isDuel) return 'Дуэль на одинаковом поле';
    if (mode === 'mixed') return 'Смешанный режим';
    if (mode === 'random') return 'Случайный режим';
    if (COMBINATIONS[mode]) return COMBINATIONS[mode].name;
    return mode;
  };

  return (
    <div className="screen" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', touchAction: 'none' }}>
      <div className="header">
        <div className="header-stat">
          <span>СЧЕТ</span>
          <span>{score}</span>
        </div>
        <div className="header-stat">
          {isInfiniteTime ? (
            <button 
              onClick={finishGame}
              style={{
                backgroundColor: '#ef4444', color: '#fff', border: 'none', 
                padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              ЗАВЕРШИТЬ
            </button>
          ) : (
            <>
              <span>ВРЕМЯ</span>
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '-10px', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
        {getModeName()}
      </div>

      <div className="current-word-container" style={{ marginTop: '15px' }}>
        {currentWordStr}
      </div>

      <div 
        className="board-container" 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onTouchMove={handleTouchMove}
      >
        <div className="board" ref={boardRef}>
          {board.map((row, r) => 
            row.map((cell, c) => {
              const isSelected = selectedPath.find(p => p.r === r && p.c === c);
              const tileClass = `tile-${cell.multiplier}`;
              
              return (
                <div 
                  key={`${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  className={`tile ${tileClass} ${isSelected ? 'selected' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, r, c)}
                  onPointerEnter={(e) => handlePointerEnter(e, r, c)}
                >
                  <span className="letter-text">{cell.layers[cell.currentLayer]}</span>
                </div>
              )
            })
          )}
          
          <svg className="svg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {selectedPath.length > 1 && (
              <path d={
                selectedPath.map((p, i) => {
                  const x = (p.c * 20 + 10);
                  const y = (p.r * 20 + 10);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')
              } />
            )}
          </svg>

          {countdownText && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              color: 'white', fontSize: countdownText.length > 1 ? '48px' : '96px', fontWeight: '800',
              zIndex: 100, borderRadius: '8px', animation: 'fadeIn 0.2s ease-out'
            }}>
              {countdownText}
            </div>
          )}
        </div>
      </div>
      
      <div style={{ padding: '10px', paddingBottom: 'calc(15px + env(safe-area-inset-bottom, 0px))' }}>
        <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={() => finishGame()}>
          Завершить досрочно
        </button>
      </div>
    </div>
  );
}
