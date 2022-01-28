import { StrategyFreqy } from "./strategyFreqy.mjs";

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words) {
        super(words);
    }

    update(guess, result) {
        super.update(guess, result);
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
    }
}