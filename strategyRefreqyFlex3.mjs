import { FrequencyAnalysis } from "./freq.mjs";
import { StrategyRefreqyFlex2 } from "./strategyRefreqyFlex2.mjs";
import { charOccurrences } from "./util.mjs";

const RIGHT_PLACE_MULTIPLIER = 1; // Determined experimentally, though doesn't seem to matter much

export class StrategyRefreqyFlex3 extends StrategyRefreqyFlex2 {
    // TODO: CopyPasta from StrategyFreqy, refactor to avoid needing this
    scoreWord(word, freq) {
        let score = 0;
        let prevCount = { };
        for(let i=0;i<word.length;i++) {
            const letter = word[i];
            if (prevCount[letter] === undefined) {
                prevCount[letter] = 0;
            }
            if (freq.hasLetter(letter, prevCount[letter])) {
                if (this.letters.minLetters(letter) === undefined || (this.letters.minLetters(letter) < charOccurrences(word, letter))) {
                    score += freq.letterFrequencyAtPosition(letter, i, prevCount[letter]) * RIGHT_PLACE_MULTIPLIER;
                    score += freq.letterFrequency(letter, prevCount[letter]);
                }
            } else {
                // console.log(`No score for letter ${i} in word ${word}`);
            }
            prevCount[letter]++;
        }
        // console.log(`Score for ${word} is ${score}`);
        return score;
    }

    reFreq() {
        // Our goal here is to eliminate letter guesses that will not give us any new information.
        // We definitely want to eliminate letters that we know for sure are not in the word, they will teach us nothing.
        // Flex2 also filters out letters we know for sure are in the word at least once, but that doesn't account for double letters.
        // Here, if we know a letter is in the word at least once, we only want to consider possibilities where it is there more than once
        // Or more generally, if we know a letter is in the word at least n times, we only want to consider possibilities where it is there more than n times.

        return this.leFreq.cloneMap(([k,v]) => {
            if (this.letters.definitelyDoesNotHaveLetter(k)) {
                return [k, undefined];
            }
            return [k, this.leFreq.getEntryAdjustedLetterCount(k, this.letters.minLetters(k))];
        });
    }
}
