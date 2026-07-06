import { COMBINATIONS } from '../data/combinations.js';
import dictionary from '../assets/dictionary.json';

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

export const BOARD_SIZE = 5;
export const LAYERS_COUNT = 5;

const LETTER_WEIGHTS = {
  А: 1, Б: 3, В: 1, Г: 3, Д: 2, Е: 1, Ё: 3, Ж: 5, З: 5, И: 1,
  Й: 4, К: 2, Л: 2, М: 2, Н: 1, О: 1, П: 2, Р: 1, С: 1, Т: 1,
  У: 2, Ф: 10, Х: 5, Ц: 5, Ч: 5, Ш: 8, Щ: 10, Ъ: 10, Ы: 4, Ь: 3, Э: 8, Ю: 8, Я: 3
};

const getRandomLetter = () => {
  const letters = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  return letters[Math.floor(Math.random() * letters.length)];
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

  // Если сложность случайная, выбираем одну из 5 базовых
  let activeDifficulty = difficulty;
  if (difficulty === 'random_diff') {
    const diffs = ['easy', 'medium', 'hard', 'classic', 'max'];
    activeDifficulty = diffs[Math.floor(Math.random() * diffs.length)];
  }

  if (activeDifficulty === 'easy') {
    minLength = 8;
    maxLength = 15;
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
    maxLength = 15;
    wordsCount = 15;
    bonusWeight = 5;
  } else if (activeDifficulty === 'max') {
    // Максимальное количество длинных слов
    minLength = 10;
    maxLength = 15;
    wordsCount = 25;
    bonusWeight = 20; // Очень сильно притягивается к бонусам
  }

  if (mode !== 'random') {
    let modeEndings = [];
    if (COMBINATIONS[mode]) {
      modeEndings = COMBINATIONS[mode].endings;
    } else if (mode === 'mixed') {
      Object.values(COMBINATIONS).forEach(cat => {
        modeEndings.push(...cat.endings);
      });
    }

    if (modeEndings.length > 0) {
      const candidateWords = [];
      DICTIONARY_SET.forEach(word => {
        if (word.length >= minLength && word.length <= maxLength && modeEndings.some(ending => word.endsWith(ending))) {
          candidateWords.push(word);
        }
      });
      candidateWords.sort(() => Math.random() - 0.5);
      targetWords = candidateWords.slice(0, wordsCount);
    }
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

  // Заполняем оставшиеся пустые слоты случайными буквами
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      for (let l = 0; l < LAYERS_COUNT; l++) {
        if (cell.layers[l] === null) {
          cell.layers[l] = getRandomLetter();
        }
      }
      // Перемешиваем слои, чтобы целевые слова не всегда были на слое 0
      cell.layers.sort(() => Math.random() - 0.5);
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
