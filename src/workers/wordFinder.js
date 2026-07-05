import dictionary from '../assets/dictionary.json';

const BOARD_SIZE = 5;

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
  // Предварительно считаем, сколько раз каждая буква вообще может встретиться на поле
  const boardLetterCounts = {};
  
  // Быстрый доступ к буквам на поле boardHasChar[r][c][char]
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

  const findMaxPointsForWord = (word) => {
    let maxPoints = -1;
    const visited = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(false));

    const dfs = (r, c, depth, pathNodes) => {
      if (depth === word.length) {
        const pts = calculatePoints(word, pathNodes);
        if (pts > maxPoints) maxPoints = pts;
        return;
      }

      const nextChar = word[depth];
      
      // Возможные соседи
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (!visited[nr][nc] && boardHasChar[nr][nc][nextChar]) {
              visited[nr][nc] = true;
              pathNodes.push({ letter: nextChar, multiplier: board[nr][nc].multiplier });
              
              dfs(nr, nc, depth + 1, pathNodes);
              
              pathNodes.pop();
              visited[nr][nc] = false;
            }
          }
        }
      }
    };

    const firstChar = word[0];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardHasChar[r][c][firstChar]) {
          visited[r][c] = true;
          dfs(r, c, 1, [{ letter: firstChar, multiplier: board[r][c].multiplier }]);
          visited[r][c] = false;
        }
      }
    }

    return maxPoints;
  };

  const validWords = [];

  for (let i = 0; i < dictionary.length; i++) {
    const word = dictionary[i].toUpperCase();
    
    // Согласно правилам, длина слова от 2 до 15 букв
    if (word.length < 2 || word.length > 15) continue; 
    
    // Исключаем слова с дефисами или пробелами
    if (word.includes('-') || word.includes(' ')) continue;

    if (isTheoreticallyPossible(word)) {
      const pts = findMaxPointsForWord(word);
      if (pts > 0) {
        validWords.push({ word, points: pts, length: word.length });
      }
    }
  }

  return validWords
    .sort((a, b) => b.length - a.length || b.points - a.points)
    .slice(0, 50);
}

self.onmessage = function(e) {
  if (e.data.type === 'FIND_WORDS') {
    const { board } = e.data;
    const allWords = findAllWordsWorker(board);
    self.postMessage({ type: 'RESULT', words: allWords });
  }
};
