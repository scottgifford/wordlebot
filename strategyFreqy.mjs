import { LetterTracker } from "./letterTracker.mjs";
import { FrequencyAnalysis } from "./freq.mjs";
import { Logger } from "./log.mjs";
import { StrategyScoringAbstract, WordWithScore } from "./strategyScoringAbstract.mjs";

const DEFAULT_RIGHT_PLACE_MULTIPLIER = 3; // Determined experimentally, though doesn't seem to matter much
const DEFAULT_LOG_N_REMAINING_WORDS = 20; // When this many or fewer words or left, log the list of possibilties
const DEFAULT_LOG_TOP_N_SCORES = 10; // Log this many top scores

/** Frequency analyzer strategy.
 *
 * Do a frequency analysis of all possible words, then score words based on the frequency analysis,
 * and choose the highest score of a word which is a remaining possibility.
 */
export class StrategyFreqy extends StrategyScoringAbstract {
    constructor(words, options) {
        super(words, {
            rightPlaceMultiplier: DEFAULT_RIGHT_PLACE_MULTIPLIER,
            logTopNScores: DEFAULT_LOG_TOP_N_SCORES,
            logNRemainingWords: DEFAULT_LOG_N_REMAINING_WORDS,
            ...options
        });
        this.remainingWords = words;
        this.leFreq = options.freq ? options.freq : StrategyFreqy.frequencyAnalyze(words);
        this.letters = options.letters ? options.letters : new LetterTracker();
        Logger.log('freq', 'debug', `FrequencyAnalysis:\n${this.leFreq.debugString()}`);
    }

    static frequencyAnalyze(words) {
        return new FrequencyAnalysis(words);
    }

    guessLog() {
        super.guessLog();
        // TODO: That 5 should be in another layer somewhere
        Logger.log('strategy', 'info', `Know ${this.letters.knownLetters()} / 5 letters`);
    }

    update(guess, result) {
        this.letters.update(guess, result);

        Logger.log('strategy', 'debug', `${this.remainingWords.length} possible words before filtering`);
        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));

        if (this.remainingWords.length === 0) {
            throw new Error('No remaining possibilities, giving up');
        }

        this.updateLog();
    }

    updateLog() {
        super.updateLog();
        Logger.log('strategy', 'debug', this.letters.debugString());
        Logger.log('strategy', 'info', `${this.remainingWords.length} possibilities left`);
        if (this.remainingWords.length <= this.options.logNRemainingWords) {
            Logger.dynLog('strategy', 'debug', () => "Remaining possibilities:\n" + this.remainingWords.map(word => JSON.stringify(this.wordWithScore(word))).join("\n"));
        }
    }

    /** Score a word with the given frequency table.
     *
     * For each letter in the given word, award one point for every time it occurs anywhere in the frequency table,
     * and RIGHT_PLACE_MULTIPLIER points for every time it occurs at the gussed position in the frequency table.
     * Only score each letter once when it is in a solution; additional occurrences are scored at 0
     * (otherwise we would try to pick a word a word with as many frequently-seen letters as possible, e.g. "seres";
     * disable this behavior by setting strategy option `scoreDuplicateLetters` to a truthy value.
     */
    wordWithScore(word) {
        let score = new WordWithScore(word);
        let prevCount = { };
        for(let i=0;i<word.length;i++) {
            const letter = word[i];
            const letterPrevCount = prevCount[letter] || 0;
            if (letterPrevCount === 0 || this.options.scoreDuplicateLetters || this.options.useDoubleFreq) {
                // If the above isn't true, score for this letter will effectively be 0.
                if (this.leFreq.hasLetter(letter)) {
                    const effectivePrevCount = this.options.useDoubleFreq ? letterPrevCount : 0;
                    score.addScore(letter, `@${i}`, this.leFreq.letterFrequencyAtPosition(letter, i, effectivePrevCount) * this.options.rightPlaceMultiplier);
                    score.addScore(letter, '', this.leFreq.letterFrequency(letter, effectivePrevCount));
                } else {
                    Logger.log('score', 'trace', `No score for letter #${i} in word ${word}`);
                }
            }
            prevCount[letter] = letterPrevCount + 1;
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score.score}: ${score.debug}`);
        return score;
    }
}