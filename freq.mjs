import { Logger } from "./log.mjs";
import { sum } from "./util.mjs";

const log = new Logger('freq');

export class FrequencyAnalysis {
    constructor(words, initialFreq = { }) {
        this.freq = initialFreq;
        for(let wordNum=0;wordNum<words.length;wordNum++) {
            const word = words[wordNum];
            const letters = word.split('').reduce((result, letter, index) => {
                const letterEntry = result[letter] || [];
                letterEntry[index] = 1;
                result[letter] = letterEntry;
                return result;
            }, { });
            log.trace(`Word ${word} letters:`, letters);
            for (const letter in letters) {
                const letterEntry = letters[letter];
                const charCount = sum(letterEntry);
                if (!this.freq[letter]) {
                    this.freq[letter] = [
                        [0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0],
                    ]
                }
                for(let charOccurrence=0; charOccurrence<charCount; charOccurrence++) {
                    for(const letterPos in letterEntry) {
                        this.freq[letter][charOccurrence][letterPos]++;
                    }
                }
            }
        }
    }

    clone(filt = () => true) {
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .filter(filt)));
    }

    cloneMap(f = () => true) {
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .map(f)
            .filter(([k, v]) => v !== undefined)));
    }

    hasLetter(letter, prevCount = 0) {
        return this.letterFrequency(letter, prevCount) > 0;
    }

    letterFrequencyAtPosition(letter, position, prevCount = 0) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter][prevCount][position];
    }

    letterFrequency(letter, prevCount = 0) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter][prevCount].reduce((sum, cur) => sum + cur);
    }

    getEntry(letter) {
        return this.freq[letter];
    }

    getAllLetters() {
        return Object.keys(this.freq);
    }

    getEntryAdjustedLetterCount(letter, count) {
        const entry = JSON.parse(JSON.stringify(this.freq[letter]));
        for(let i=0; i<count; i++) {
            entry[i] = [0,0,0,0,0];
        }
        if (count > 0) {
            log.trace(`Adjusted letter count for letter '${letter}' count ${count} from:`, this.freq[letter], 'to:', entry);
        }
        return entry;
    }

    debugString() {
        return Object.entries(this.freq)
            .filter(([letter, entry]) => {
                return entry.length > 0;
            }).map(([letter, entry]) => {
                return `${letter}: ${JSON.stringify(entry)}`;
            }).join("\n");
    }
}