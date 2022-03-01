import { Logger } from "./log.mjs";
import { sum } from "./util.mjs";

const log = new Logger('freq');

const EMPTY_LETTER_ENTRY = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];

const cloneLetterEntry = (letterEntry) => {
    return [
        [...letterEntry[0]],
        [...letterEntry[1]],
        [...letterEntry[2]],
        [...letterEntry[3]],
        [...letterEntry[4]],
    ]
}

/**
 * Frequency analyzer class.
 *
 * Immutable after construction.
 *
 * https://en.wikipedia.org/wiki/Frequency_analysis
 */
export class FrequencyAnalysis {
    /**
     *
     * @param {Array[string]} words Words to enter in to the frequency table
     * @param {Object} initialFreq Initial frequency analysis to start with (not commonly used, used destructively)
     */
    constructor(words, initialFreq = undefined) {
        if (initialFreq) {
            if (words.length > 0) {
                throw new Error('In FrequencyAnalysis constructor, passing in an initial frequency table as well as new words may modify the passed in frequency table, so is disallowed.')
            }
            this.freq = initialFreq;
        } else {
            this.freq = { };
        }
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
                    this.freq[letter] = cloneLetterEntry(EMPTY_LETTER_ENTRY);

                }
                for(let charOccurrence=0; charOccurrence<charCount; charOccurrence++) {
                    for(const letterPos in letterEntry) {
                        this.freq[letter][charOccurrence][letterPos]++;
                    }
                }
            }
        }
        log.debug(`Created new frequency table from ${initialFreq?'initial table':'scratch'} with ${words.length} new words`);
    }

    /**
     * Make a deep copy of this analysis, optionally filtering with the given callback.
     *
     * @param {function} filt Optional callback to filter entries out of the cloned copy
     * @returns Cloned copy of this list, with filter applied if given
     */
    clone(filt = () => true) {
        log.debug(`Cloning frequency table with filter`);
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .filter(filt)));
    }

    /**
     * Make a deep copy of this analysis, optionally mapping entries with the given callback.
     *
     * @param {function} mapper Optional callback to transform entries in the cloned copy
     * @returns Cloned copy of this list, with map applied if given
     */
     cloneMap(mapper = () => true) {
        log.debug(`Cloning frequency table with map`);
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .map(mapper)
            .filter(([k, v]) => v !== undefined)));
    }

    /**
     * See if the given letter occurs in the frequency table at all, optionally more than the given number of times
     *
     * @param {char} letter Letter to look up in the frequency table
     * @param {number} prevCount Use frequency of letter occuring more than this many times
     * @returns Whether the given letter occurs in the frequency table, optionally more than the given numer of times
     */
    hasLetter(letter, prevCount = 0) {
        return this.letterFrequency(letter, prevCount) > 0;
    }

    /**
     * See if the given letter occurs in the frequency table at the given position, optionally as the nth occurrence of the letter
     *
     * @param {char} letter Letter to look up in the frequency table
     * @param {number} prevCount Use frequency of letter occuring this many times elsewhere in the word
     * @returns Whether the given letter occurs in the frequency table at this position, optionally more than the given numer of times in the overall word
     */
     letterFrequencyAtPosition(letter, position, prevCount = 0) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter][prevCount][position];
    }

    /**
     * See if the given letter occurs in the frequency table at all, optionally more than the given number of times
     *
     * @param {*} letter Letter to look up in the frequency table
     * @param {*} prevCount Use frequency of letter occuring this many times elsewhere in the word
     * @returns Frequency of this letter
     */
     letterFrequency(letter, prevCount = 0) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter][prevCount].reduce((sum, cur) => sum + cur);
    }

    /**
     * Look up a raw entry in the frequency table.  Not commonly used.
     *
     * @param {char} letter Get the entry for this letter.
     * @returns Frequency table entry
     */
    getEntry(letter) {
        return this.freq[letter];
    }

    /**
     * @returns Array of all letters that appear in the frequency table
     */
    getAllLetters() {
        return Object.keys(this.freq);
    }

    /**
     * Look up a raw entry in the frequency table, return a copy modified to "zero out" entries
     * for occurrences less than prevCount.  Useful with cloneMap method for certain strategies.
     *
     * @param {char} letter Letter to look up
     * @param {number} prevCount Number of already known occurrences of this letter
     * @returns Modified entry
     */
    getEntryAdjustedLetterCount(letter, prevCount) {
        const entry = cloneLetterEntry(this.freq[letter]);
        for(let i=0; i<prevCount; i++) {
            entry[i] = [0,0,0,0,0];
        }
        if (prevCount > 0) {
            log.trace(`Adjusted letter count for letter '${letter}' count ${prevCount} from:`, this.freq[letter], 'to:', entry);
        }
        return entry;
    }

    /**
     * @returns String representation of this object useful for logging and debugging
     */
    debugString() {
        return Object.entries(this.freq)
            .filter(([letter, entry]) => {
                return entry.length > 0;
            }).map(([letter, entry]) => {
                return `${letter}: ${JSON.stringify(entry)}`;
            }).join("\n");
    }
}
