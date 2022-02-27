import { Logger } from "./log.mjs";
import { charOccurrences } from "./util.mjs";

const ALL_LETTERS = (() => {
    let letters = [];
    for (let i=0; i<26; i++) {
        const letter = String.fromCharCode(0x61 + i);
        letters.push(letter);
    }
    return letters;
})();

const makeDefaultLetter = () => { return { pos: [-1, -1, -1, -1, -1], min: undefined, max: undefined } };

const USE_WHICH_WORDHASLETTERS = 'new';

let stats = {
    wordHasLettersFalseMinLetters: 0,
    wordHasLettersFalsePos: 0,
    wordHasLettersFalsePosNot: 0,
    wordHasLettersFalseMaxLetters: 0,
    wordHasLettersCount: 0,
    updates: 0,
    newObjects: 0,
    updateFromRemaining: 0,
}
const MAX_LETTERS = 5;
export class LetterTracker {
    constructor(letters = { }) {
        Logger.log('lettertrack','trace',`Creating new letter tracker, initial info on ${Object.keys(letters).length} letters:`, letters);

        this.letters = letters;
        this.posNotLetter = [ { }, { }, { }, { }, { }];
        this.posLetter = [ ];
        this.minLettersCount = { };
        this.updateCaches();
        stats.newObjects++;
    }

    updateCaches() {
        Object.entries(this.letters).forEach(([letter, letterInfo]) => {
            for(let i=0; i<letterInfo.pos.length; i++) {
                switch(letterInfo.pos[i]) {
                    case 1:
                        this.posLetter[i] = letter;
                        break;
                    case 0:
                        this.posNotLetter[i][letter] = true;
                        break;
                }
                if (letterInfo.min) {
                    this.minLettersCount[letter] = letterInfo.min;
                }
            }
        });
        Logger.log('lettertrack','trace','Updated cache, new posLetter:', this.posLetter);
        Logger.log('lettertrack','trace','Updated cache, new posNotLetter:', this.posNotLetter);
        Logger.log('lettertrack','trace','Updated cache, new minLettersCount:', this.minLettersCount);
    }

    clone() {
        const lettersCopy = Object.fromEntries(
            Object.entries(this.letters).map(([k, v], i) => [k, {
                pos: [...v.pos],
                min: v.min,
                max: v.max,
            }])
        );
        return new LetterTracker(lettersCopy);
    }

    update(guess, result) {
        stats.updates++;
        const countOccurrences = (letter) => {
            let count = 0;
            for(let i=0; i<guess.length; i++) {
                if (guess[i] === letter) {
                    switch(result[i]) {
                        case 'G':
                        case 'Y':
                            count++;
                            break;
                    }
                }
            }
            return count;
        };
    
        for(let i=0;i<result.length;i++) {
            const guessLetter = guess[i];
            let letterInfo = this.letters[guessLetter] || makeDefaultLetter();
            const letterOccurrences = countOccurrences(guessLetter);
            
            if (result[i] === 'G') {
                letterInfo.pos[i] = 1;
                this.posLetter[i] = guessLetter;
                Logger.log('lettertrack','trace',`Position ${i} new posLetters:`, this.posLetter);
                this.updateMin(letterInfo, letterOccurrences);
            } else if (result[i] === 'Y') {
                letterInfo.pos[i] = 0;
                this.posNotLetter[i][guessLetter] = true;
                this.updateMin(letterInfo, letterOccurrences);
                if (letterInfo.min > 0) {
                    this.minLettersCount[guessLetter] = letterInfo.min;
                    Logger.log('lettertrack','trace',`Updated minLettersCount:`, this.minLettersCount);
                }
            } else if (result[i] === '-') {
                letterInfo.pos[i] = 0;
                this.posNotLetter[i][guessLetter] = true;
                letterInfo.min = Math.max(letterInfo.min || 0, letterOccurrences);
                if (letterInfo.min > 0) {
                    this.minLettersCount[guessLetter] = letterInfo.min;
                    Logger.log('lettertrack','trace',`Updated minLettersCount:`, this.minLettersCount);
                }
                if (letterInfo.max === undefined || letterInfo.max > letterOccurrences) {
                    letterInfo.max = letterOccurrences;
                    Logger.log('lettertrack','trace',`Letter '${guessLetter}' new max = ${letterInfo.max}`);
                }
            }
    
            this.letters[guessLetter] = letterInfo;
        }

        Logger.log('lettertrack', 'trace', `After update: ` + this.debugString());
    }

