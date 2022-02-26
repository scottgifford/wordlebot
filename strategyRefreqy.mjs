import { Logger } from "./log.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";

/**
 * Frequency analyzer strategy that re-computes the frequency analysis every guess based on remaining words.
 */

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words, options) {
        super(words, options);
        if (options['resettable']) {
            this.resetCache = {
                leFreq: this.leFreq,
            }
        }
    }

    reset() {
        super.reset();
        if (this.options.freq) {
            return false;
        }
        if (this.resetCache) {
            this.leFreq = this.resetCache.leFreq;
        }
        // Otherwise, we must be called by the constructor, and our parent constructor will set leFreq

        return true;
    }

    update(guess, result) {
        super.update(guess, result);
        Logger.log('strategy', 'debug', `StrategyRefreqy analyzing frequencies of remaining words`);
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
    }
}