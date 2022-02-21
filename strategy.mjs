export class Strategy {
    constructor(words, options) {
        this.words = words;
        this.options = options;
    }

    guess(guessNum) {
        throw new Error("Abstract method");
    }

    update(guess, result) {
        throw new Error("Abstract method");
    }

    guessLog() {
        // Do nothing
    }

    updateLog() {
        // Do nothing
    }
}
