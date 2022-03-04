import { Logger } from "./log.mjs";
import { StrategyRefreqyFlexDoubleRules } from "./strategyRefreqyFlexDoubleRules.mjs";
import { StrategySimGuessMinList } from "./strategySimGuessMinList.mjs";

const TOP_N_WORDS = 100;
const MAX_GUESS_SIMS = 50;
const MAX_SOLUTION_SIMS = 50;

export class StrategyRefreqyFlexDoubleRulesTournament extends StrategyRefreqyFlexDoubleRules {
    chooseFlexWordAndScore() {
        const flexWordSubStrategy = this.newSubStrategy(this.words, this.flexFreq());
        const bestWords = flexWordSubStrategy.scoreAndSortWords(this.words);
        const topWords = bestWords.slice(0, TOP_N_WORDS).map(ws => ws.word);

        Logger.log('strategy','debug','Starting tournament strategy with words', topWords);
        const tournamentStrategy = new StrategySimGuessMinList(this.remainingWords, {
            maxGuessSims: MAX_GUESS_SIMS,
            maxSolutionSims: MAX_SOLUTION_SIMS,
            letters: this.letters.clone(),
        });

        tournamentStrategy.scoreCache = { }; // TODO: Move to method or something
        const tournamentWords = tournamentStrategy.scoreAndSortWords(topWords);
        return tournamentWords[0];
    }
}
