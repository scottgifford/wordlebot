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
        // TODO: I think we are also cloning in the caller (strategyRefreqyFlexAbstract#79)
        this.letters = this.options.letters ? this.options.letters.clone() : new LetterTracker();
        return true;
    }

    getSupportedOptions() {
        return [
            new StrategyOptionInternal(
                'letters', undefined,
                'Initial letter tracker object for this strategy (instead of creating a new one)'),
            ...super.getSupportedOptions()
        ];
    }
}
