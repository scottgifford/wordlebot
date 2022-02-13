import { Logger } from "./log.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";

const MAX_WRONGNESS = 5;
const REMAINING_WORDS_THRESHOLD = 1;

export class StrategyRefreqyFlex2 extends StrategyRefreqy /* Note this is not StrategyRefreqyFlex, we are using a different strategy */ {
    constructor(words) {
        super(words);
        this.knownLetters = 0;
    }

    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex2 reFreq`);
        return this.leFreq.clone(([k,v]) => !this.letters.definitelyHasLetter(k) && !this.letters.definitelyDoesNotHaveLetter(k));
    }

    shouldUseBrandNewGuess() {
        return this.remainingWords.length > REMAINING_WORDS_THRESHOLD && this.letters.knownLetters() < MAX_WRONGNESS;
    }

    brandNewGuess() {
        // v1 - Tweak the frequency table to remove (0-score) any letters we already know
        const freq2 = this.reFreq();
        Logger.log('freq', 'debug', `Freq2:\n${freq2.debugString()}`);
        Logger.log('letters', 'debug', "Letters", this.letters.debugString());
        const word = this.bestWord(this.words, freq2);
        const score = this.scoreWord(word, freq2);
        Logger.log('score', 'debug', `Chose ${word} with score ${score}`);
        if (score === 0) {
            Logger.log('score', 'debug', `Score too low, returning nothing!`);
            return undefined;
        }

        return word;
    }

    guess(guessNum) {
        // Choose both a word from the set of remaining possibilities, and from the set of words that contain none of the existing letters
        // If we know less than MAX_WRONGNESS letters and there are more than REMAINING_WORDS_THRESHOLD possibilities,
        // use the overall word instead of the possible word.
        const knownLetters = this.letters.knownLetters();
        Logger.log('strategy', 'info', `Know ${knownLetters} / 5 letters`);
        if (this.shouldUseBrandNewGuess(guessNum)) {
            Logger.log('strategy', 'info', `Picking brand new word`);
            const guess = this.brandNewGuess();
            if (guess) {
                return guess;
            } else {
                console.debug('strategy', 'debug', `Could not find brand new word, using remaining word`);
            }
        }

        Logger.log('strategy', 'info', `Falling back to possible word`);
        return super.guess();
    }
}