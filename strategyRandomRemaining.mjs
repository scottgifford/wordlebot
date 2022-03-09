import { Strategy } from "./strategy.mjs";
import { randWord } from "./util.mjs";
import { LetterTracker } from "./letterTracker.mjs";
import { Logger } from "./log.mjs";
import { StrategyLetterTrackerRemainingAbstract } from "./strategyLetterTrackerRemainingAbstract.mjs";

export class StrategyRandomRemaining extends StrategyLetterTrackerRemainingAbstract {
    guess() {
        const guess = randWord(this.remainingWords);
        super.guessLog();
        return guess;
    }
}