import json
import pymorphy3
import sys

def main():
    print("Loading pymorphy3...")
    morph = pymorphy3.MorphAnalyzer()

    print("Loading dictionary...")
    with open('src/assets/dictionary.json', 'r', encoding='utf-8') as f:
        words = json.load(f)

    valid_words = set()

    ALLOWED_POS = {'NOUN', 'INFN', 'ADJF', 'ADJS', 'PRTF', 'PRTS', 'ADVB', 'NUMR'}

    print("Filtering...")
    for word in words:
        word = word.strip().lower()
        
        # Длина от 2 до 15 знаков (игра дает 3 очка за 2 буквы)
        if len(word) < 2 or len(word) > 15:
            continue
        if '-' in word or ' ' in word:
            continue

        keep = False
        for parsed in morph.parse(word):
            # Проверяем на начальную форму (именительный падеж, ед.ч. и т.д.)
            is_normal = (parsed.normal_form == word)
            is_pltm = ('NOUN' in parsed.tag and 'Pltm' in parsed.tag)
            
            if not is_normal and not is_pltm:
                continue
            
            if parsed.tag.POS not in ALLOWED_POS:
                continue
                
            # Исключаем имена собственные, города, аббревиатуры
            if 'Abbr' in parsed.tag or 'Name' in parsed.tag or 'Surn' in parsed.tag or 'Patr' in parsed.tag or 'Geox' in parsed.tag:
                continue
                
            # Жаргонные, просторечные, устаревшие
            if 'Slng' in parsed.tag or 'Arch' in parsed.tag or 'Infr' in parsed.tag:
                continue

            keep = True
            break

        if keep:
            valid_words.add(word)

    final_list = sorted(list(valid_words))

    print("Saving...")
    with open('src/assets/dictionary.json', 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False)

    print(f"Filtered dictionary from {len(words)} down to {len(final_list)} words.")

if __name__ == '__main__':
    main()
