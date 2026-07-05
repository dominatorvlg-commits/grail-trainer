import fs from 'fs';
import https from 'https';
import path from 'path';
import iconv from 'iconv-lite';

const url = 'https://raw.githubusercontent.com/danakt/russian-words/master/russian.txt';
const dest = path.resolve('./src/assets/dictionary.json');

console.log('Downloading dictionary...');

https.get(url, (res) => {
    let chunks = [];
    res.on('data', (chunk) => {
        chunks.push(chunk);
    });
    res.on('end', () => {
        console.log('Downloaded. Parsing...');
        const buffer = Buffer.concat(chunks);
        const data = iconv.decode(buffer, 'win1251');
        const words = data.split('\n')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length >= 2 && /^[а-яё]+$/.test(w));
        
        console.log(`Parsed ${words.length} words. Saving to JSON...`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, JSON.stringify(words));
        console.log('Done!');
    });
}).on('error', (err) => {
    console.error('Error downloading:', err.message);
});
