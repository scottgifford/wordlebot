import { Logger } from "./log.mjs";
import { StrategyOptionInteger } from "./strategy.mjs";
import { StrategyRefreqyFlexQuickDeciderAbstract } from "./strategyRefreqyFlexQuickDeciderAbstract.mjs";

const DEFAULT_MAX_WRONGNESS = 5;
const DEFAULT_REMAINING_WORDS_THRESHOLD = 1;

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
export class StrategyRefreqyFlexSimpleRules extends StrategyRefreqyFlexQuickDeciderAbstract {
    constructor(words, options) {
        super(words, {
            flexFreqNoLetter: true, // This has been the default for this strategy, consider making it the overall default
            ...options
        })
    }

    reset() {
        super.reset();
        this.knownLetters = 0;
        return true;
    }

    getSupportedOptions() {
        return [
            new StrategyOptionInteger(
                'maxWrongness', DEFAULT_MAX_WRONGNESS,
                'Maximum number of wrong letters before switching from flex word to possible word'),
             new StrategyOptionInteger(
                'remainingWordsThreshold', DEFAULT_REMAINING_WORDS_THRESHOLD,
                'Maximum number of remaining possibilities before switching from flex word to possible word'),
            ...(super.getSupportedOptions().filter(option => option.name !== 'scoreRatio')) // Filter out options from parent class that no longer work - TODO get rid of this
        ];
    }

    shouldUseFlexWord(flexWordAndScore, guessNum) {
        if (this.options.lastTurnGuess && this.isLastGuess(guessNum)) {
            Logger.log('strategy', 'debug', `Should use flex word, last turn #${guessNum}`);
            return false;
        }

        const shouldUseBrandNewGuess = 
            this.remainingWords.length > this.options.remainingWordsThreshold && 
            this.letters.knownLetters() < this.options.maxWrongness &&
            flexWordAndScore.score > 0;
        Logger.dynLog('strategy', 'debug', () => `Should use ${shouldUseBrandNewGuess ? "flex" : "remaining"} word, based on: ` +
            `(remainingWords=${this.remainingWords.length} > remainingWordsThreshold=${this.options.remainingWordsThreshold} && ` +
            `knownLetters=${this.letters.knownLetters()} < maxWrongness=${this.options.maxWrongness}) && ` +
            `(score=${flexWordAndScore.score} > 0) = ${shouldUseBrandNewGuess}`
        );

        return shouldUseBrandNewGuess;
    }
}
