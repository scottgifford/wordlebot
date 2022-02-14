import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";

const HIGH_SCORE_PERCENTILE = 0.99;

export class StrategyRefreqyFlex4 extends StrategyRefreqyFlex3 {
    // TODO: CopyPasta from StrategyFreqy, refactor or move logic up
    bestWord(words, freq) {
        const scores = this.scoreAndSortWords(words, freq);
        // Logger.log('score', 'debug', 'Top 10 Scores:', scores.slice(0,10).map((s) => JSON.stringify(s)).join(",\n"));
        // if (process.env["EXTRA_SCORE_WORDS"]) {
        //     Logger.log('score', 'debug', 'Extra word scores:',this.scoreAndSortWords(process.env["EXTRA_SCORE_WORDS"].split(' '), freq).map((s) => JSON.stringify(s)).join(",\n"));
        // }
        const scoreIndex = Math.floor(words.length * (1.00 - HIGH_SCORE_PERCENTILE));
        return scores[scoreIndex].word;
    }    
}