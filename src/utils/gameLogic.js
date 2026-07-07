import { COMBINATIONS } from '../data/combinations.js';
import dictionary from '../assets/dictionary.json';
import commonWords from '../assets/common_words.json';

const DICTIONARY_SET = new Set();
const TRIE = {};

// Инициализация словаря и Trie
dictionary.forEach(w => {
  const word = w.toUpperCase();
  DICTIONARY_SET.add(word);
  let node = TRIE;
  for (let char of word) {
    if (!node[char]) node[char] = {};
    node = node[char];
  }
  node.isWord = true;
});

const COMMON_WORDS_SET = new Set(commonWords);

export const BOARD_SIZE = 5;
export const LAYERS_COUNT = 5;

const hasAccidentalLongWords = (board) => {
  const boardHasChar = Array(BOARD_SIZE).fill(0).map(() => 
    Array(BOARD_SIZE).fill(0).map(() => ({}))
  );

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cellLayers = board[r][c].layers;
      for (let l = 0; l < cellLayers.length; l++) {
        const letter = cellLayers[l];
        if (letter) boardHasChar[r][c][letter] = true;
      }
    }
  }

  const dfs = (r, c, node, visited, depth) => {
    if (node.isWord && depth >= 14) return true;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (!visited[nr][nc]) {
            for (let nextChar in node) {
              if (nextChar !== 'isWord' && boardHasChar[nr][nc][nextChar]) {
                visited[nr][nc] = true;
                if (dfs(nr, nc, node[nextChar], visited, depth + 1)) return true;
                visited[nr][nc] = false;
              }
            }
          }
        }
      }
    }
    return false;
  };

  const visited = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(false));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let firstChar in TRIE) {
        if (firstChar !== 'isWord' && boardHasChar[r][c][firstChar]) {
          visited[r][c] = true;
          if (dfs(r, c, TRIE[firstChar], visited, 1)) return true;
          visited[r][c] = false;
        }
      }
    }
  }
  return false;
};

const hasForbiddenCombinations = (board, forbiddenEndings) => {
  if (!forbiddenEndings || forbiddenEndings.length === 0) return false;

  const boardHasChar = Array(BOARD_SIZE).fill(0).map(() => 
    Array(BOARD_SIZE).fill(0).map(() => ({}))
  );

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cellLayers = board[r][c].layers;
      for (let l = 0; l < cellLayers.length; l++) {
        const letter = cellLayers[l];
        if (letter) boardHasChar[r][c][letter] = true;
      }
    }
  }

  const dfs = (r, c, node, visited, currentWord) => {
    if (node.isWord) {
      if (forbiddenEndings.some(ending => currentWord.endsWith(ending))) {
        return true;
      }
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (!visited[nr][nc]) {
            for (let nextChar in node) {
              if (nextChar !== 'isWord' && boardHasChar[nr][nc][nextChar]) {
                visited[nr][nc] = true;
                if (dfs(nr, nc, node[nextChar], visited, currentWord + nextChar)) return true;
                visited[nr][nc] = false;
              }
            }
          }
        }
      }
    }
    return false;
  };

  const visited = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(false));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let firstChar in TRIE) {
        if (firstChar !== 'isWord' && boardHasChar[r][c][firstChar]) {
          visited[r][c] = true;
          if (dfs(r, c, TRIE[firstChar], visited, firstChar)) return true;
          visited[r][c] = false;
        }
      }
    }
  }
  return false;
};

const LETTER_WEIGHTS = {
  А: 1, Б: 3, В: 1, Г: 3, Д: 2, Е: 1, Ё: 3, Ж: 5, З: 5, И: 1,
  Й: 4, К: 2, Л: 2, М: 2, Н: 1, О: 1, П: 2, Р: 1, С: 1, Т: 1,
  У: 2, Ф: 10, Х: 5, Ц: 5, Ч: 5, Ш: 8, Щ: 10, Ъ: 10, Ы: 4, Ь: 3, Э: 8, Ю: 8, Я: 3
};

