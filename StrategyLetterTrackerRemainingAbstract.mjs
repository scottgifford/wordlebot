import { LetterTracker } from "./letterTracker.mjs";
import { Strategy, StrategyOptionInternal } from "./strategy.mjs";

/**
 * Abstract class to keep a letter tracker and a list of remaining words.
 */
export class StrategyLetterTrackerRemainingAbstract extends Strategy {
    constructor(words, options) {
        super(words, options);
    }

    reset() {
        this.remainingWords = this.words;
        this.letters = this.options.letters ? this.options.letters : new LetterTracker();
        return true;
    }

    getSupportedOptions() {
        return [
            new StrategyOptionInternal(
                'letters', undefined,
                'Initial letter tracker object for this strategy (instead of creating a new one).  Note this will be used destructively unless you provide a .clone()'),
            ...super.getSupportedOptions()
        ];
    }
}
