import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const DEFAULT_SCORE_RATIO = 0.30;

/**
 * Frequency-analyzer based strategy, with the flexibility to choose words that are not remaining possible
 * solutions if the strategy decides they will reveal more information.
 */
export class StrategyRefreqyFlex extends StrategyRefreqy {
    constructor(words, options) {
        super(words, options);
    }

    getSupportedOptions() {
        return [
            new StrategyOption(
                'scoreRatio', DEFAULT_SCORE_RATIO,
                'If the flex word has a score this multiple of the possible word, choose the flex word'
            ),
            ...super.getSupportedOptions()
        ];
    }

    /**
     * Create a new frequency analysis based on the current one, but with modifications, used to choose the flex word.
     *
     * The base class removes entries from the original frequency analysis where we know for sure the letter will occur in the word
     * (since we will not learn much from that).
     *
     * @returns Updated frequency analysis
     */
    // TODO: Does this really need to be a method?
    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex reFreq`);
        return this.leFreq.clone(([k, v]) => !this.letters.definitelyHasLetter(k));
    }

    /**
     * Chose the flex word for this strategy.
     *
     * @returns Word and score for flex word choice
     */
    chooseFlexWordAndScore() {
        const flexWordSubStrategy = this.newSubStrategy(this.words, this.reFreq());
        return flexWordSubStrategy.bestWordWithScore(this.words);
    }

    newSubStrategy(words, freq) {
        // Create a new instance of the same class as us
        return new this.constructor(words, {
            ...this.options,
            freq,
            letters: this.letters.clone(),
        });
    }

    /**
     * From the given flex word and remaining word, choose one and return it.
     *
     * In the base class, we compute the ratio betweeen the flex word and the remaining word, and if it is above a threshold,
     * choose the flex word.
     *
     * @param {*} flexWordAndScore Flex word and score to consider
     * @param {*} remainingWordAndScore Remaining word and score to consider
     * @returns Either flex word or remaining word
     */
    chooseFlexOrRemainingWord(flexWordAndScore, remainingWordAndScore) {
        const scoreRatio = flexWordAndScore.score / remainingWordAndScore.score;

        const chosenWordAndScore = scoreRatio > this.options.scoreRatio ? flexWordAndScore : remainingWordAndScore;
        Logger.log('strategy', 'debug', `Chose ${chosenWordAndScore.word} with score ratio ${scoreRatio} (vs. ${this.options.scoreRatio}); Flex word ${chosenWordAndScore.word} score ${chosenWordAndScore.score}; Best remaining word ${remainingWordAndScore.word} score ${remainingWordAndScore.score}`);
        return chosenWordAndScore;
    }

    guess(guessNum) {
        // Choose and score both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters.
        // Use chooseFlexOrRemainingWord() method to decide which of these to use.
        Logger.log('score', 'debug', `Finding best flex word`);
        const flexWordAndScore = this.chooseFlexWordAndScore();
        Logger.log('score', 'debug', `Finding best remaining word`);
        const remainingWordAndScore = this.bestWordWithScore(this.remainingWords);
        const wordAndScore = this.chooseFlexOrRemainingWord(
            flexWordAndScore,
            remainingWordAndScore,
            guessNum
        );
        super.guessLog();
        return wordAndScore.word;
    }
}
