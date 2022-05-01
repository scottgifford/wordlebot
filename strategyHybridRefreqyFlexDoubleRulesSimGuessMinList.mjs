import { Logger } from "./log.mjs";
import { StrategyOption, StrategyOptionInteger } from "./strategy.mjs";
import { StrategyRefreqyFlexDoubleRules } from "./strategyRefreqyFlexDoubleRules.mjs";
import { StrategySimGuessMinList } from "./strategySimGuessMinList.mjs";

const DEFAULT_INITIAL_GUESS = 'tares';

export class StrategyHybridRefreqyFlexDoubleRulesSimGuessMinList extends StrategyRefreqyFlexDoubleRules {
    getSupportedOptions() {
        return [
            new StrategyOptionInteger(
                'topWords', 100,
                'Choose this many top words to send to simulation'),
            new StrategyOptionInteger(
                'maxGuessSims', 100,
                'Chose at most this many guess simulations (-1 to ignore and use ratio)'),
            new StrategyOption(
                'useInitialGuess', true,
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'initialGuess', DEFAULT_INITIAL_GUESS,
                'Pre-calculated initial guess, if useInitialGuess option is given.'),
            new StrategyOption(
                'samplingRandom', true,
                'Use random sampling; if set to false, will use a deterministic approach for repeatable results.'),

            ...super.getSupportedOptions()
        ];
    }

    chooseFlexWordAndScore() {
        const flexWordSubStrategy = this.newSubStrategy(this.words, this.flexFreq());
        const bestWords = flexWordSubStrategy.scoreAndSortWords(this.words);
        const topWords = bestWords.slice(0, this.options.topWords).map(ws => ws.word);

        Logger.log('strategy','debug','Starting StrategySimGuessMinList strategy with words', topWords);
        const simGuessStrategy = new StrategySimGuessMinList(this.remainingWords, {
            maxSolutionSims: this.options.topWords,
            maxGuessSims: this.options.maxGuessSims,
            letters: this.letters.clone(),
            useInitialGuess: false,
            samplingRandom: false,
        });

        const simGuessWords = simGuessStrategy.scoreAndSortWords(topWords);
        return simGuessWords[0];
    }
}
