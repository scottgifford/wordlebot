import { StrategyOption, StrategyOptionInteger, StrategyOptionRate } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { takeGuess } from "./util.mjs";
import { Logger } from "./log.mjs";
import { StrategyLetterTrackerRemainingAbstract } from "./StrategyLetterTrackerRemainingAbstract.mjs";

const DEFAULT_ANSWER_SAMPLE_RATE = 0.001;
const DEFAULT_GUESS_SAMPLE_RATE = 0.001;

// First word choice of:
// ./wordler.mjs -l '{"strategy":"debug"}' -w ./wordleWords.mjs -s simguessmin -o '{"maxSolutionSims":1500, "maxGuessSims":1500}' -a rogue
const DEFAULT_INITIAL_GUESS = 'raise';

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

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

    reset() {
        super.reset();
        // These are set on each guess(), but initialize here in case that method is not used
        this.scoreCache = { };
        this.guessNum = 1;
        return true;
    }

    getSupportedOptions() {
        return [
            new StrategyOptionRate(
                'solutionSampleRate', DEFAULT_ANSWER_SAMPLE_RATE,
                'Instead of all possible solution words, randomly sample this percentage of possible solutions'),
            new StrategyOptionRate(
                'guessSampleRate', DEFAULT_GUESS_SAMPLE_RATE,
                'Instead of simulating all possible guesses, randomly sample this percentage of possible guesses'),
            new StrategyOptionRate(
                'guessSampleAllWords', undefined,
                'Choose possible guesses from all words instead of only remaining words, if truthy'),
            new StrategyOptionRate(
                'guessSamplePossibleRatio', undefined,
                'Maximum number of remaining possibilities before switching from flex word to possible word'),
            new StrategyOptionInteger(
                'maxSolutionSims', undefined,
                'Chose at most this many solution simulations (0 to ignore and use ratio)'),
            new StrategyOptionInteger(
                'maxGuessSims', undefined,
                'Chose at most this many guess simulations (0 to ignore and use ratio)'),
            new StrategyOption(
                'useInitialGuess', undefined,
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'initialGuess', DEFAULT_INITIAL_GUESS,
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'samplingRandom', true,
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'samplingOffset', false,
                'If samplingRandom is off, offset the sampled words by turn number, to avoid having the same list every time'),
            // TODO: This is duplicated from elsewhere, can we refactor?
            new StrategyOption(
                'lastTurnGuess', true,
                'If we are on (or past) the last turn, always guess a real possibility instead of a flex word'),
            // TODO: This is duplicated from elsewhere, can we refactor?
            new StrategyOptionInteger(
                'remainingWordsThreshold', 2,
                'Maximum number of remaining possibilities before switching from flex word to possible word'),

            ...super.getSupportedOptions()
        ];
    }


    shouldUseFullGuessWordList(guessNum) {
        if (!this.options.guessSampleAllWords) {
            Logger.log('strategy', 'debug', `Sampling remaining words for guesses, becasue guessSampleAllWords=${this.options.guessSampleAllWords} (falsy)`);
            return false;
        } else if (this.remainingWords.length <= this.options.remainingWordsThreshold) {
            Logger.log('strategy', 'debug', `Sampling remaining words for guesses, because remainingWords ${this.remainingWords} < remainingWordsThreshold ${this.options.remainingWordsThreshold}`);
            return false;
        } else if (this.options.lastTurnGuess && this.isLastGuess(guessNum)) {
            Logger.log('strategy', 'debug', `Sampling remaining words for guesses, because ${this.options.lastTurnGuess} is truthy and guessNum ${guessNum} is our last guess`);
            return false;
        }

        Logger.log('strategy', 'debug', `Sampling all words for guesses, because guessSampleAllWords ${this.options.guessSampleAllWords} is truthy and no exceptions apply`);
        return true
    }

    generateGuesses(guessNum) {
        if (this.options.guessSamplePossibleRatio === undefined) {
            const samplePool = this.guessWordList(guessNum);
            const sampleSize = this.numGuessSims(samplePool.length);
            Logger.log('strategy', 'debug', `Sampling ${sampleSize} guesses of ${samplePool.length} possible`);
            const ret = this.sample(samplePool, sampleSize, guessNum);
            return ret;
        } else {
            const sampleSize = this.numGuessSims(this.words.length);
            const possibleWordsSampleCount = Math.min(Math.ceil(sampleSize * this.options.guessSamplePossibleRatio), this.remainingWords.length);
            const possibleWordsSample = this.sample(this.remainingWords, possibleWordsSampleCount);
            Logger.log('strategy', 'trace', `sampleSize=${sampleSize}, possibleWordsSampleCount=${possibleWordsSampleCount}, possibleWordsSample.length=${possibleWordsSample.length}`);
            const allWordSampleCount = sampleSize - possibleWordsSampleCount;
            const allWordSample = this.sample(this.words, allWordSampleCount);
            Logger.log('strategy', 'trace', `sampleSize=${sampleSize}, allWordSampleCount=${allWordSampleCount}, allWordSample.length=${allWordSample.length}`);
            const ret = [...possibleWordsSample, ...allWordSample];
            Logger.log('strategy', 'trace', `guessSamplePossibleRatio=${this.options.guessSamplePossibleRatio}, returning ${ret.length} total, ${possibleWordsSample.length} possible + ${allWordSample.length} other`);
            return ret;
        }
    }


    guessWordList(guessNum) {
        if (this.shouldUseFullGuessWordList(guessNum)) {
            return this.words;
        } else {
            return this.remainingWords;
        }
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

    sample(arr, count) {
        if (this.options.samplingRandom) {
            return this.randomSample(arr, count);
        } else {
            return this.deterministicSample(arr, count);
        }
    }

    // TODO: As rate gets closer to 1, we are more likely to introduce duplicates
    // To avoid we could do a shuffle instead
    randomSample(arr, count) {
        let ret = [];
        for(let i=0;i<count;i++) {
            ret.push(randWord(arr));
        }

        return ret;
    }

    deterministicSample(arr, count) {
        let ret = [ ];
        // Start list at guessNum-1 so it's not the same list every time
        const start = Math.min(this.guessNum-1, arr.length);
        const incr = arr.length / count;


        Logger.log('strategy', 'trace', `Choosing a deterministic sample of ${count}/${arr.length} words, with start=${start} and incr=${incr}`);


        for(let i=start;ret.length < count;i += incr) {
            const wordNum = Math.floor(i) % arr.length;
            const word = arr[wordNum];
            Logger.log('strategy', 'trace', `Sample word #${wordNum}: '${word}'`);
            ret.push(word);
        }
        return ret;
    }

    // TODO: Move up to Strategy class
    isLastGuess(guessNum) {
        return guessNum >= NUM_GUESSES;
    }

    guess(guessNum) {
        this.guessNum = guessNum;
        if (guessNum === 1 && this.options.useInitialGuess) {
            Logger.log('strategy', 'debug', `Using pre-chosen initial guess '${this.options.initialGuess}'`);
            return this.options.initialGuess;
        }

        // Clear score cache
        this.scoreCache = { };
        const possibleGuesses = this.generateGuesses(guessNum);
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
        // TODO: Add option to prefer possible words (or get from superclass)
        return words.map(word => this.wordWithScore(word)).sort((a, b) => this.wordScoreCompare(a, b));
    }

    wordWithScore(word) {
        // Cache words so we get consistent results when logging, etc.
        // We clear the cache at the start of every new guess.
        if (!this.scoreCache[word]) {
            let totalScore = 0;

            const numAnswersToSimulate = this.numSolutionSims(this.remainingWords.length);
            const simulatedAnswers = this.sample(this.remainingWords, numAnswersToSimulate);
            Logger.log('strategy', 'debug', `Simulating ${simulatedAnswers.length} (${numAnswersToSimulate}) answers of ${this.remainingWords.length} remaining words`);
            for(let i=0;i<simulatedAnswers.length;i++) {
                //   For each word "a" is too slow, instead sample.
                const ans = simulatedAnswers[i];
                Logger.log('strategy', 'trace', `Word #${i} is '${word}'`);

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
