import { LetterTracker } from "./letterTracker.mjs";
import { Logger } from "./log.mjs";
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

    update(guess, result) {
        this.letters.update(guess, result);

        Logger.log('strategy', 'debug', `${this.remainingWords.length} possible words before filtering`);
        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        Logger.log('strategy', 'debug', `${this.remainingWords.length} possible words after filtering`);

        if (this.remainingWords.length === 0) {
            throw new Error('No remaining possibilities, giving up');
        }

        this.updateLog();
    }

    updateLog() {
        super.updateLog();
        Logger.log('strategy', 'debug', this.letters.debugString());
        Logger.log('strategy', 'info', `${this.remainingWords.length} possibilities left`);
        if (this.remainingWords.length <= this.options.logNRemainingWords) {
            Logger.dynLog('strategy', 'debug', () => "Remaining possibilities:\n" + this.remainingWords.map(word => JSON.stringify(this.wordWithScore(word))).join("\n"));
        }
    }
}
