import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const MAX_WRONGNESS = 3;

export class StrategyRefreqyFlex2 extends StrategyRefreqy {
    constructor(words) {
        super(words);
        this.knownLetters = 0;
    }

    brandNewGuess() {
        // v1 - Tweak the frequency table to remove (0-score) any letters we already know
        const freq2 = Object.fromEntries(Object.entries(this.leFreq)
            .filter(([k,v]) => !this.letters.definitelyHasLetter(k)));
        return this.bestWord(this.words, freq2);
    }

    guess() {
        // Choose both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters
        // If we know less than 3 letters, use the overall word instead of the possible word.
        const knownLetters = this.letters.knownLetters();
        console.log(`Know ${knownLetters} / 6 letters`);
        if (this.letters.knownLetters() < MAX_WRONGNESS) {
            console.log(`Picking brand new word`);
            return this.brandNewGuess();
        } else {
            return super.guess();
        }
    }

    update(guess, result) {
        this.lastResult = result;
        super.update(guess, result);
    }
}