const getRandomLetter = (alphabet = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ") => {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

export const generateBoard = (mode, difficulty = 'medium') => {
  const board = Array(BOARD_SIZE).fill(null).map(() => 
    Array(BOARD_SIZE).fill(null).map(() => ({
      layers: Array(LAYERS_COUNT).fill(null), // Сначала пустые слои
      currentLayer: 0,
      multiplier: 'w1'
    }))
  );

  const placeMultipliers = (count, multi) => {
    let placed = 0;
    while(placed < count) {
      let r = Math.floor(Math.random() * BOARD_SIZE);
      let c = Math.floor(Math.random() * BOARD_SIZE);
      if (board[r][c].multiplier === 'w1') {
        board[r][c].multiplier = multi;
        placed++;
      }
    }
  };
  placeMultipliers(1, 'w3');
  placeMultipliers(1, 'w2');
  placeMultipliers(1, 'wx3');
  placeMultipliers(1, 'wx2');

  let targetWords = [];
  
  // Настройки сложности по умолчанию (Средне)
  let minLength = 6;
  let maxLength = 12;
  let wordsCount = 10;
  let bonusWeight = 2; // Притяжение к бонусам

  // Если сложность случайная, выбираем одну из базовых
  let activeDifficulty = difficulty;
  if (difficulty === 'random_diff') {
    const diffs = ['super_easy', 'easy', 'medium', 'hard', 'classic', 'max'];
    activeDifficulty = diffs[Math.floor(Math.random() * diffs.length)];
  }

  if (activeDifficulty === 'super_easy') {
    minLength = 6;
    maxLength = 11;
    wordsCount = 12;
    bonusWeight = 20; // Очень сильно тянет к бонусам
  } else if (activeDifficulty === 'easy') {
    minLength = 8;
    maxLength = 13;
    wordsCount = 15;
    bonusWeight = 10;
  } else if (activeDifficulty === 'hard') {
    minLength = 4;
    maxLength = 8;
    wordsCount = 5;
    bonusWeight = 0; // Полностью игнорирует бонусы
  } else if (activeDifficulty === 'classic') {
    // Логика до введения сложностей
    minLength = 7;
    maxLength = 13;
    wordsCount = 15;
    bonusWeight = 5;
  } else if (activeDifficulty === 'max') {
    // Максимальное количество длинных слов
    minLength = 10;
    maxLength = 13;
    wordsCount = 25;
    bonusWeight = 20; // Очень сильно притягивается к бонусам
  }

  let modeEndings = [];
  let forbiddenEndings = [];
  let restrictedAlphabet = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

  if (mode !== 'random') {
    if (COMBINATIONS[mode]) {
      modeEndings = COMBINATIONS[mode].endings;
      
      // Сбор всех окончаний для исключения запрещенных связок
      const allEndings = [];
      Object.values(COMBINATIONS).forEach(cat => {
        allEndings.push(...cat.endings);
      });
      // Оставляем в forbiddenEndings только те, которых нет в modeEndings
      forbiddenEndings = allEndings.filter(e => !modeEndings.includes(e));
      
      // Исключаем буквы Ь и Й из случайного пула, если они не нужны для текущих окончаний, чтобы уменьшить случайные комбинации
      if (!modeEndings.some(e => e.includes('Ь'))) {
        restrictedAlphabet = restrictedAlphabet.replace('Ь', '');
      }
      if (!modeEndings.some(e => e.includes('Й'))) {
        restrictedAlphabet = restrictedAlphabet.replace('Й', '');
      }
    } else if (mode === 'mixed') {
      Object.values(COMBINATIONS).forEach(cat => {
        modeEndings.push(...cat.endings);
      });
      // В смешанном режиме ничего не запрещаем
    }

    if (modeEndings.length > 0) {
      const candidateWords = [];
      const wordSource = activeDifficulty === 'super_easy' ? COMMON_WORDS_SET : DICTIONARY_SET;
      
      wordSource.forEach(word => {
        if (word.length >= minLength && word.length <= maxLength && modeEndings.some(ending => word.endsWith(ending))) {
          candidateWords.push(word);
        }
      });
      
      // Если для супер-легкого режима не нашлось слов с таким окончанием, берём из основного словаря
      if (candidateWords.length === 0 && activeDifficulty === 'super_easy') {
        DICTIONARY_SET.forEach(word => {
          if (word.length >= minLength && word.length <= maxLength && modeEndings.some(ending => word.endsWith(ending))) {
            candidateWords.push(word);
          }
        });
      }
      
      candidateWords.sort(() => Math.random() - 0.5);
      targetWords = candidateWords.slice(0, wordsCount);
    }
  } else {
    // В случайном режиме просто берем слова без ограничений по окончаниям
    const candidateWords = [];
    const wordSource = activeDifficulty === 'super_easy' ? COMMON_WORDS_SET : DICTIONARY_SET;
    
    wordSource.forEach(word => {
      if (word.length >= minLength && word.length <= maxLength) {
        candidateWords.push(word);
      }
    });
    
    candidateWords.sort(() => Math.random() - 0.5);
    targetWords = candidateWords.slice(0, wordsCount);
  }

  // Функция поиска случайного пути для слова
  const embedWord = (word) => {
    const tryPath = () => {
      const path = [];
      const visited = new Set();
      let r = Math.floor(Math.random() * BOARD_SIZE);
      let c = Math.floor(Math.random() * BOARD_SIZE);
      
      for (let i = 0; i < word.length; i++) {
        path.push({r, c});
        visited.add(`${r},${c}`);
        
        if (i === word.length - 1) break;

        let neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !visited.has(`${nr},${nc}`)) {
              const cell = board[nr][nc];
              if (cell.layers.includes(null)) {
                // Вес бонуса
                const weight = cell.multiplier !== 'w1' ? Math.max(1, bonusWeight) : 1; 
                for (let w = 0; w < weight; w++) neighbors.push({nr, nc});
              }
            }
          }
        }
        
        if (neighbors.length === 0) return null; // Тупик
        
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        r = next.nr;
        c = next.nc;
      }
      return path;
    };

    for (let attempts = 0; attempts < 50; attempts++) {
      const path = tryPath();
      if (path) {
        for (let i = 0; i < word.length; i++) {
          const {r, c} = path[i];
          const cell = board[r][c];
          const emptyIndex = cell.layers.indexOf(null);
          if (emptyIndex !== -1) {
            cell.layers[emptyIndex] = word[i];
          }
        }
        break;
      }
    }
  };

  targetWords.forEach(word => embedWord(word));

  // Сохраняем "каркас" поля со встроенными словами (остальные слоты null)
  const baseLayers = Array(BOARD_SIZE).fill(null).map((_, r) => 
    Array(BOARD_SIZE).fill(null).map((_, c) => [...board[r][c].layers])
  );

  let isClean = false;
  let attempts = 0;
  const maxAttempts = mode !== 'random' && mode !== 'mixed' ? 200 : 50;

  while (!isClean && attempts < maxAttempts) {
    attempts++;
    
    // Восстанавливаем каркас перед каждой попыткой случайного заполнения
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        board[r][c].layers = [...baseLayers[r][c]];
      }
    }

    // Заполняем оставшиеся пустые слоты случайными буквами
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
          const cell = board[r][c];
          for (let l = 0; l < LAYERS_COUNT; l++) {
            if (cell.layers[l] === null) {
              cell.layers[l] = getRandomLetter(mode !== 'random' && mode !== 'mixed' ? restrictedAlphabet : undefined);
            }
          }
      }
    }

    // Проверяем, не сгенерировались ли случайно слова длиннее 13 букв
    let isValid = !hasAccidentalLongWords(board);
    
    // Проверяем, не появились ли запрещенные случайные связки
    if (isValid && mode !== 'random' && mode !== 'mixed' && forbiddenEndings.length > 0) {
      if (hasForbiddenCombinations(board, forbiddenEndings)) {
        isValid = false;
      }
    }

    if (isValid) {
      isClean = true;
    }
  }

  // В самом конце перемешиваем слои, чтобы целевые слова не всегда были на слое 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      board[r][c].layers.sort(() => Math.random() - 0.5);
    }
  }

  return board;
};

