const fs = require('fs');
const path = require('path');

const OLD_DICT_PATH = path.join(__dirname, '../src/assets/dictionary.json');
const LEMMAS_PATH = path.join(__dirname, '../lemmas.txt');
const CUSTOM_WORDS_PATH = path.join(__dirname, '../src/assets/custom_words.json');
const OUTPUT_PATH = path.join(__dirname, '../src/assets/dictionary.json');

// 1. Load custom words
let customWords = [];
if (fs.existsSync(CUSTOM_WORDS_PATH)) {
  customWords = JSON.parse(fs.readFileSync(CUSTOM_WORDS_PATH, 'utf8'));
} else {
  // create it if doesn't exist
  customWords = ['САТИНИРОВАНИЕ'];
  fs.writeFileSync(CUSTOM_WORDS_PATH, JSON.stringify(customWords, null, 2), 'utf8');
}

// 2. Load old dictionary
let oldDict = [];
if (fs.existsSync(OLD_DICT_PATH)) {
  oldDict = JSON.parse(fs.readFileSync(OLD_DICT_PATH, 'utf8'));
}

// 3. Load lemmas
const lemmasSet = new Set();
if (fs.existsSync(LEMMAS_PATH)) {
  const lines = fs.readFileSync(LEMMAS_PATH, 'utf8').split('\n');
  lines.forEach(l => {
    const parts = l.split('\t');
    if (parts.length > 1) {
      const lemma = parts[0].trim().toUpperCase();
      if (/^[А-ЯЁ]{2,15}$/.test(lemma)) {
        lemmasSet.add(lemma);
      }
    }
  });
}

// 4. Combine and deduplicate
const combinedSet = new Set();

// Add old words (assuming they are lowercase in json, let's normalize to uppercase)
oldDict.forEach(w => {
  const word = w.trim().toUpperCase();
  if (/^[А-ЯЁ]{2,15}$/.test(word)) {
    combinedSet.add(word);
  }
});

// Add lemmas
lemmasSet.forEach(w => combinedSet.add(w));

// Add custom words
customWords.forEach(w => {
  const word = w.trim().toUpperCase();
  if (/^[А-ЯЁ]{2,15}$/.test(word)) {
    combinedSet.add(word);
  }
});

// Convert to array and sort
const finalDict = Array.from(combinedSet).sort();

// Save to lowercase (to match existing format)
const finalDictLowercase = finalDict.map(w => w.toLowerCase());

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalDictLowercase), 'utf8');

console.log(`Dictionary built successfully! Total words: ${finalDictLowercase.length}`);
