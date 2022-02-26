import { LetterTracker } from "./letterTracker.mjs";
import { Strategy } from "./strategy.mjs";

/**
 * Abstract class to keep a letter tracker and a list of remaining words.
 */
export class StrategyLetterTrackerRemainingAbstract extends Strategy {
    constructor(words, options) {
        super(words, options);
    }

    reset() {
        this.remainingWords = this.words;
        this.letters = this.options.letters ? this.options.letters.clone() : new LetterTracker();
        return true;
    }
}
