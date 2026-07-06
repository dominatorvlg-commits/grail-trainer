import { useState, useEffect, useRef } from 'react';
import './index.css';
import Menu from './components/Menu';
import Game from './components/Game';
import Results from './components/Results';
import { deserializeBoard, serializeBoard } from './utils/gameLogic';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'game', 'results'
  const [mode, setMode] = useState(null);
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previousResult, setPreviousResult] = useState(null);
  const [boardState, setBoardState] = useState(null); // Сохраняем поле
  const [isInfiniteTime, setIsInfiniteTime] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('dark');
  const [isDuel, setIsDuel] = useState(false);

  const workerRef = useRef(null);

  useEffect(() => {
    // Инициализируем Web Worker для фонового поиска
    workerRef.current = new Worker(new URL('./workers/wordFinder.js', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'RESULT') {
        setAllWords(e.data.words);
        setIsAnalyzing(false);
      }
    };

    // Парсинг URL
    const params = new URLSearchParams(window.location.search);
    const boardCode = params.get('board');
    if (boardCode) {
      const decoded = deserializeBoard(boardCode);
      if (decoded) {
        setBoardState(decoded);
        setIsInfiniteTime(false); // Дуэли всегда на время (5 минут)
        setMode('duel');
        setIsDuel(true);
        setGameState('game');
        
        // Очищаем URL, чтобы при обновлении не стартовать заново
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => workerRef.current.terminate();
  }, []);

  const startGame = (selectedMode, isRetry = false, infinite = false, diff = 'medium', customBoard = null) => {
    if (isRetry) {
      setPreviousResult({ score, foundWords });
      // При повторе мы не сбрасываем allWords и boardState!
    } else {
      setPreviousResult(null);
      setAllWords([]);
      setIsInfiniteTime(infinite);
      setDifficulty(diff);
      
      if (customBoard) {
        setBoardState(customBoard);
        setIsDuel(true);
        selectedMode = 'duel';
        setIsInfiniteTime(false);
      } else {
        setBoardState(null);
        setIsDuel(false);
      }
    }
    setMode(selectedMode);
    setScore(0);
    setFoundWords([]);
    setGameState('game');
  };

  const endGame = (finalScore, words, board) => {
    setScore(finalScore);
    setFoundWords(words);
    setBoardState(board);
    setGameState('results');
    
    // Если allWords пустой (то есть это не рестарт старого поля), запускаем анализ
    if (allWords.length === 0) {
      setIsAnalyzing(true);
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'FIND_WORDS', board });
      }
    }
  };

  const goMenu = () => {
    setGameState('menu');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container" data-theme={theme}>
      {gameState === 'menu' && <Menu onStart={startGame} theme={theme} onToggleTheme={toggleTheme} />}
      {gameState === 'game' && <Game mode={mode} difficulty={difficulty} initialBoard={boardState} isInfiniteTime={isInfiniteTime} isDuel={isDuel} onEnd={endGame} />}
      {gameState === 'results' && 
        <Results 
          score={score} 
          foundWords={foundWords} 
          allWords={allWords} 
          isAnalyzing={isAnalyzing}
          previousResult={previousResult}
          isDuel={isDuel}
          boardState={boardState}
          onRetry={() => startGame(mode, true)}
          onMenu={goMenu}
        />
      }
    </div>
  );
}

export default App;
