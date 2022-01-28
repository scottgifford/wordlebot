import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const MAX_WRONGNESS = 3;

export class StrategyRefreqyFlex2 extends StrategyRefreqy {
    constructor(words) {
        super(words);
        this.knownLetters = 0;
    }

    brandNewGuess() {
        // v2 - Restrict word list, use existing frequency table
        const brandNewWords = this.words.filter((word) => Array.from(word).every((ltr) => !this.letters.definitelyHasLetter(ltr)));
        console.log(`${brandNewWords.length} brand new words`);
        return this.bestWord(brandNewWords, this.leFreq);
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