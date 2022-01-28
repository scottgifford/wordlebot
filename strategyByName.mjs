import { StrategyFreqy } from "./strategyFreqy.mjs";
import { StrategyRandomRemaining } from "./strategyRandomRemaining.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategyRefreqyFlex } from "./strategyRefreqyFlex.mjs";
import { StrategyRefreqyFlex2 } from "./strategyRefreqyFlex2.mjs";
import { StrategySimGuess } from "./strategySimGuess.mjs";

export function strategyByName(name, words) {
    switch(name) {
        case 'random':
            return new StrategyRandomRemaining(words);
        case 'freq':
            return new StrategyFreqy(words);
        case 'refreq':
            return new StrategyRefreqy(words);
        case 'refreqflex':
            return new StrategyRefreqyFlex(words);
        case 'refreqflex2':
            return new StrategyRefreqyFlex2(words);
        case 'simguess':
            return new StrategySimGuess(words);
    
        default:
            throw new Error(`Unknown strategy '${name}'`);
    }
}