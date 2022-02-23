import { Strategy, StrategyOptionRate } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { takeGuess } from "./util.mjs";
import { Logger } from "./log.mjs";

const DEFAULT_ANSWER_SAMPLE_RATE = 0.001;
const DEFAULT_GUESS_SAMPLE_RATE = 0.001;

// Simulated guess strategy.
// For each word "g"
//   For each word "a"
//     Get results for takeGuess(g, a)
//     Plug results into (copy of) LetterTracker
//     See how many words are left
//     See how many words were eliminated
//     TODO Score this somehow?
//          We want a score that eliminates roughly half the words
//          (i.e. splits the set into two pieces with as many words as possible)
//          Kind of like a binary search
//          Maybe we can just look at square of the difference?
//          
//  Then average score over all "a""
// Then pick word with best score

export class StrategySimGuess extends Strategy {
    constructor(words, options) {
        super(words, options);
        this.remainingWords = words;
        this.letters = new LetterTracker();
    }

    getSupportedOptions() {
        return [
            new StrategyOptionRate(
                'solutionSampleRate', DEFAULT_ANSWER_SAMPLE_RATE,
                'Instead of all possible solution words, randomly sample this percentage of possible solutions'),
            new StrategyOptionRate(
                'guessSampleRate', DEFAULT_GUESS_SAMPLE_RATE,
                'Instead of simulating all possible guesses, randomly sample this percentage of possible guesses'),
            ...super.getSupportedOptions()
        ];
    }

    // TODO: As rate gets closer to 1, we are more likely to introduce duplicates
    // To avoid we could do a shuffle instead
    sample(arr, rate) {
        const n = Math.ceil(arr.length * rate);
        let ret = [];
        for(let i=0;i<n;i++) {
            ret.push(randWord(arr));
        }

        return ret;
    }

    guess() {
        const possibleGuesses = this.sample(this.remainingWords, this.options.solutionSampleRate);
        Logger.log('strategy', 'debug', "Possible Guesses: ", possibleGuesses);
        const sortedGuesses = possibleGuesses.map(word => ({ word, score: this.scoreWord(word)})).sort((a, b) => /* low to high */ a.score - b.score);
        Logger.log('strategy', 'debug', "Sorted Guesses: ", sortedGuesses);
        const bestGuess = sortedGuesses[0];
        Logger.log('strategy', 'info', "Best guess:", bestGuess);
        super.guessLog();
        return bestGuess.word;
    }

    update(guess, result) {
        this.letters.update(guess, result);

        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        super.updateLog();
    }

    scoreWord(word) {
        let totalScore = 0;
        const simulatedAnswers = this.sample(this.remainingWords, this.options.guessSampleRate);
        for(let i=0;i<simulatedAnswers.length;i++) {
            //   For each word "a" is too slow, instead sample.
            const ans = simulatedAnswers[i];
            //     Get results for takeGuess(g, a)
            const result = takeGuess(word, ans)
            //     Plug results into (copy of) LetterTracker
            const tempLetters = this.letters.clone();
            tempLetters.update(word, result);
            //     See how many words are left
            const tempRemainingWords = this.remainingWords.filter(word => tempLetters.wordHasLetters(word));
            //     See how many words were eliminated
            //     TODO Score this somehow?
            //          We want a score that eliminates roughly half the words
            //          (i.e. splits the set into two pieces with as many words as possible)
            //          Kind of like a binary search
            //          Maybe we can just look at square of the difference?
            const eliminatedWords = this.remainingWords.length - tempRemainingWords.length;

            // Score v1 - Eliminated is close to remaining
            // const score = Math.abs(eliminatedWords - tempRemainingWords.length);
            // Score v2 - Remaining is close to half of starting point
            const score = Math.floor(Math.abs(tempRemainingWords.length - this.remainingWords.length/2));
            // Score v3 - Remaining is low
            // const score = tempRemainingWords.length;
            // Logger.log('strategy', 'info', `Word ${word} answer ${ans} simulation: ${eliminatedWords} eliminated, ${tempRemainingWords.length} remaining, ${score} score`);
            totalScore += score;
        }
        // Average score
        const averageScore = totalScore / simulatedAnswers.length;
        Logger.log('strategy', 'debug', `Word '${word}' has score of ${averageScore}`);
        return averageScore;
    }
}