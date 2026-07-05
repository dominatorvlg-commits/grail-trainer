import { useState, useEffect, useRef } from 'react';
import './index.css';
import Menu from './components/Menu';
import Game from './components/Game';
import Results from './components/Results';

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
    return () => workerRef.current.terminate();
  }, []);

  const startGame = (selectedMode, isRetry = false, infinite = false, diff = 'medium') => {
    if (isRetry) {
      setPreviousResult({ score, foundWords });
      // При повторе мы не сбрасываем allWords и boardState!
    } else {
      setPreviousResult(null);
      setBoardState(null);
      setAllWords([]);
      setIsInfiniteTime(infinite); // Обновляем только при новой игре
      setDifficulty(diff);
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
      {gameState === 'game' && <Game mode={mode} difficulty={difficulty} initialBoard={boardState} isInfiniteTime={isInfiniteTime} onEnd={endGame} />}
      {gameState === 'results' && 
        <Results 
          score={score} 
          foundWords={foundWords} 
          allWords={allWords} 
          isAnalyzing={isAnalyzing}
          previousResult={previousResult}
          onRetry={() => startGame(mode, true)}
          onMenu={goMenu}
        />
      }
    </div>
  );
}

export default App;
