export class Strategy {
    constructor(words) {
        this.words = words;
    }

    guess(guessNum) {
        throw new Error("Abstract method");
    }

    update(guess, result) {
        throw new Error("Abstract method");
    }
}