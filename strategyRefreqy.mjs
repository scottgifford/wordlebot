import { StrategyFreqy } from "./strategyFreqy.mjs";

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words) {
        super(words);
    }

    update(guess, result) {
        this.letters.update(guess, result);
        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        console.log(`${this.remainingWords.length} possibilities left`)
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);
    }
}