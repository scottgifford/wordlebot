#!/usr/bin/env node --experimental-modules

import { allwords } from "./allwords.mjs";
import { randWord, takeGuess, occurencesBeforePos } from "./util.mjs";
import { strategyByName } from "./strategyByName.mjs";

const DEFAULT_STRATEGY_NAME = 'random';
const DEFAULT_NUM_GAMES = 1;
const MAX_GUESSES = 6;

const gameStats = {
    guesses: [],
    failures: 0,
}

const options = {
    strategyName: process.argv[2] || DEFAULT_STRATEGY_NAME,
    numGames: process.argv[3] || DEFAULT_NUM_GAMES,
    answer: process.argv[4],
    guesses: process.argv.slice(5),
}; 

function chooseGuess(strategy, num) {
    return options.guesses[num] || strategy.guess();
}

function playGame() {
    const strategy = strategyByName(options.strategyName,allwords);
    const word = options.answer || randWord(allwords);

    console.log(`Picked word '${word}', strategy ${strategy.constructor.name}`);

    let remainingWords = allwords;
    let guesses = 0;
    while(1) {
        const guess = chooseGuess(strategy, guesses);
        guesses++;
        console.log(`Guessed word '${guess}'`);

        const result = takeGuess(guess, word);
        const resultStr = result.join("");
        console.log(resultStr);
        if (resultStr === "GGGGG") {
            console.log(`You guessed '${guess}' in ${guesses} guesses!`);
            gameStats.guesses[guesses] = (gameStats.guesses[guesses] || 0) + 1;
            break;
        }
        strategy.update(guess, result);
        if (remainingWords.length === 0) {
            console.error("Ran out of guesses!");
            gameStats.failures++;
            break;
        }
    }
}


console.log(`Found ${allwords.length} words`);
for(let i=0;i<options.numGames;i++) {
    console.log(`===== Game ${i}`);
    playGame();
}

// Clean up stats
for(let i=0;i<gameStats.guesses.length;i++) {
    if (!gameStats.guesses[i]) {
        gameStats.guesses[i] = 0;
    }
}
gameStats.numGames = gameStats.guesses.reduce((sum, val) => sum + val);
gameStats.wins = gameStats.guesses.reduce((sum, val, i) => sum + ((i <= MAX_GUESSES) ? val : 0));
gameStats.losses = gameStats.numGames - gameStats.wins;
gameStats.winRate = gameStats.wins / gameStats.numGames * 1.0;
gameStats.averageGuesses = gameStats.guesses.reduce((sum, val, i) => sum + i * val) / gameStats.numGames;
console.log(gameStats);