export const isValidWord = (word) => {
  return DICTIONARY_SET.has(word);
};

export const calculatePoints = (wordStr, pathNodes) => {
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

// Сериализация: 5 * 5 * 5 = 125 букв. + 25 множителей.
// Алфавит: 32 буквы.
export const serializeBoard = (board) => {
  const letters = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const multiMap = { 'w1': '0', 'wx2': '1', 'wx3': '2', 'w2': '3', 'w3': '4' };
  let str = '';
  for(let r=0; r<BOARD_SIZE; r++){
    for(let c=0; c<BOARD_SIZE; c++){
      const cell = board[r][c];
      for(let l=0; l<LAYERS_COUNT; l++){
        let idx = letters.indexOf(cell.layers[l]);
        if(idx === -1) idx = 0; // fallback для непредвиденных символов
        str += idx.toString(32);
      }
      str += multiMap[cell.multiplier] || '0';
    }
  }
  return str;
};

export const deserializeBoard = (str) => {
  if (!str || str.length !== 150) return null;
  const letters = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const reverseMulti = { '0': 'w1', '1': 'wx2', '2': 'wx3', '3': 'w2', '4': 'w3' };
  
  const board = [];
  let ptr = 0;
  for(let r=0; r<BOARD_SIZE; r++){
    let row = [];
    for(let c=0; c<BOARD_SIZE; c++){
      const layers = [];
      for(let l=0; l<LAYERS_COUNT; l++){
        const char = str[ptr++];
        const idx = parseInt(char, 32);
        layers.push(letters[idx]);
      }
      const multi = reverseMulti[str[ptr++]] || 'w1';
      row.push({ layers, currentLayer: 0, multiplier: multi });
    }
    board.push(row);
  }
  return board;
};
