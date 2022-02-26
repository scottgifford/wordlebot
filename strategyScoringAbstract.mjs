import { Logger } from "./log.mjs";
import { Strategy, StrategyOption, StrategyOptionInteger } from "./strategy.mjs";
import { StrategyLetterTrackerRemainingAbstract } from "./StrategyLetterTrackerRemainingAbstract.mjs";

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

export class StrategyScoringAbstract extends StrategyLetterTrackerRemainingAbstract {
    getSupportedOptions() {
        return [
            new StrategyOptionInteger(
                'logTopNScores', DEFAULT_LOG_TOP_N_SCORES,
                'Number of top-scoring words to log at strategy/debug'),
            new StrategyOption(
                'extraScoreWords', undefined,
                'Additional words to score for debugging, at score/debug',
                (v) => { if (!Array.isArray(v)) { throw new Error(`Value must be an array of words`)} }
            ),
            ...super.getSupportedOptions()
        ];
    }

    guess(guessNum) {
        // Use cached first guess, it will always be the same
        if (this.resetCache && this.resetCache.guess) {
            return this.resetCache.guess;
        }
        const guess = this.bestWord(this.remainingWords, this.leFreq);
        // Cache first guess, it will always be the same
        if (guessNum == 1 && this.options['resettable']) {
            this.resetCache.guess = guess;
        }

        super.guessLog();
        return guess;
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
    wordWithScore(word) {
        throw new Error('Not implemented, abstract class');
    }

    wordScoreCompare(a, b) {
        return b.score - a.score; // Reverse sort, highest to lowest
    }

    scoreAndSortWords(words) {
        return words.map(word => this.wordWithScore(word)).sort((a, b) => this.wordScoreCompare(a, b));
    }

    bestWordWithScore(words) {
        const scores = this.scoreAndSortWords(words);
        Logger.log('score', 'debug', `Top ${this.options.logTopNScores} Scores:\n`, scores.slice(0,this.options.logTopNScores).map((s) => JSON.stringify(s)).join(",\n"));
        if (this.options.extraScoreWords) {
            Logger.log('score', 'debug', 'Extra word scores:',this.scoreAndSortWords(this.options.extraScoreWords).map((s) => JSON.stringify(s)).join(",\n"));
        }
        return scores[0];
    }

    bestWord(words) {
        return this.bestWordWithScore(words).word;
    }
}
