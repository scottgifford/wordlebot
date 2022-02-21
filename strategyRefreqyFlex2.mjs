import { Logger } from "./log.mjs";
import { StrategyRefreqyFlex } from "./strategyRefreqyFlex.mjs";

const DEFAULT_MAX_WRONGNESS = 5;
const DEFAULT_REMAINING_WORDS_THRESHOLD = 1;

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
        Logger.log('strategy', 'debug', 'StrategyRefreqyFlex2 constructor options:', options);
        super(words, {
            maxWrongness: DEFAULT_MAX_WRONGNESS,
            remainingWordsThreshold: DEFAULT_REMAINING_WORDS_THRESHOLD,
            ...options,
        });
        this.knownLetters = 0;
    }

    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex2 reFreq`);
        return this.leFreq.clone(([k,v]) => !this.letters.definitelyHasLetter(k) && !this.letters.definitelyDoesNotHaveLetter(k));
    }

    /**
     * From the given flex word and remaining word, choose one and return it.
     *
     * For deciding whether to use the flex word or the remaining word, it checks the remaining words and the known letters against a threshold.
     * Through experimentation, however, I found the most effective choices for these thresholds are ones which always choose the flex word
     * (though it may be worth revisiting this as I've gotten better at measuring).
     *
     * @param {*} flexWordAndScore Flex word and score to consider
     * @param {*} remainingWordAndScore Remaining word and score to consider
     * @returns Either flex word or remaining word
     */
    chooseFlexOrRemainingWord(flexWordAndScore, remainingWordAndScore, guessNum) {
        const shouldUseBrandNewGuess = this.shouldUseBrandNewGuess(guessNum) && flexWordAndScore.score > 0;
        const chosenWordAndScore = shouldUseBrandNewGuess ? flexWordAndScore : remainingWordAndScore;
        Logger.log('strategy', 'debug', `Chose ${shouldUseBrandNewGuess ? "flex" : "remaining"} word ${chosenWordAndScore.word}`);
        return chosenWordAndScore;
    }

    // TODO: Should not be a method, but is currently used by subclasses
    shouldUseBrandNewGuess(guessNum) {
        const shouldUseBrandNewGuess = this.remainingWords.length > this.options.remainingWordsThreshold && this.letters.knownLetters() < this.options.maxWrongness;
        Logger.log('strategy', 'debug', `Should use ${shouldUseBrandNewGuess ? "flex" : "remaining"} word, based on: (remainingWords=${this.remainingWords.length} > remainingWordsThreshold=${this.options.remainingWordsThreshold} && knownLetters=${this.letters.knownLetters()} < maxWrongness=${this.options.maxWrongness}) = ${shouldUseBrandNewGuess}`);
        return shouldUseBrandNewGuess;
    }
}
