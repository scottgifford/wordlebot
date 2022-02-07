import { Strategy } from "./strategy.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { FrequencyAnalysis } from "./freq.mjs";
import { Logger } from "./log.mjs";

const RIGHT_PLACE_MULTIPLIER = 3; // Determined experimentally, though doesn't seem to matter much
export class StrategyFreqy extends Strategy {
    constructor(words) {
        super(words);
        this.remainingWords = words;
        this.letters = new LetterTracker();
        this.leFreq = StrategyFreqy.frequencyAnalyze(words);
        Logger.log('freq', 'debug', `FrequencyAnalysis:\n${this.leFreq.debugString()}`);
    }

    static frequencyAnalyze(words) {
        return new FrequencyAnalysis(words);
    }

    guess() {
        return this.bestWord(this.remainingWords, this.leFreq);
    }

    update(guess, result) {
        this.letters.update(guess, result);
        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));

        Logger.log('strategy', 'info', `${this.remainingWords.length} possibilities left`);
        if (this.remainingWords.length < 20) {
            Logger.log('strategy', 'info', this.remainingWords);
        }

    }

    bestWord(words, freq) {
        const scores = words.map(word => ({ word, score: this.scoreWord(word, freq)})).sort((a, b) => /* reverse sort */ b.score - a.score);
        Logger.log('score', 'debug', 'Top 10 Scores:', scores.slice(0,10));
        return scores[0].word;
    }

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
            picked[letter] = (picked[letter] || 0) + 1;
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score}`);
        return score;
    }
}