    updateMin(letterInfo, letterOccurrences) {
        letterInfo.min = Math.max(letterInfo.min || 1, letterOccurrences);
    }

    updateMinForLetter(letter, letterOccurences) {
        let letterInfo = this.letters[letter] || makeDefaultLetter();
        this.updateMin(letterInfo, letterOccurences);
        this.letters[letter] = letterInfo;
    }

    updateFromRemaining(words) {
        stats.updateFromRemaining++;
        ALL_LETTERS.forEach((letter) => {
            const letterInfo = this.letters[letter] || makeDefaultLetter();
            Logger.log('lettertrack', 'trace', `Updated letter ${letter} from:`, letterInfo);

            // Positions
            [0, 1, 2, 3, 4].forEach((pos) => {
                const letterAtPos = (word) => word[pos] === letter;
                const definitely = words.every(letterAtPos);
                const definitelyNot = !words.some(letterAtPos);
                Logger.log('lettertrack', 'trace', `letter ${letter} position ${pos} definitely=${definitely} definitelyNot=${definitelyNot}`);
                if (definitely) {
                    letterInfo.pos[pos] = 1;
                    this.posLetter[i] = word[pos];
                } else if (definitelyNot) {
                    letterInfo.pos[pos] = 0;
                    this.posNotLetter[i][word[pos]] = true;
                }
            });

            // Overall max/min
            letterInfo.min = Math.max(letterInfo.min || 0, Math.min(...(words.map((word) => charOccurrences(word, letter)))));
            if (letterInfo.min > 0) {
                this.minLettersCount[letter] = letterInfo.min;
            }
            letterInfo.max = Math.min(letterInfo.max === undefined ? 5 : letterInfo.max, Math.max(...(words.map((word) => charOccurrences(word, letter)))));

            Logger.log('lettertrack','trace', `Updated letter ${letter}   to:`, letterInfo);
            this.letters[letter] = letterInfo;
        });
        Logger.log('lettertrack', 'trace', `After updateFromRemaining: ` + this.debugString());
    }

    wordHasLetters(word) {
        switch(USE_WHICH_WORDHASLETTERS) {
            case 'new':
                return this.wordHasLettersNew(word);
            case 'old':
                return this.wordHasLettersOld(word);
            case 'both':
                const oldVal = this.wordHasLettersOld(word);
                const newVal = this.wordHasLettersNew(word);
                if (newVal === oldVal) {
                    return newVal;
                }
                throw new Error(`wordHasLetters('${word}') returned ${oldVal} with old implementation, but ${newVal} with new`);
            default:
                throw new Error(`Unknown option '${USE_WHICH_WORDHASLETTERS}' for USE_WHICH_WORDHASLETTERS`);
        }
    }

    /**
     * Check the given word against the information in the letter tracker, to see if it is a possible solution or not.
     *
     * @param {string} word Word to check
     * @returns True if the word is a possible solution, false if it is not.
     */
    wordHasLettersOld(word) {
        Logger.log('lettertrack', 'trace', `wordHasLettersOld`);
        for (const letter of ALL_LETTERS) {
            const letterInfo = this.letters[letter];
            if (letterInfo) {
                Logger.log('lettertrack', 'trace', `Found info on letter '${letter}': `, letterInfo);
                const letterCount = charOccurrences(word, letter, word.length);
                if (letterInfo.min !== undefined && letterCount < letterInfo.min) {
                    Logger.log('lettertrack', 'trace', `word '${word}' does not match for letter ${letter} because it letterCount ${letterCount} < min ${letterInfo.min}`);
                    return false;
                }
                if (letterInfo.max !== undefined && letterCount > letterInfo.max) {
                    Logger.log('lettertrack', 'trace', `word '${word}' does not match for letter ${letter} because it letterCount ${letterCount} > max ${letterInfo.max}`);
                    return false;
                }
                for(let j=0;j<letterInfo.pos.length;j++) {
                    switch(letterInfo.pos[j]) {
                        case 1:
                            if (word[j] !== letter) {
                                Logger.log('lettertrack', 'trace', `word '${word}' does not match for letter ${letter} position ${j} because letter ${word[j]} != expected ${letter}`);
                                return false;
                            }
                            break;
                        case 0:
                            if (word[j] === letter) {
                                Logger.log('lettertrack', 'trace', `word '${word}' does not match for letter ${letter} position ${j} because letter ${word[j]} == unexpected ${letter}`);
                                return false;
                            }
                            break;
                    }
                }
            }
        }

        Logger.log('lettertrack', 'trace', `word '${word}' matches letter info`);

        return true;
    }

