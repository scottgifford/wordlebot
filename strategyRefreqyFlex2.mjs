import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const MAX_WRONGNESS = 5;
const REMAINING_WORDS_THRESHOLD = 1;

export class StrategyRefreqyFlex2 extends StrategyRefreqy {
    constructor(words) {
        super(words);
        this.knownLetters = 0;
    }

    brandNewGuess() {
        // v1 - Tweak the frequency table to remove (0-score) any letters we already know
        const freq2 = Object.fromEntries(Object.entries(this.leFreq)
            .filter(([k,v]) => !this.letters.definitelyHasLetter(k) && !this.letters.definitelyDoesNotHaveLetter(k)));
        const word = this.bestWord(this.words, freq2);
        const score = this.scoreWord(word, freq2);
        console.log(`Chose ${word} with score ${score}`);
        if (score === 0) {
            console.log(`Score too low, returning nothing!`);
            return undefined;
        }

        return word;
    }

    guess() {
        // Choose both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters
        // If we know less than 3 letters, use the overall word instead of the possible word.
        const knownLetters = this.letters.knownLetters();
        console.log(`Know ${knownLetters} / 5 letters`);
        if (this.remainingWords.length >= REMAINING_WORDS_THRESHOLD && this.letters.knownLetters() < MAX_WRONGNESS) {
            console.log(`Picking brand new word`);
            const guess = this.brandNewGuess();
            if (guess) {
                return guess;
            } else {
                console.log(`Could not find brand new word, using remaining word`);
            }
        }

        return super.guess();
    }

    update(guess, result) {
        this.lastResult = result;
        super.update(guess, result);
    }
}