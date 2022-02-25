import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const DEFAULT_SCORE_RATIO = 0.30;

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

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
                'lastTurnGuess', true,
                'If we are on (or past) the last turn, always guess a real possibility instead of a flex word'),
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

    isLastGuess(guessNum) {
        return guessNum >= NUM_GUESSES;
    }

    guess(guessNum) {
        // Choose and score both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters.
        Logger.log('score', 'debug', `Finding best flex word`);
        const flexWordAndScore = this.chooseFlexWordAndScore();

        Logger.log('score', 'debug', `Finding best remaining word`);
        const remainingWordAndScore = this.bestWordWithScore(this.remainingWords);

        if (this.options.lastTurnGuess && this.isLastGuess(guessNum)) {
            Logger.log('strategy', 'debug', `Should use remaining word, based on: (guessNum=${guessNum} >= ${NUM_GUESSES})`);
            return remainingWordAndScore.word;
        }

        const scoreRatio = flexWordAndScore.score / remainingWordAndScore.score;
        const chosenWordAndScore = scoreRatio > this.options.scoreRatio ? flexWordAndScore : remainingWordAndScore;

        super.guessLog();
        return chosenWordAndScore.word;
    }
}
