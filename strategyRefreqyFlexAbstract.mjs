import { NUM_GUESSES } from "./gameRules.mjs";
import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const DEFAULT_SCORE_RATIO = 0.30;

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
            new StrategyOption(
                'flexFreqNoLetter', true,
                'When calculating the frequency table for the flex word, rule out any letters that are definitely not in the word'),
            new StrategyOption(
                'logTopLetters', 10,
                'Log this many top letters when strategy debug is enabled'),

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
    flexFreq() {
        Logger.log('strategy', 'debug', `StrategyRefreqyFlexAbstract reFreq`);
        const newFreq = this.leFreq.clone(([k, v]) => !this.letters.definitelyHasLetter(k) &&
            (!this.options.flexFreqNoLetter || !this.letters.definitelyDoesNotHaveLetter(k)));
        this.logTopLetters(newFreq);
        return newFreq;
    }

    logTopLetters(newFreq) {
        Logger.dynLog('strategy', 'debug', () => {
            return [
                `Top ${this.options.logTopLetters} letters`,
                newFreq.getAllLetters()
                .flatMap((letter) => {
                    return [0, 1, 2, 3, 4].map((prevCount) => {
                        return [`${letter}${prevCount}`, newFreq.letterFrequency(letter, prevCount) - prevCount]
                    })
                })
                .sort((a, b) => b[1]-a[1])
                .filter((val, index) => index < this.options.logTopLetters),
            ]
        });
    }


    /**
     * Chose the flex word for this strategy.
     *
     * @returns Word and score for flex word choice
     */
    chooseFlexWordAndScore() {
        const flexWordSubStrategy = this.newSubStrategy(this.words, this.flexFreq());
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
