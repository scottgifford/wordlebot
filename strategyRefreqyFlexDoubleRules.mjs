import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqyFlexSimpleRules } from "./strategyRefreqyFlexSimpleRules.mjs";
import { WordWithScore } from "./strategyScoringAbstract.mjs";
import { charOccurrences } from "./util.mjs";

export class StrategyRefreqyFlexDoubleRules extends StrategyRefreqyFlexSimpleRules {
    constructor(words, options) {
        super(words, {
            lastTurnGuess: true, // This has been the default for this strategy, consider making it the overall default
            scoreNewLetters: true,
            scorePossible: true,
            ...options
        })
    }

    getSupportedOptions() {
        return [
            new StrategyOption(
                'updateLettersFromRemaining', false,
                'Add remaining word list to the letter tracker (experimental)'),
            new StrategyOption(
                'duplicateLetterPenalty', 1.0,
                'Penalty for duplicate letters (negative for bonus)'),

            ...super.getSupportedOptions()
        ];
    }

    scoreLetter(letter, score, letterPrevCount, wordPos, word) {
        if (this.leFreq.hasLetter(letter, letterPrevCount)) { // Similar to parent class but with prevCount passed in
            if (this.letters.minLetters(letter) === undefined || (this.letters.minLetters(letter) < charOccurrences(word, letter))) {
                // The guess has more occurrences of this letter than we know the word has (so would provide new information)
                if (!this.letters.definitelyHasLetterAtPosition('letter', wordPos)) {
                    if (letterPrevCount === (this.letters.minLetters(letter) || 0)) {
                        // This is the first new occurence of a letter we don't know about.
                        const addScore = this.leFreq.letterFrequencyAtPosition(letter, wordPos, letterPrevCount) * this.options.rightPlaceMultiplier
                            + this.leFreq.letterFrequency(letter, letterPrevCount)
                            - letterPrevCount * this.options.duplicateLetterPenalty; // Kind of an arbitrary penalty, but a score of 1 is better than a score of 0.
                        score.addScore(letter, `/${letterPrevCount}@${wordPos}`, addScore);
                        score.newLetters++;
                    } else if (letterPrevCount > (this.letters.minLetters(letter) || 0)) {
                        // This is an additional new occurrence of a letter when we don't yet know if the previous occurrence is here!
                        // The value of this is lower, but it is not 0; it is better to guess an extra occurrence early than to guess
                        // a letter we already know is or isn't in the word.
                        // So just give this a very low score, instead of a 0
                        score.addScore(letter, `/${letterPrevCount}@${wordPos}`, 0.5);
                    }
                }
            }
        } else {
            Logger.log('score', 'trace', `No score for letter ${wordPos} in word ${word}`);
        }
    }

    flexFreq() {
        Logger.log('strategy', 'debug', `StrategyRefreqyFlexDoubleRules reFreq`);

        if (this.options.updateLettersFromRemaining) {
            // Possible improvement to update letter info based on remaining possibilities
            // In experimentation, this does not make this strategy more accurate,
            // but it does change the words we can't solve for a bit.
            this.letters.updateFromRemaining(this.remainingWords);
        }

        // Our goal here is to eliminate letter guesses that will not give us any new information.
        // We definitely want to eliminate letters that we know for sure are not in the word, they will teach us nothing.
        // Flex2 also filters out letters we know for sure are in the word at least once, but that doesn't account for double letters.
        // Here, if we know a letter is in the word at least once, we only want to consider possibilities where it is there more than once
        // Or more generally, if we know a letter is in the word at least n times, we only want to consider possibilities where it is there more than n times.
        // The getEntryAdjustedLetterCount method will adjust the score to do that.
        const newFreq = this.leFreq.cloneMap(([k,v]) => {
            if (this.letters.definitelyDoesNotHaveLetter(k)) {
                Logger.log('freq','trace',`Removing entry for '${k}' since it it definitely not in the word`);
                return [k, undefined];
            }
            // We don't filter for definitelyHasLetter because the below will zero out the score in a way that better handles double/triple letters
            Logger.log('freq','trace',`Adjusting letter count for '${k}' based on prevCount=${this.letters.minLetters(k)}`);

            return [k, this.leFreq.getEntryAdjustedLetterCount(k, this.letters.minLetters(k))];
        });
        this.logTopLetters(newFreq);
        return newFreq;
    }
}
