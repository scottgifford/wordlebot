import { Logger } from "./log.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";

/**
 * Frequency analyzer strategy that re-computes the frequency analysis every guess based on remaining words.
 */

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words, options) {
        super(words, options);
    }

    update(guess, result) {
        super.update(guess, result);
        Logger.log('strategy', 'debug', `StrategyRefreqy analyzing frequencies of remaining words`);
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
    }
}