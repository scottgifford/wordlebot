import { Strategy } from "./strategy.mjs";
import { LetterTracker } from "./letterTracker.mjs";

const RIGHT_PLACE_MULTIPLIER = 3; // Determined experimentally, though doesn't seem to matter much
export class StrategyFreqy extends Strategy {
    constructor(words) {
        super(words);
        this.remainingWords = words;
        this.letters = new LetterTracker();
        this.leFreq = StrategyFreqy.frequencyAnalyze(words);
    }

    guess() {
        return this.remainingWords.map(word => ({ word, score: this.scoreWord(word)})).sort((a, b) => /* reverse sort */ b.score - a.score)[0].word;
    }

    update(guess, result) {
        this.letters.update(guess, result);

        this.remainingWords = this.remainingWords.filter(word => this.letters.wordHasLetters(word));
        console.log(`${this.remainingWords.length} possibilities left`)
    }

    static frequencyAnalyze(words) {
        let freq = { };
        for(let i=0;i<words.length;i++) {
            const word = words[i];
            for(let j=0;j<word.length;j++) {
                const letter = word[j];
                if (!freq[letter]) {
                    freq[letter] = [0, 0, 0, 0, 0];
                }
                freq[letter][j]++;
            }
        }
        return freq;
    }
    
    scoreWord(word) {
        let score = 0;
        let picked = { };
        for(let i=0;i<word.length;i++) {
            const letter = word[i];
            if (!picked[letter]) {            
                // Score is 0 if we have already picked the letter once
                score += this.leFreq[letter][i] * RIGHT_PLACE_MULTIPLIER;
                score += this.leFreq[letter].reduce((sum, cur) => sum + cur);
            } else {
                // console.log(`No score for letter ${i} in word ${word}`);
            }
            picked[letter] = (picked[letter] || 0) + 1;
        }
        // console.log(`Score for ${word} is ${score}`);
        return score;
    }
}