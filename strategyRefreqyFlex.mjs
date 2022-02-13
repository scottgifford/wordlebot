import { Logger } from "./log.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const SCORE_RATIO = 0.30;

export class StrategyRefreqyFlex extends StrategyRefreqy {
    constructor(words) {
        super(words);
    }

    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex reFreq`);
        return this.leFreq.clone(([k, v]) => !this.letters.definitelyHasLetter(k));
    }

    guess() {
        // Choose and score both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters
        // As a (maybe nonsense?) heuristic, look at the ration of the overall choice to the remaining word choice,
        // and if it is above a threshold, choose the overall choice instead.
        // The threshold is kind of arbitrary and its meaning is not clear; but the remaining choice will usually be better because it's
        // used up the most common (therefore higher scoring) letters.
        const freq2 = this.reFreq();
        const bestOverallWord = this.bestWord(this.words, freq2);
        const bestOverallWordScore = bestOverallWord ? this.scoreWord(bestOverallWord, freq2) : 0;

        const bestRemainingWord = this.bestWord(this.remainingWords, this.leFreq);
        const bestRemainingWordScore = this.scoreWord(bestRemainingWord, this.leFreq);

        const scoreRatio = bestOverallWordScore / bestRemainingWordScore;
        
        const chosenWord = scoreRatio > SCORE_RATIO ? bestOverallWord : bestRemainingWord;
        Logger.log('strategy', 'info', `Chose ${chosenWord} with score ratio ${scoreRatio} (vs. ${SCORE_RATIO}); Best overall word ${bestOverallWord} score ${bestOverallWordScore}; Best remaining word ${bestRemainingWord} score ${bestRemainingWordScore}`);

        return chosenWord;
    }
}