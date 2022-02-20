import { Logger } from "./log.mjs";
import { Strategy } from "./strategy.mjs";

const DEFAULT_LOG_TOP_N_SCORES = 10; // Log this many top scores

export class WordWithScore {
    constructor(word) {
        this.word = word;
        this.debug = "";
        this.score = 0;
    }

    addDebugString(string) {
        this.debug += ' ' + string;
    }

    addScore(letter, annotation, score) {
        this.addDebugString(`${letter}${annotation}${score > 0 ? '+' : ''}${score}`);
        this.score += score;
    }
}

export class StrategyScoringAbstract extends Strategy {
    constructor(words, options) {
        super(words, {
            logTopNScores: DEFAULT_LOG_TOP_N_SCORES,
            ...options
        });
    }

    guess(guessNum) {
        return this.bestWord(this.remainingWords, this.leFreq);
    }

    // TODO: Deprecate
    scoreWord(word, freq) {
        return this.wordWithScore(word, freq).score;
    }

    /**
     * Score the given word.
     * 
     * @param {score} word Word to score
     * @returns {WordWithScore} Word with score object
     */
    wordWithScore(word, freq) {
        throw new Error('Not implemented, abstract class');
    }

    scoreAndSortWords(words, freq) {
        return words.map(word => this.wordWithScore(word, freq)).sort((a, b) => {
            return b.score - a.score  // Reverse sort, highest to lowest
        });
    }

    bestWord(words, freq) {
        const scores = this.scoreAndSortWords(words, freq);
        Logger.log('score', 'debug', `Top ${this.options.logTopNScores} Scores:`, scores.slice(0,this.options.logTopNScores).map((s) => JSON.stringify(s)).join(",\n"));
        if (this.options.extraScoreWords) {
            Logger.log('score', 'debug', 'Extra word scores:',this.scoreAndSortWords(this.options.extraScoreWords, freq).map((s) => JSON.stringify(s)).join(",\n"));
        }
        return scores[0].word;
    }
}