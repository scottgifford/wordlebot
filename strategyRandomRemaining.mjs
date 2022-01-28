import { Strategy } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { LetterTracker } from "./letterTracker.mjs";

export class StrategyRandomRemaining extends Strategy {
    constructor(words) {
        super(words);
        this.remainingWords = words;
        this.letters = new LetterTracker();
    }

    guess() {
        return randWord(this.remainingWords);
    }

    update(guess, result) {
        this.letters.update(guess, result);

        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        console.log(`${this.remainingWords.length} possibilities left`)
    }
}