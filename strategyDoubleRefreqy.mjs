import { Logger } from "./log.mjs";
import { StrategyDoubleFreqy } from "./strategyDoubleFreqy.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";

/**
 * Frequency analyzer strategy that re-computes the frequency analysis every guess based on remaining words,
 * with a word scorer that understands double and triple occurrences.
 */
export class StrategyDoubleRefreqy extends StrategyDoubleFreqy {
    constructor(words, options) {
        super(words, options);
    }

    update(guess, result) {
        super.update(guess, result);
        Logger.log('strategy', 'debug', `StrategyDoubleRefreqy analyzing frequencies of remaining words`);
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
        super.updateLog();
    }
}