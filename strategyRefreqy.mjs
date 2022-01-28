import { StrategyFreqy } from "./strategyFreqy.mjs";

export class StrategyRefreqy extends StrategyFreqy {
    constructor(words) {
        super(words);
    }

    guess() {
        return this.remainingWords.map(word => ({ word, score: this.scoreWord(word)})).sort((a, b) => /* reverse sort */ b.score - a.score)[0].word;
    }

    update(guess, result) {
        this.letters.update(guess, result);

        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        console.log(`${this.remainingWords.length} possibilities left`)
        this.leFreq = StrategyFreqy.frequencyAnalyze(this.remainingWords);

    }
}