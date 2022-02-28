import { Logger } from "./log.mjs";
import { StrategyOption } from "./strategy.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategyRefreqyFlexAbstract } from "./strategyRefreqyFlexAbstract.mjs";

const DEFAULT_SCORE_RATIO = 0.30;

const NUM_GUESSES = 6; // Game rule, should really be in some other layer

/**
 * Frequency-analyzer based strategy, with the flexibility to choose words that are not remaining possible
 * solutions if the strategy decides they will reveal more information.
 */
export class StrategyRefreqyFlex extends StrategyRefreqyFlexAbstract {
    getSupportedOptions() {
        return [
            new StrategyOption(
                'scoreRatio', DEFAULT_SCORE_RATIO,
                'If the flex word has a score this multiple of the possible word, choose the flex word'
            ),
            ...super.getSupportedOptions()
        ];
    }

    shouldUseFlexWord(flexWordAndScore, remainingWordAndScore, guessNum) {
        if (this.options.lastTurnGuess && this.isLastGuess(guessNum)) {
            Logger.log('strategy', 'debug', `Should use remaining word, based on: (guessNum=${guessNum} >= ${NUM_GUESSES})`);
            return false;
        }

        const scoreRatio = flexWordAndScore.score / remainingWordAndScore.score;
        return scoreRatio > this.options.scoreRatio;
    }
}
