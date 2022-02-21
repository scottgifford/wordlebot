import { Strategy } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { Logger } from "./log.mjs";

export class StrategyRandomRemaining extends Strategy {
    constructor(words, options) {
        super(words, options);
        this.remainingWords = words;
        this.letters = new LetterTracker();
    }

    guess() {
        const guess = randWord(this.remainingWords);
        super.guessLog();
        return guess;
    }

    update(guess, result) {
        this.letters.update(guess, result);

        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        super.updateLog();
    }
}