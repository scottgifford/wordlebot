import { StrategyFreqy } from "./strategyFreqy.mjs";
import { StrategyRandomRemaining } from "./strategyRandomRemaining.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategySimGuess } from "./strategySimGuess.mjs";

export function strategyByName(name, words) {
    switch(name) {
        case 'random':
            return new StrategyRandomRemaining(words);
        case 'freq':
            return new StrategyFreqy(words);
        case 'refreq':
            return new StrategyRefreqy(words);
        case 'simguess':
            return new StrategySimGuess(words);
    
        default:
            throw new Error(`Unknown strategy '${name}'`);
    }
}