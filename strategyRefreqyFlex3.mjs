import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqyFlex2 } from "./strategyRefreqyFlex2.mjs";
import { WordWithScore } from "./strategyScoringAbstract.mjs";
import { charOccurrences } from "./util.mjs";

// TODO: Turn these into options
const NUM_GUESSES = 6; // Game rule, should really be in some other layer

export class StrategyRefreqyFlex3 extends StrategyRefreqyFlex2 {
    getSupportedOptions() {
        return [
            new StrategyOption(
                'lastTurnGuess', true,
                'If we are on (or past) the last turn, always guess a real possibility instead of a flex word'),
            ...super.getSupportedOptions()
        ];
    }

    wordWithScore(word) {
        let score = new WordWithScore(word);
        score.newLetters = 0;
        score.possible = this.letters.wordHasLetters(word) ? 1 : 0;

        let prevCount = { };
        for(let i=0;i<word.length;i++) {
            const letter = word[i];
            const letterPrevCount = prevCount[letter] || 0;
            // Above here, method is the same as in parent class.
            // TODO: Factor out interior part?  And simplify logic?
            if (this.leFreq.hasLetter(letter, letterPrevCount)) { // Similar to parent class but with prevCount passed in
                if (this.letters.minLetters(letter) === undefined || (this.letters.minLetters(letter) < charOccurrences(word, letter))) {
                    // The guess has more occurrences of this letter than we know the word has (so would provide new information)
                    if (!this.letters.definitelyHasLetterAtPosition('letter', i)) {
                        if (letterPrevCount == (this.letters.minLetters(letter) || 0)) {
                            // This is the first new occurence of a letter we don't know about.
                            const addScore = this.leFreq.letterFrequencyAtPosition(letter, i, letterPrevCount) * this.options.rightPlaceMultiplier +
                                this.leFreq.letterFrequency(letter, letterPrevCount) - letterPrevCount /* subtract for the letters we already know about */;
                            score.addScore(letter, `/${letterPrevCount}@${i}`, addScore);
                            score.newLetters++;
                        } else if (letterPrevCount > (this.letters.minLetters(letter) || 0)) {
                            // This is an additional new occurrence of a letter when we don't yet know if the previous occurrence is here!
                            // The value of this is lower, but it is not 0; it is better to guess an extra occurrence early than to guess
                            // a letter we already know is or isn't in the word.
                            // So just give this a very low score, instead of the 0 score in v4-
                            score.addScore(letter, `/${letterPrevCount}@${i}`, 0.5);
                        }
                    }
                }
            } else {
                Logger.log('score', 'trace', `No score for letter ${i} in word ${word}`);
            }
            // Below here this is the same as parent method
            prevCount[letter] = letterPrevCount + 1;
        }
        Logger.log('score', 'trace', `Score for ${word} is ${score.score}: ${score.debug}`);
        return score;
    }

    wordScoreCompare(a, b) {
        return super.wordScoreCompare(a, b) || // Reverse sort, highest to lowest
            b.newLetters - a.newLetters || // Reverse sort, highest to lowest
            b.possible - a.possible; // Reverse sort, highest to lowest
    }

    shouldUseBrandNewGuess(guessNum) {
        if (this.options.lastTurnGuess && guessNum >= NUM_GUESSES) {
            Logger.log('score', 'info', `Last guess ${guessNum} / ${NUM_GUESSES}, considering only possible words`);
            return false;
        }
        return super.shouldUseBrandNewGuess(guessNum);
    }

    reFreq() {
        Logger.log('strategy', 'debug', `RefreqyFlex3 reFreq`);

        // v6+: Update letter info based on remaining possibilities (does this actually help?!  Try it as an option)
        this.letters.updateFromRemaining(this.remainingWords);

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
        // TODO: This is useful for other strategies too, is there somewhere we can put it to use across strategies?
        Logger.dynLog('strategy', 'debug', () => {
            const TOP_N_LETTERS = 10;
            return [
                `Top ${TOP_N_LETTERS} letters`,
                newFreq.getAllLetters()
                .flatMap((letter) => {
                    return [0, 1, 2, 3, 4, 5].map((prevCount) => {
                        return [`${letter}${prevCount}`, newFreq.letterFrequency(letter, prevCount) - prevCount]
                    })
                })
                .sort((a, b) => b[1]-a[1])
                .filter((val, index) => index < TOP_N_LETTERS),
            ]
        })
        return newFreq;
    }
}
