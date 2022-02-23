import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";

const DEFAULT_HIGH_SCORE_PERCENTILE = 0.95;

export class StrategyRefreqyFlex4 extends StrategyRefreqyFlex3 {
    constructor(words, options) {
        super(words, options);
        this.id = Math.floor(Math.random() * 1000000);
    }

    getSupportedOptions() {
        return [
            new StrategyOption(
                'highScorePercentile', DEFAULT_HIGH_SCORE_PERCENTILE,
                'Percentile rank of word to pick, as a ratio from 0-1 (e.g. 0.0 is the lowest-scoring word, 1.0 is the highest-scoring',
                (value) => {
                    if (value < 0 || value > 1) {
                        throw new Error(`Must be between 0 and 1 (not ${value})`);
                    }
                }),
            ...super.getSupportedOptions()
        ];
    }

    bestWordWithScore(words) {
        const scores = this.scoreAndSortWords(words);
        const scoreIndex = Math.floor((words.length - 1) * (1.00 - this.options.highScorePercentile));
        Logger.log('strategy', 'debug', `StrategyRefreqyFlex4 #${this.id} choosing item ${scoreIndex + 1 /* correct for 0-based array indexing */} of ${scores.length} based on percentile ${this.options.highScorePercentile}.`)
        return scores[scoreIndex];
    }
}
