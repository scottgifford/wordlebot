import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const DEFAULT_SCORE_RATIO = 0.30;

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

/**
 * Frequency-analyzer based strategy, with the flexibility to choose words that are not remaining possible
 * solutions if the strategy decides they will reveal more information.
 */
export class StrategyRefreqyFlexAbstract extends StrategyRefreqy {
    getSupportedOptions() {
    return [
        new StrategyOption(
                'lastTurnGuess', true,
                'If we are on (or past) the last turn, always guess a real possibility instead of a flex word'),
            ...super.getSupportedOptions(),
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
        Logger.log('strategy','debug','Creating new sub-strategy object');
        return new this.constructor(words, {
            ...this.options,
            freq,
            letters: this.letters.clone(),
        });
    }

    isLastGuess(guessNum) {
        return guessNum >= NUM_GUESSES;
    }

    shouldUseFlexWord(flexWordAndScore, remainingWordAndScore) {
        throw new Error('Method shouldUseFlexWord not implemented in abstract class');
    }

    guess(guessNum) {
        // Use cached first guess, it will always be the same
        if (guessNum === 1 && this.resetCache && this.resetCache.guess) {
            return this.resetCache.guess;
        }
        // Choose and score both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters.
        Logger.log('score', 'debug', `Finding best flex word`);
        const flexWordAndScore = this.chooseFlexWordAndScore();

        Logger.log('score', 'debug', `Finding best remaining word`);
        const remainingWordAndScore = this.bestWordWithScore(this.remainingWords);

        const chosenWordAndScore = this.shouldUseFlexWord(flexWordAndScore, remainingWordAndScore, guessNum)
            ? flexWordAndScore
            : remainingWordAndScore;

        // Cache first guess, it will always be the same
        if (guessNum == 1 && this.options['resettable']) {
            this.resetCache.guess = chosenWordAndScore.word;
        }

        super.guessLog();
        return chosenWordAndScore.word;
    }
}
