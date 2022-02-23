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

const MAX_LETTERS = 5;
export class LetterTracker {
    constructor(letters = { }) {
        this.letters = letters;
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
            let letterInfo = this.letters[guess[i]] || makeDefaultLetter();
            const letterOccurrences = countOccurrences(guess[i]);
            
            if (result[i] === 'G') {
                letterInfo.pos[i] = 1;
                this.updateMin(letterInfo, letterOccurrences);
            } else if (result[i] === 'Y') {
                letterInfo.pos[i] = 0;
                this.updateMin(letterInfo, letterOccurrences);
            } else if (result[i] === '-') {
                letterInfo.pos[i] = 0;
                letterInfo.min = Math.max(letterInfo.min || 0, letterOccurrences);
                if (letterInfo.max === undefined || letterInfo.max > letterOccurrences) {
                    letterInfo.max = letterOccurrences;
                    Logger.log('lettertrack','trace',`Letter '${guess[i]}' new max = ${letterInfo.max}`);
                }
            }
    
            this.letters[guess[i]] = letterInfo;
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
                } else if (definitelyNot) {
                    letterInfo.pos[pos] = 0;
                }
            });

            // Overall max/min
            letterInfo.min = Math.max(letterInfo.min || 0, Math.min(...(words.map((word) => charOccurrences(word, letter)))));
            letterInfo.max = Math.min(letterInfo.max === undefined ? 5 : letterInfo.max, Math.max(...(words.map((word) => charOccurrences(word, letter)))));

            Logger.log('lettertrack','trace', `Updated letter ${letter}   to:`, letterInfo);
            this.letters[letter] = letterInfo;
        });
        Logger.log('lettertrack', 'trace', `After updateFromRemaining: ` + this.debugString());

    }

    /**
     * Check the given word against the information in the letter tracker, to see if it is a possible solution or not.
     *
     * @param {string} word Word to check
     * @returns True if the word is a possible solution, false if it is not.
     */
    wordHasLetters(word) {
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
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return false;
        }
        return letterInfo.pos[position] === 1;
    }

    minLetters(letter) {
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return undefined;
        }
        return letterInfo.min ;
    }

    knownLetters() {
        return Object.entries(this.letters).filter(([ltr, stats]) => stats.min >= 1).length;
    }

    debugString() {
        return "LetterTracker:\n" + 
        Object.entries(this.letters)
            .map(([letter, entry]) => {
                return `${letter}: ${JSON.stringify(entry)}`;
            }).join("\n");
    }
}