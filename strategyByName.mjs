import { StrategyFreqy } from "./strategyFreqy.mjs";
import { StrategyRandomRemaining } from "./strategyRandomRemaining.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategyRefreqyFlex } from "./strategyRefreqyFlex.mjs";
import { StrategyRefreqyFlex2 } from "./strategyRefreqyFlex2.mjs";
import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";
import { StrategyRefreqyFlex4 } from "./strategyRefreqyFlex4.mjs";
import { StrategySimGuess } from "./strategySimGuess.mjs";

export function strategyByName(name, words, strategyOptions) {
    switch(name) {
        case 'random':
            return new StrategyRandomRemaining(words, strategyOptions);
        case 'freq':
            return new StrategyFreqy(words, strategyOptions);
        case 'refreq':
            return new StrategyRefreqy(words, strategyOptions);
        case 'refreqflex':
            return new StrategyRefreqyFlex(words, strategyOptions);
        case 'refreqflex2':
            return new StrategyRefreqyFlex2(words, strategyOptions);
        case 'refreqflex3':
            return new StrategyRefreqyFlex3(words, strategyOptions);
        case 'refreqflex4':
            return new StrategyRefreqyFlex4(words, strategyOptions);
        case 'simguess':
            return new StrategySimGuess(words, strategyOptions);
    
        default:
            throw new Error(`Unknown strategy '${name}'`);
    }
}

export const STRATEGIES = {
    random: 'Randomly choose a valid word each turn',
    freq: 'Choose the valid word with the overall most frequently occuring letters',
    refreq: 'Choose the valid word with the most frequently occuring letters among the remaining options',
    refreqflex: 'Choose the word with the most frequently occuring letters among the remaining options, whether or not it is valid',
    refreqflex2: 'Like the `refreqflex` strategy, but keep guessing words which may not be possible until we have some threshold of found letters',
    refreqflex3: 'Like the `refreqflex` strategy, but with lots of additional optimizations',
    refreqflex4: 'Like the `refreqflex3` strategy, but choose lower-scoring words',
    simguess: 'Try to find a guess that will eliminate about half of the words',    
}