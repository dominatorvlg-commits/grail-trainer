import dictionary from '../assets/dictionary.json';

const BOARD_SIZE = 5;

// Сортируем словарь от длинных слов к коротким, чтобы находить самые жирные пропущенные
const sortedDict = dictionary
  .map(w => w.toUpperCase())
  .filter(w => w.length >= 4 && w.length <= 15 && !w.includes('-') && !w.includes(' '))
  .sort((a, b) => b.length - a.length);

const calculatePoints = (wordStr, pathNodes) => {
  let points = 0;
  let wordMultiplier = 1;
  pathNodes.forEach((node, index) => {
    let letterPts = index + 1; 
    if (node.multiplier === 'wx2') letterPts *= 2;
    if (node.multiplier === 'wx3') letterPts *= 3;
    points += letterPts;
    if (node.multiplier === 'w2') wordMultiplier *= 2;
    if (node.multiplier === 'w3') wordMultiplier *= 3;
  });
  return points * wordMultiplier;
};

function findAllWordsWorker(board) {
  const boardLetterCounts = {};
  const boardHasChar = Array(BOARD_SIZE).fill(0).map(() => 
    Array(BOARD_SIZE).fill(0).map(() => ({}))
  );

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cellLayers = board[r][c].layers;
      for (let l = 0; l < cellLayers.length; l++) {
        const letter = cellLayers[l];
        if (letter) {
          boardHasChar[r][c][letter] = true;
        }
      }
      
      const uniqueInCell = Object.keys(boardHasChar[r][c]);
      for (let i = 0; i < uniqueInCell.length; i++) {
        const letter = uniqueInCell[i];
        boardLetterCounts[letter] = (boardLetterCounts[letter] || 0) + 1;
      }
    }
  }

  const isTheoreticallyPossible = (word) => {
    const counts = {};
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      counts[char] = (counts[char] || 0) + 1;
      if (!boardLetterCounts[char] || counts[char] > boardLetterCounts[char]) {
        return false;
      }
    }
    return true;
  };

  const findPathForWord = (word) => {
    let maxPoints = -1;
    let bestPath = null;
    const visited = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(false));
    let dfsSteps = 0;
    const MAX_STEPS = 2000;

    const dfs = (r, c, depth, pathNodes) => {
      if (dfsSteps++ > MAX_STEPS) return false;

      if (depth === word.length) {
        maxPoints = calculatePoints(word, pathNodes);
        bestPath = [...pathNodes];
        return true; // Нашли слово - прекращаем поиск, нам не нужен абсолютный максимум очков для пропущенных
      }

      const nextChar = word[depth];
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (!visited[nr][nc] && boardHasChar[nr][nc][nextChar]) {
              visited[nr][nc] = true;
              pathNodes.push({ r: nr, c: nc, letter: nextChar, multiplier: board[nr][nc].multiplier });
              
              if (dfs(nr, nc, depth + 1, pathNodes)) return true;
              
              pathNodes.pop();
              visited[nr][nc] = false;
            }
          }
        }
      }
      return false;
    };

    const firstChar = word[0];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardHasChar[r][c][firstChar]) {
          visited[r][c] = true;
          if (dfs(r, c, 1, [{ r, c, letter: firstChar, multiplier: board[r][c].multiplier }])) {
            return { points: maxPoints, path: bestPath };
          }
          visited[r][c] = false;
        }
      }
    }

    return null;
  };

  const validWords = [];
  
  const startTime = Date.now();
  const TIME_LIMIT = 2500; // 2.5 секунды максимум

  for (let i = 0; i < sortedDict.length; i++) {
    if (Date.now() - startTime > TIME_LIMIT) break;

    const word = sortedDict[i];
    if (isTheoreticallyPossible(word)) {
      const res = findPathForWord(word);
      if (res && res.points > 0) {
        validWords.push({ word, points: res.points, length: word.length, path: res.path });
      }
    }
  }

  return validWords.sort((a, b) => b.length - a.length || b.points - a.points);
}

self.onmessage = function(e) {
  try {
    if (e.data.type === 'FIND_WORDS') {
      const { board } = e.data;
      const allWords = findAllWordsWorker(board);
      self.postMessage({ type: 'RESULT', words: allWords });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', message: error.toString(), stack: error.stack });
  }
};
