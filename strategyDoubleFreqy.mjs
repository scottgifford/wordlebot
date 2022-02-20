import { Logger } from "./log.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";
import { WordWithScore } from "./strategyScoringAbstract.mjs";

export class StrategyDoubleFreqy extends StrategyFreqy {
    // TODO: Update docs

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
            if (this.leFreq.hasLetter(letter)) {
                // Score is 0 if we have already picked the letter once
                score.addScore(letter, `/${letterPrevCount}@${i}`, this.leFreq.letterFrequencyAtPosition(letter, i, letterPrevCount) * this.options.rightPlaceMultiplier);
                score.addScore(letter, `/${letterPrevCount}`, this.leFreq.letterFrequency(letter, letterPrevCount));
            } else {
                Logger.log('score', 'trace', `No score for letter ${i} in word ${word}`);
            }
            prevCount[letter] = letterPrevCount + 1;
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score.score}: ${score.debug}`);
        return score;
    }
}