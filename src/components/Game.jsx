import React, { useState, useEffect, useRef } from 'react';
import { generateBoard, isValidWord, calculatePoints, BOARD_SIZE, LAYERS_COUNT } from '../utils/gameLogic';
import { COMBINATIONS } from '../data/combinations';

export default function Game({ mode, difficulty, initialBoard, isInfiniteTime, onEnd }) {
  const [board, setBoard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  
  // Состояния для выделения
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPath, setSelectedPath] = useState([]); // [{r, c}]
  const boardRef = useRef(null);
  
  // Для определения тапа (смены слоя) vs свайпа (выделения)
  const dragStartTime = useRef(0);
  const initialDragCell = useRef(null);

  useEffect(() => {
    if (initialBoard) {
      // Клонируем доску и сбрасываем currentLayer на 0
      const restoredBoard = initialBoard.map(row => 
        row.map(cell => ({ ...cell, currentLayer: 0 }))
      );
      setBoard(restoredBoard);
    } else {
      setBoard(generateBoard(mode, difficulty));
    }
    
    if (!isInfiniteTime) {
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
  }, [mode, initialBoard, isInfiniteTime]);

  const finishGame = () => {
    // Передаем board в onEnd для асинхронного поиска слов через Web Worker
    onEnd(score, foundWords, board);
  };

  const handlePointerDown = (e, r, c) => {
    e.preventDefault(); // Блокируем стандартное поведение браузера (в т.ч. зум)
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(true);
    setSelectedPath([{ r, c }]);
    dragStartTime.current = Date.now();
    initialDragCell.current = { r, c };
  };

  const handlePointerEnter = (e, r, c) => {
    e.preventDefault();
    if (!isDragging) return;
    
    setSelectedPath(prev => {
      if (prev.length >= 2) {
        const prevCell = prev[prev.length - 2];
        if (prevCell.r === r && prevCell.c === c) {
          return prev.slice(0, -1);
        }
      }

      if (prev.length === 0) return prev; // Защита (хотя pointerDown добавляет первый элемент)
      
      const lastCell = prev[prev.length - 1];
      
      // Если мы всё ещё на той же клетке, ничего не делаем
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
        const newBoard = [...prev];
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
        const newBoard = [...prev];
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
    // В React touchMove пассивный, но мы не делаем preventDefault,
    // так как CSS touch-action: none уже блокирует скролл.
    if (!isDragging) return;
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

  // Блокируем контекстное меню, чтобы при долгом нажатии ничего не вылезало
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentWordStr = selectedPath.map(p => {
    const cell = board[p.r]?.[p.c];
    return cell ? cell.layers[cell.currentLayer] : '';
  }).join('');

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

      <div className="current-word-container">
        {currentWordStr || mode}
      </div>

      <div 
        className="board-container" 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerUp}
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
          
          {/* Слой с линиями выделения */}
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
        </div>
      </div>
      
      <div style={{ padding: '10px' }}>
        <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={() => finishGame()}>
          Завершить досрочно
        </button>
      </div>
    </div>
  );
}
