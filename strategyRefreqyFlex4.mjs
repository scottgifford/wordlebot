import { Logger } from "./log.mjs";
import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";

const DEFAULT_HIGH_SCORE_PERCENTILE = 0.95;

export class StrategyRefreqyFlex4 extends StrategyRefreqyFlex3 {

    constructor(words, options) {
        super(words, {
            highScorePercentile: DEFAULT_HIGH_SCORE_PERCENTILE,
            ...options
        });
        this.id = Math.floor(Math.random() * 1000000);
        if (options.highScorePercentile < 0 > options.highScorePercentile > 1) {
            throw new Error(`StrategyRefreqyFlex4: highScorePercentile option must be between 0 and 1 (not ${options.highScorePercentile})`);
        }
    }
    bestWordWithScore(words) {
        const scores = this.scoreAndSortWords(words);
        const scoreIndex = Math.floor((words.length - 1) * (1.00 - this.options.highScorePercentile));
        Logger.log('strategy', 'debug', `StrategyRefreqyFlex4 #${this.id} choosing item ${scoreIndex + 1 /* correct for 0-based array indexing */} of ${scores.length} based on percentile ${this.options.highScorePercentile}.`)
        return scores[scoreIndex];
    }
}