    /**
     * Check the given word against the information in the letter tracker, to see if it is a possible solution or not.
     *
     * @param {string} word Word to check
     * @returns True if the word is a possible solution, false if it is not.
     */
    wordHasLettersNew(word) {
        stats.wordHasLettersCount++;
        // TODO: Simplify with for...of
        Logger.log('lettertrack', 'trace', `wordHasLettersNew`);

        let wordCharOccurences = { };
        for (let letterPos=0; letterPos<word.length; letterPos++) {
            const wordLetter = word[letterPos];
            wordCharOccurences[wordLetter] = (wordCharOccurences[wordLetter] || 0) + 1;
        }

        Logger.log('lettertrack', 'trace', `Checking for letters which must be in word`);
        // See if there are any letters that are definitely in the solution but not in our guess
        for (const [letter, minLetters] of Object.entries(this.minLettersCount)) {
            const letterCount = wordCharOccurences[letter] || 0;
            Logger.dynLog('lettertrack', 'trace', () => [`Letter ${letter} word has ${letterCount}, min is ${minLetters}, full entry:`,this.minLettersCount]);
            if (letterCount < minLetters) {
                // Put this check first, it acounts for 80% of falses
                Logger.dynLog('lettertrack', 'trace', () => `word '${word}' does not match for letter ${letter} because letterCount ${letterCount} < min ${minLetters}`);
                stats.wordHasLettersFalseMinLetters++;
                return false;
            }
        }

        Logger.log('lettertrack', 'trace', `Checking positions and letters`);
        // Look through the positions next
        for (let letterPos=0; letterPos<word.length; letterPos++) {
            const wordLetter = word[letterPos];
            const letterInfo = this.letters[wordLetter];
            if (letterInfo) {
                const letterCount = wordCharOccurences[wordLetter] || 0;
                if (letterInfo.max !== undefined && letterCount > letterInfo.max) {
                    // Put this check second, it accounts for 9% of falses
                    Logger.dynLog(() => 'lettertrack', 'trace', `word '${word}' does not match for letter ${wordLetter} because letterCount ${letterCount} > max ${letterInfo.max}`);
                    stats.wordHasLettersFalseMaxLetters++;
                    return false;
                }
            }

            Logger.dynLog('lettertrack', 'trace', () => `word ${word} checking pos ${letterPos} against posNotLetter`, this.posNotLetter[letterPos]);
            if (this.posNotLetter[letterPos][wordLetter]) {
                // Put this check third, it accounts for 7$ of falses
                Logger.dynLog('lettertrack', 'trace', () => `word '${word}' does not match for letter ${wordLetter} position ${letterPos}`);
                stats.wordHasLettersFalsePosNot++;
                return false;
            }

            Logger.dynLog('lettertrack', 'trace', () => `word ${word} checking pos ${letterPos} against posLetter ${this.posLetter[letterPos]}`);
            if (this.posLetter[letterPos]) {
                if (this.posLetter[letterPos] != wordLetter) {
                    // Put this check last, it accounts for 4% of falses
                    Logger.dynLog('lettertrack', 'trace', () => `word '${word}' does not match for letter ${wordLetter} position ${letterPos} because letter ${wordLetter} != expected ${this.posLetter[letterPos]}`);
                    stats.wordHasLettersFalsePos++;
                    return false;
                }
            }
        }

        Logger.log('lettertrack', 'trace', `word '${word}' matches letter info`);

        return true;
    }

    definitelyHasLetter(letter, min = 1) {
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return false;
        }
        return !!letterInfo.min && letterInfo.min >= min;
    }

    definitelyDoesNotHaveLetter(letter) {
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return false;
        }
        return letterInfo.max === 0;
    }

    definitelyHasLetterAtPosition(letter, position) {
        return this.posLetter[position] === letter;
    }

    minLetters(letter) {
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return undefined;
        }
        return letterInfo.min ;
    }

    knownLetters() {
        return Object.keys(this.minLettersCount).length;
    }

    debugString() {
        return "LetterTracker:\n" + 
        Object.entries(this.letters)
            .map(([letter, entry]) => {
                return `${letter}: ${JSON.stringify(entry)}`;
            }).join("\n");
    }

    static dumpStats() {
        Logger.log('lettertrack', 'info', stats);
    }
}