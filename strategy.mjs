export class Strategy {
    constructor(words) {
        this.words = words;
    }

    guess() {
        throw new Error("Abstract method");
    }

    update(guess, result) {
        throw new Error("Abstract method");
    }
}