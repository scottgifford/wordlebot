import { StrategyDoubleFreqy } from "./strategyDoubleFreqy.mjs";
import { StrategyDoubleRefreqy } from "./strategyDoubleRefreqy.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";
import { StrategyRandomRemaining } from "./strategyRandomRemaining.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategyRefreqyFlex } from "./strategyRefreqyFlex.mjs";
import { StrategyRefreqyFlex2 } from "./strategyRefreqyFlex2.mjs";
import { StrategyRefreqyFlex3 } from "./strategyRefreqyFlex3.mjs";
import { StrategyRefreqyFlex4 } from "./strategyRefreqyFlex4.mjs";
import { StrategySimGuess } from "./strategySimGuess.mjs";

export function strategyByName(name, words, strategyOptions = { }) {
    switch(name) {
        case 'random':
            return new StrategyRandomRemaining(words, strategyOptions);
        case 'freq':
            return new StrategyFreqy(words, strategyOptions);
        case 'doublefreq':
            return new StrategyDoubleFreqy(words, strategyOptions);
        case 'refreq':
            return new StrategyRefreqy(words, strategyOptions);
        case 'doublerefreq':
            return new StrategyDoubleRefreqy(words, strategyOptions);
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
    freq: 'Choose the valid word with the overall most frequently occuring letters, with no score for additional instances of the same letter',
    doublefreq: 'Choose valid word with most frequently occuring letters, but score additional instances of the same letter according to the frequency of that letter appearing that many times',
    refreq: 'Choose the valid word with the most frequently occuring letters among the remaining options',
    doublerefreq: 'Choose valid word based on frequency of remaining letters (as in refreq), with the smarter scoring strategy from doublefreq',
    refreqflex: 'Choose the word with the most frequently occuring letters among the remaining options, whether or not it is valid',
    refreqflex2: 'Like the `refreqflex` strategy, but keep guessing words which may not be possible until we have some threshold of found letters',
    refreqflex3: 'Like the `refreqflex` strategy, but with lots of additional optimizations',
    refreqflex4: 'Like the `refreqflex3` strategy, but choose lower-scoring words',
    simguess: 'Try to find a guess that will eliminate about half of the words',    
}