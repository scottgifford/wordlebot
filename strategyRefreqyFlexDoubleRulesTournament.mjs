import { Logger } from "./log.mjs";
import { StrategyOption, StrategyOptionInteger } from "./strategy.mjs";
import { StrategyRefreqyFlexDoubleRules } from "./strategyRefreqyFlexDoubleRules.mjs";
import { StrategySimGuessMinList } from "./strategySimGuessMinList.mjs";

const DEFAULT_INITIAL_GUESS = 'tares';

export class StrategyRefreqyFlexDoubleRulesTournament extends StrategyRefreqyFlexDoubleRules {
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
                'Use a pre-calculated word for our first guess instead of simulating'),
            new StrategyOption(
                'samplingRandom', true,
                'Use a pre-calculated word for our first guess instead of simulating'),

            ...super.getSupportedOptions()
        ];
    }

    chooseFlexWordAndScore() {
        const flexWordSubStrategy = this.newSubStrategy(this.words, this.flexFreq());
        const bestWords = flexWordSubStrategy.scoreAndSortWords(this.words);
        const topWords = bestWords.slice(0, this.options.topWords).map(ws => ws.word);

        Logger.log('strategy','debug','Starting tournament strategy with words', topWords);
        const tournamentStrategy = new StrategySimGuessMinList(this.remainingWords, {
            maxSolutionSims: this.options.topWords,
            maxGuessSims: this.options.maxGuessSims,
            letters: this.letters.clone(),
            useInitialGuess: false,
            samplingRandom: false,
        });

        tournamentStrategy.scoreCache = { }; // TODO: Move to method or something
        tournamentStrategy.guessNum = 1;  // TODO: Move to method or something
        const tournamentWords = tournamentStrategy.scoreAndSortWords(topWords);
        return tournamentWords[0];
    }
}
