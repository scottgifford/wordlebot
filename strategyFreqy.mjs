import { Strategy } from "./strategy.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { FrequencyAnalysis } from "./freq.mjs";
import { Logger } from "./log.mjs";

const RIGHT_PLACE_MULTIPLIER = 3; // Determined experimentally, though doesn't seem to matter much
const LOG_REMAINING_WORDS_THRESHOLD = 20; // When this many or fewer words or left, log the list of possibilties
const LOG_TOP_N_SCORES = 10; // Log this many top scores

/** Frequency analyzer strategy.
 *
 * Do a frequency analysis of all possible words, then score words based on the frequency analysis,
 * and choose the highest score of a word which is a remaining possibility.
 */
export class StrategyFreqy extends Strategy {
    constructor(words, options) {
        super(words, options);
        this.remainingWords = words;
        this.letters = new LetterTracker();
        this.leFreq = StrategyFreqy.frequencyAnalyze(words);
        Logger.log('freq', 'debug', `FrequencyAnalysis:\n${this.leFreq.debugString()}`);
    }

    static frequencyAnalyze(words) {
        return new FrequencyAnalysis(words);
    }

    guess(guessNum) {
        return this.bestWord(this.remainingWords, this.leFreq);
    }

    update(guess, result) {
        this.letters.update(guess, result);

        Logger.log('strategy', 'debug', `${this.remainingWords.length} possible words before filtering`);
        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        Logger.log('strategy', 'info', `${this.remainingWords.length} possibilities left`);

        if (this.remainingWords.length === 0) {
            throw new Error('No remaining possibilities, giving up');
        }
        if (this.remainingWords.length < LOG_REMAINING_WORDS_THRESHOLD) {
            Logger.log('strategy', 'info', this.remainingWords.map((word) => { return { word, score: this.scoreWord(word, this.leFreq) } }));
        }

    }

    bestWord(words, freq) {
        Logger.log('strategy', 'info', `Choosing best word from ${words.length} possibilities`);
        const scores = words.map(word => ({ word, score: this.scoreWord(word, freq)})).sort((a, b) => /* reverse sort */ b.score - a.score);
        Logger.log('strategy', 'info', `Choosing best score from ${scores.length} possibilities`);
        Logger.log('score', 'debug', `Top ${LOG_TOP_N_SCORES} Scores:`, scores.slice(0,LOG_TOP_N_SCORES));
        return scores[0].word;
    }

    /** Score a word with the given frequency table.
     *
     * For each letter in the given word, award one point for every time it occurs anywhere in the frequency table,
     * and RIGHT_PLACE_MULTIPLIER points for every time it occurs at the gussed position in the frequency table.
     * Only score each letter once when it is in a solution; additional occurrences are scored at 0
     * (otherwise we would try to pick a word a word with as many frequently-seen letters as possible, e.g. "seres";
     * disable this behavior by setting strategy option `scoreDuplicateLetters` to a truthy value.
     */
    scoreWord(word, freq) {
        let score = 0;
        let picked = { };
        for(let i=0;i<word.length;i++) {
            const letter = word[i];
            if (!picked[letter] && freq.hasLetter(letter)) {
                // Score is 0 if we have already picked the letter once
                score += freq.letterFrequencyAtPosition(letter, i) * RIGHT_PLACE_MULTIPLIER;
                score += freq.letterFrequency(letter);
            } else {
                Logger.log('score', 'trace', `No score for letter ${i} in word ${word}`);
            }
            if (!this.options.scoreDuplicateLetters) {
                picked[letter] = (picked[letter] || 0) + 1;
            }
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score}`);
        return score;
    }
}