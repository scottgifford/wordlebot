#!/usr/bin/env node --experimental-modules

import { Logger } from "./log.mjs";
import { strategyByName, STRATEGIES } from "./strategyByName.mjs";
import { takeGuess } from "./util.mjs";

const solution = "freak";
const words = [ "break", "bleak", "bread", "freed", "greed", "greek", solution ];

Object.keys(STRATEGIES).forEach(strategyName => {
    Logger.log('test', 'info', `===== BEGIN TESTING STRATEGY ${strategyName} with solution ${solution}`);
    const strategy = new strategyByName(strategyName, words);
    while(1) {
        const guess = strategy.guess();
        if (!guess) {
            throw new Error('Ran out of guesses');
        }
        const response = takeGuess(solution, guess);
        Logger.log('test', 'info', `Guessed ${guess}, response ${response}`);

        strategy.update(guess, response.split(""));
        if (response === 'GGGGG') {
            break;
        }
    }
    Logger.log('test', 'info', `=====   END TESTING STRATEGY: ${strategyName}`);
});
