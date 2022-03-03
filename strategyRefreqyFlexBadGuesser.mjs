import { Logger } from "./log.mjs";
import { StrategyOptionRate } from "./strategy.mjs";
import { StrategyRefreqyFlexDoubleRules } from "./strategyRefreqyFlexDoubleRules.mjs";

const DEFAULT_HIGH_SCORE_PERCENTILE = 0.95;

// TODO: Rename class
export class StrategyRefreqyFlex4 extends StrategyRefreqyFlexDoubleRules {
    getSupportedOptions() {
        return [
            new StrategyOptionRate(
                'highScorePercentile', DEFAULT_HIGH_SCORE_PERCENTILE,
                'Percentile rank of word to pick, as a ratio from 0-1 (e.g. 0.0 is the lowest-scoring word, 1.0 is the highest-scoring'),
            ...super.getSupportedOptions()
        ];
    }

    bestWordWithScore(words) {
        const scores = this.scoreAndSortWords(words);
        const scoreIndex = Math.floor((words.length - 1) * (1.00 - this.options.highScorePercentile));
        Logger.log('strategy', 'debug', `StrategyRefreqyFlex4 choosing item ${scoreIndex + 1 /* correct for 0-based array indexing */} of ${scores.length} based on percentile ${this.options.highScorePercentile}.`)
        return scores[scoreIndex];
    }
}
