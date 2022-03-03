import { StrategyDoubleFreqy } from "./strategyDoubleFreqy.mjs";
import { StrategyDoubleRefreqy } from "./strategyDoubleRefreqy.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";
import { StrategyRandomRemaining } from "./strategyRandomRemaining.mjs";
import { StrategyRefreqy } from "./strategyRefreqy.mjs";
import { StrategyRefreqyFlexRatio } from "./strategyRefreqyFlexRatio.mjs";
import { StrategyRefreqyFlexSimpleRules } from "./strategyRefreqyFlexSimpleRules.mjs";
import { StrategyRefreqyFlexDoubleRules } from "./strategyRefreqyFlexDoubleRules.mjs";
import { StrategyRefreqyFlexDoubleRulesTournament } from "./strategyRefreqyFlexDoubleRulesTournament.mjs";
import { StrategyRefreqyFlex4 as StrategyRefreqyFlexBadGuesser } from "./strategyRefreqyFlexBadGuesser.mjs";
import { StrategySimGuess } from "./strategySimGuess.mjs";
import { StrategySimGuessMinList } from "./strategySimGuessMinList.mjs";

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
        case 'refreqflexratio':
            return new StrategyRefreqyFlexRatio(words, strategyOptions);
        case 'refreqflexsimplerules':
            return new StrategyRefreqyFlexSimpleRules(words, strategyOptions);
        case 'refreqflexdouble':
            return new StrategyRefreqyFlexDoubleRules(words, strategyOptions);
        case 'refreqflexdoubletourn':
            return new StrategyRefreqyFlexDoubleRulesTournament(words, strategyOptions);
        case 'refreqflexbadguess':
            return new StrategyRefreqyFlexBadGuesser(words, strategyOptions);
        case 'simguess':
            return new StrategySimGuess(words, strategyOptions);
        case 'simguessmin':
            return new StrategySimGuessMinList(words, strategyOptions);
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
    refreqflexratio: 'Choose the word with the most frequently occuring letters among the remaining options, whether or not it is valid',
    refreqflexsimplerules: 'Like the `refreqflexratio` strategy, but keep guessing words which may not be possible until we have some threshold of found letters',
    refreqflexdouble: 'Like the `refreqflexsimplerules` strategy, but with lots of additional optimizations',
    refreqflexbadguess: 'Like the `refreqflextweak` strategy, but choose lower-scoring words',
    simguess: 'Try to find a guess that will eliminate about half of the words',    
}