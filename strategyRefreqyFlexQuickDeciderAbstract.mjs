import { Logger } from "./log.mjs";
import { StrategyRefreqyFlexAbstract } from "./strategyRefreqyFlexAbstract.mjs";

const DEFAULT_MAX_WRONGNESS = 5;
const DEFAULT_REMAINING_WORDS_THRESHOLD = 1;

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

/**
 * Another version of RefreqyFlex with a different strategy for choosing flex words.
 *
 * For choosing the flex words, it eliminates from the frequency analysis both letters we know are definitely in the word (as in RefreqyFlex)
 * and also letters we know are definitely not in the word (a change).
 *
 * For deciding whether to use the flex word or the remaining word, it checks the remaining words and the known letters against a threshold.
 * Through experimentation, however, I found the most effective choices for these thresholds are ones which always choose the flex word
 * (though it may be worth revisiting this as I've gotten better at measuring).
 */
export class StrategyRefreqyFlexQuickDeciderAbstract extends StrategyRefreqyFlexAbstract {
    shouldUseFlexWord(flexWordAndScore, guessNum) {
        if (this.options.lastTurnGuess && this.isLastGuess(guessNum)) {
            Logger.log('strategy', 'debug', `Should use flex word, last turn #${guessNum}`);
            return false;
        }

        const shouldUseBrandNewGuess = this.remainingWords.length > this.options.remainingWordsThreshold && this.letters.knownLetters() < this.options.maxWrongness;
        Logger.log('strategy', 'debug', `Should use ${shouldUseBrandNewGuess ? "flex" : "remaining"} word, based on: (remainingWords=${this.remainingWords.length} > remainingWordsThreshold=${this.options.remainingWordsThreshold} && knownLetters=${this.letters.knownLetters()} < maxWrongness=${this.options.maxWrongness}) = ${shouldUseBrandNewGuess}`);
        return shouldUseBrandNewGuess;
    }

    guess(guessNum) {
        try {
            // Use cached first guess, it will always be the same
            if (guessNum === 1 && this.resetCache && this.resetCache.guess) {
                Logger.log('strategy', 'debug', `Using cached guess ${this.resetCache.guess}`);
                return this.resetCache.guess;
            }

            let chosenWordAndScore;
            Logger.log('score', 'debug', `Finding best flex word`);
            const flexWordAndScore = this.chooseFlexWordAndScore();

            if (this.shouldUseFlexWord(flexWordAndScore, guessNum)) {
                chosenWordAndScore = flexWordAndScore;
            }  else {
                Logger.log('score', 'debug', `Finding best remaining word`);
                const remainingWordAndScore = this.bestWordWithScore(this.remainingWords);
                chosenWordAndScore = remainingWordAndScore;
            }

            // Cache first guess, it will always be the same
            if (guessNum === 1 && this.options['resettable']) {
                this.resetCache.guess = chosenWordAndScore.word;
            }

            return chosenWordAndScore.word;
        } finally {
            this.guessLog();
        }
    }
}
