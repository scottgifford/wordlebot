import { Logger } from "./log.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words) {
        super(words);
    }

    update(guess, result) {
        super.update(guess, result);
        Logger.log('strategy', 'debug', `Refreqy reFreq`);
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
    }
}