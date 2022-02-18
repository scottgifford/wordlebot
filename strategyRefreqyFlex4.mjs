import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";

const HIGH_SCORE_PERCENTILE = 0.99;

export class StrategyRefreqyFlex4 extends StrategyRefreqyFlex3 {
    // TODO: CopyPasta from StrategyFreqy, refactor or move logic up
    bestWord(words, freq) {
        const scores = this.scoreAndSortWords(words, freq);
        const scoreIndex = Math.floor(words.length * (1.00 - HIGH_SCORE_PERCENTILE));
        return scores[scoreIndex].word;
    }    
}