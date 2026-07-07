import { useState, useEffect, useRef } from 'react';
import './index.css';
import Menu from './components/Menu';
import Game from './components/Game';
import Results from './components/Results';
import Analysis from './components/Analysis';
import { deserializeBoard, serializeBoard } from './utils/gameLogic';
import WordFinderWorker from './workers/wordFinder.js?worker';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'game', 'results'
  const [mode, setMode] = useState(null);
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previousResult, setPreviousResult] = useState(null);
  const [boardState, setBoardState] = useState(null); // Сохраняем поле
  const [analysisWords, setAnalysisWords] = useState([]);
  const [isInfiniteTime, setIsInfiniteTime] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('dark');
  const [isDuel, setIsDuel] = useState(false);

  const workerRef = useRef(null);

  useEffect(() => {
    // Используем импорт с ?worker для совместимости со старыми телефонами (iOS < 15)
    workerRef.current = new WordFinderWorker();
    
    workerRef.current.onerror = (err) => {
      console.error('Worker failed to load or threw fatal error:', err);
      alert('Критическая ошибка Worker: ' + (err.message || 'Неизвестная ошибка'));
      setIsAnalyzing(false);
    };

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'RESULT') {
        setAllWords(e.data.words);
        setAnalysisWords(e.data.words);
        setIsAnalyzing(false);
      } else if (e.data.type === 'ERROR') {
        console.error('Worker error:', e.data);
        alert('Ошибка при поиске слов: ' + e.data.message);
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

  // Отслеживание смены экранов для Яндекс Метрики
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ym !== 'undefined') {
      let pagePath = '/';
      if (gameState === 'game') pagePath = '/game';
      if (gameState === 'results') pagePath = '/results';
      if (gameState === 'analysis') pagePath = '/analysis';
      
      window.ym(110444263, 'hit', pagePath, {
        title: `Грааль Тренажер - ${gameState}`
      });
    }
  }, [gameState]);

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
  };

  const handleBoardReady = (board) => {
    // Если allWords пустой, запускаем поиск в фоне
    if (allWords.length === 0) {
      setIsAnalyzing(true); // Флаг, что мы еще ищем
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'FIND_WORDS', board });
      }
    }
  };

  const goMenu = () => {
    setGameState('menu');
  };

  const handleAnalysis = (wordsToAnalyze) => {
    setAnalysisWords(wordsToAnalyze);
    setGameState('analysis');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container" data-theme={theme}>
      {gameState === 'menu' && <Menu onStart={startGame} theme={theme} onToggleTheme={toggleTheme} />}
      {gameState === 'game' && <Game mode={mode} difficulty={difficulty} initialBoard={boardState} isInfiniteTime={isInfiniteTime} isDuel={isDuel} onEnd={endGame} onBoardReady={handleBoardReady} />}
      {gameState === 'results' && 
        <Results 
          score={score} 
          foundWords={foundWords} 
          allWords={allWords} 
          isAnalyzing={isAnalyzing}
          previousResult={previousResult}
          isDuel={isDuel}
          boardState={boardState}
          difficulty={difficulty}
          mode={mode}
          onRetry={() => startGame(mode, true)}
          onMenu={goMenu}
          onAnalysis={handleAnalysis}
        />
      }
      {gameState === 'analysis' && (
        <Analysis 
          initialBoard={boardState} 
          initialWords={analysisWords} 
          workerRef={workerRef}
          onExit={() => setGameState('results')} 
        />
      )}
    </div>
  );
}

export default App;
