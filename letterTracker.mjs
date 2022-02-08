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
            
            if (result[i] === 'G') {
                letterInfo.pos[i] = 1;
                letterInfo.min = Math.max(letterInfo.min || 1, countOccurrences(guess[i]));
            } else if (result[i] === 'Y') {
                letterInfo.pos[i] = 0;
                letterInfo.min = Math.max(letterInfo.min || 1, countOccurrences(guess[i]));
            } else if (result[i] === '-') {
                letterInfo.pos[i] = 0;
                letterInfo.min = Math.max(letterInfo.min || 0, countOccurrences(guess[i]));
                letterInfo.max = Math.min(letterInfo.max || 0, countOccurrences(guess[i]));
            }
    
            this.letters[guess[i]] = letterInfo;
        }
    }

    updateFromRemaining(words) {
        ALL_LETTERS.forEach((letter) => {
            const letterInfo = this.letters[letter] || makeDefaultLetter();
            Logger.log('letters', 'trace', `Updated letter ${letter} from:`, letterInfo);

            // Positions
            [0, 1, 2, 3, 4].forEach((pos) => {
                const letterAtPos = (word) => word[pos] === letter;
                const definitely = words.every(letterAtPos);
                const definitelyNot = !words.some(letterAtPos);
                Logger.log('letters', 'trace', `letter ${letter} position ${pos} definitely=${definitely} definitelyNot=${definitelyNot}`);
                if (definitely) {
                    letterInfo.pos[pos] = 1;
                } else if (definitelyNot) {
                    letterInfo.pos[pos] = 0;
                }
            });

            // Overall max/min
            letterInfo.min = Math.max(letterInfo.min || 0, Math.min(...(words.map((word) => charOccurrences(word, letter)))));
            letterInfo.max = Math.min(letterInfo.max === undefined ? 5 : letterInfo.max, Math.max(...(words.map((word) => charOccurrences(word, letter)))));

            Logger.log('letters','trace', `Updated letter ${letter}   to:`, letterInfo);
            this.letters[letter] = letterInfo;
        });
    }

    wordHasLetters(word) {
        for (const letter of ALL_LETTERS) {
            const letterInfo = this.letters[letter];
            if (letterInfo) {
                Logger.log('lettertrack', 'debug', `Found info on letter '${letter}': `, letterInfo);
                const letterCount = charOccurrences(word, letter, word.length);
                if (letterInfo.min !== undefined && letterCount < letterInfo.min) {
                    return false;
                }
                if (letterInfo.max !== undefined && letterCount > letterInfo.max) {
                    return false;
                }
                for(let j=0;j<letterInfo.pos.length;j++) {
                    switch(letterInfo.pos[j]) {
                        case 1:
                            if (word[j] !== letter) {
                                return false;
                            }
                            break;
                        case 0:
                            if (word[j] === letter) {
                                return false;
                            }
                            break;
                    }
                }
            }
        }
        return true;
    }

    definitelyHasLetter(letter, min = 0) {
        const letterInfo = this.letters[letter];
        if (!letterInfo) {
            return false;
        }
        return letterInfo.min >= min;
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