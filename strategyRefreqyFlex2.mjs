import { Logger } from "./log.mjs";
import { StrategyOption, StrategyOptionInteger } from "./strategy.mjs";
import { StrategyRefreqyFlex } from "./strategyRefreqyFlex.mjs";

const DEFAULT_MAX_WRONGNESS = 5;
const DEFAULT_REMAINING_WORDS_THRESHOLD = 1;

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

// TODO: This is really just a small variant of StrategyRefreqyFlex, probably it should just be some options there.

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
export class StrategyRefreqyFlex2 extends StrategyRefreqyFlex {
    constructor(words, options) {
        super(words, options);
        this.knownLetters = 0;
    }

    getSupportedOptions() {
        return [
            new StrategyOptionInteger(
                'maxWrongness', DEFAULT_MAX_WRONGNESS,
                'Maximum number of wrong letters before switching from flex word to possible word'),
             new StrategyOptionInteger(
                'remainingWordsThreshold', DEFAULT_REMAINING_WORDS_THRESHOLD,
                'Maximum number of remaining possibilities before switching from flex word to possible word'),
            ...(super.getSupportedOptions().filter(option => option.name !== 'scoreRatio')) // Filter out options from parent class that no longer work
        ];
    }

    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex2 reFreq`);
        return this.leFreq.clone(([k,v]) => !this.letters.definitelyHasLetter(k) && !this.letters.definitelyDoesNotHaveLetter(k));
    }

    shouldUseBrandNewGuess(guessNum) {
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
            if (this.shouldUseBrandNewGuess(guessNum)) {
                Logger.log('score', 'debug', `Finding best flex word`);
                const flexWordAndScore = this.chooseFlexWordAndScore();
                if (flexWordAndScore.score > 0) {
                    return flexWordAndScore.word;
                }
            }

            Logger.log('score', 'debug', `Finding best remaining word`);
            const remainingWordAndScore = this.bestWordWithScore(this.remainingWords);

            return remainingWordAndScore.word;
        } finally {
            this.guessLog();
        }
    }
}
