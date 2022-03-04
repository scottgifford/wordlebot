import { Strategy, StrategyOption, StrategyOptionInteger, StrategyOptionRate } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { takeGuess } from "./util.mjs";
import { Logger } from "./log.mjs";
import { StrategyLetterTrackerRemainingAbstract } from "./StrategyLetterTrackerRemainingAbstract.mjs";

const DEFAULT_ANSWER_SAMPLE_RATE = 0.001;
const DEFAULT_GUESS_SAMPLE_RATE = 0.001;

// First word choice of:
// ./wordler.mjs -l '{"strategy":"debug"}' -w ./wordleWords.mjs -s simguessmin -o '{"maxSolutionSims":1500, "maxGuessSims":1500}' -a rogue
const DEFAULT_INITIAL_GUESS = 'raise';

const FLAG_UNUSED = 0;

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

export class StrategySimGuess extends StrategyLetterTrackerRemainingAbstract {
    getSupportedOptions() {
        return [
            new StrategyOptionRate(
                'solutionSampleRate', DEFAULT_ANSWER_SAMPLE_RATE,
                'Instead of all possible solution words, randomly sample this percentage of possible solutions'),
            new StrategyOptionRate(
                'guessSampleRate', DEFAULT_GUESS_SAMPLE_RATE,
                'Instead of simulating all possible guesses, randomly sample this percentage of possible guesses'),
            new StrategyOptionInteger(
                'maxSolutionSims', FLAG_UNUSED,
                'Chose at most this many solution simulations (-1 to ignore and use ratio)'),
            new StrategyOptionInteger(
                'maxGuessSims', FLAG_UNUSED,
                'Chose at most this many guess simulations (-1 to ignore and use ratio)'),
            new StrategyOption(
                'useInitialGuess', undefined,
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'initialGuess', DEFAULT_INITIAL_GUESS,
                'Use a pre-calculated word for our first guess instead of simulating'),

            ...super.getSupportedOptions()
        ];
    }

    numSolutionSims(numPossible) {
        if (this.options.maxSolutionSims) {
            return Math.min(numPossible, this.options.maxSolutionSims);
        } else {
            return Math.ceil(numPossible * this.options.solutionSampleRate);
        }
    }

    numGuessSims(numPossible) {
        if (this.options.maxGuessSims) {
            return Math.min(numPossible, this.options.maxGuessSims);
        } else {
            return Math.ceil(numPossible * this.options.guessSampleRate);
        }

    }
    // TODO: As rate gets closer to 1, we are more likely to introduce duplicates
    // To avoid we could do a shuffle instead
    sample(arr, count) {
        let ret = [];
        for(let i=0;i<count;i++) {
            ret.push(randWord(arr));
        }

        return ret;
    }

    guess(guessNum) {

        if (guessNum === 1 && this.options.useInitialGuess) {
            Logger.log('strategy', 'debug', `Using pre-chosen initial guess '${this.options.initialGuess}'`);
            return this.options.initialGuess;
        }

        // Clear score cache
        this.scoreCache = { };
        const sampleSize = this.numSolutionSims(this.remainingWords.length);
        Logger.log('strategy', 'debug', `Sampling ${sampleSize} of ${this.remainingWords.length} remaining words`);
        const possibleGuesses = this.sample(this.remainingWords, sampleSize);
        Logger.log('strategy', 'debug', "Possible Guesses: ", possibleGuesses);
        const sortedGuesses = possibleGuesses.map(word => ( this.wordWithScore(word))).sort((a, b) => /* low to high */ a.score - b.score);
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

    /**
     * Assign a comparative score to the generated word list, given the current word list as context.
     *
     * This specific implementation aims for a word which comes as close as possible to cutting the current list in half.
     *
     * @param {*} generatedWordList List of next-step words generated in the current simulation
     * @param {*} currentWordList Current list of words (for context)
     * @returns Score suitable for comparison  with other words
     */
    scoreWordLists(generatedWordList, currentWordList) {
        const score = Math.floor(Math.abs(generatedWordList.length - currentWordList.length/2));
        Logger.log('strategy', 'trace', `Calculated score ${score} from ${generatedWordList.length} remaining wors of ${currentWordList.length}`);

        return score;
    }

    wordScoreCompare(a, b) {
        return a.score - b.score;
    }

    // TODO: Use this in the main methods (right now used when called as sub-strategy)
    // TODO: Simplify by subclassing StrategyScoringAbstract
    scoreAndSortWords(words) {
        return words.map(word => this.wordWithScore(word)).sort((a, b) => this.wordScoreCompare(a, b));
    }

    wordWithScore(word) {
        // Cache words so we get consistent results when logging, etc.
        // We clear the cache at the start of every new guess.
        if (!this.scoreCache[word]) {
            let totalScore = 0;
            const simulatedAnswers = this.sample(this.remainingWords, this.numGuessSims(this.remainingWords.length));
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

                const score = this.scoreWordLists(tempRemainingWords, this.remainingWords);
                Logger.log('strategy', 'trace', `Word ${word} answer ${ans} simulation: ${tempRemainingWords.length} words remaining of ${this.remainingWords.length}, ${score} score`);
                totalScore += score;
            }
            // Average score
            const score = totalScore / simulatedAnswers.length;
            Logger.log('strategy', 'debug', `Word '${word}' has score of ${score}`);

            this.scoreCache[word] = { word, score };
        }
        return this.scoreCache[word];
    }
}
