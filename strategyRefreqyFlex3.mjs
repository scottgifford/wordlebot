import { FrequencyAnalysis } from "./freq.mjs";
import { Logger } from "./log.mjs";
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
            Logger.log('strategy', 'trace', `${letter}: prevCount=${prevCount[letter]}, minLetters=${this.letters.minLetters(letter) || 0}`);
            if (freq.hasLetter(letter, prevCount[letter])) {
                if (this.letters.minLetters(letter) === undefined || (this.letters.minLetters(letter) < charOccurrences(word, letter))) {
                    if (!this.letters.definitelyHasLetterAtPosition('letter', i)) {
                        if (prevCount[letter] == (this.letters.minLetters(letter) || 0)) {
                            // This is the first new occurence of a letter we don't know about.
                            score += freq.letterFrequencyAtPosition(letter, i, prevCount[letter]) * RIGHT_PLACE_MULTIPLIER;
                            score += freq.letterFrequency(letter, prevCount[letter]) - prevCount[letter] /* subtract for the letters we already know about */;
                        } else {
                             // This is an additional new occurrence of a letter when we don't yet know if the previous occurrence is here!
                             // The value of this is lower, but it is not 0; it is better to guess an extra occurrence early than to guess
                             // a letter we already know is or isn't in the word.
                             // So just give this a very low score, instead of the 0 score in v4-
                             score += 0.5;
                        }
                    }
                }
            } else {
                Logger.log('score', 'trace', `No score for letter ${i} in word ${word}`);
            }
            prevCount[letter]++;
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score}`);
        return score;
    }

    reFreq() {
        // Our goal here is to eliminate letter guesses that will not give us any new information.
        // We definitely want to eliminate letters that we know for sure are not in the word, they will teach us nothing.
        // Flex2 also filters out letters we know for sure are in the word at least once, but that doesn't account for double letters.
        // Here, if we know a letter is in the word at least once, we only want to consider possibilities where it is there more than once
        // Or more generally, if we know a letter is in the word at least n times, we only want to consider possibilities where it is there more than n times.

        const newFreq = this.leFreq.cloneMap(([k,v]) => {
            if (this.letters.definitelyDoesNotHaveLetter(k)) {
                return [k, undefined];
            }
            return [k, this.leFreq.getEntryAdjustedLetterCount(k, this.letters.minLetters(k))];
        });
        Logger.dynLog('strategy', 'debug', () => {
            const TOP_N_LETTERS = 10;
            return [
                `Top ${TOP_N_LETTERS} letters`,
                newFreq.getAllLetters()
                .flatMap((letter) => {
                    return [0, 1, 2, 3, 4, 5].map((prevCount) => {
                        return [`${letter}/${prevCount}`, newFreq.letterFrequency(letter, prevCount) - prevCount]
                    })
                })
                .sort((a, b) => b[1]-a[1])
                .filter((val, index) => index < TOP_N_LETTERS),
            ]
        })
        return newFreq;
    }
}
