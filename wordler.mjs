#!/usr/bin/env node --experimental-modules

import { randWord, takeGuess } from "./util.mjs";
import { strategyByName } from "./strategyByName.mjs";
import { Logger } from "./log.mjs";

import * as readline from 'readline';

const DEFAULT_STRATEGY_NAME = 'random';
const DEFAULT_NUM_GAMES = 1;
const MAX_GUESSES = 6;
const WORD_LIST = process.env['WORDS'] || './allWords.mjs';
const LINE_READER = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    return options.guesses[num] || strategy.guess(num+1);
}

async function promptForAnswer() {
    while (1) {
        const resp = await new Promise(resolve => {
            LINE_READER.question('Response from Wordle (yg-): ', resolve);
        });
        console.log(`READ RESPONSE: ${resp}`);
        const upResp = resp.toUpperCase();
        if (/^[YG-]{5}$/.test(upResp)) {
            console.log(`ACCEPTED RESPONSE: ${upResp}`);
            return upResp;
        }
        console.log('Invalid entry, please try again');
    }
}

async function playGame(allwords) {
    const strategy = strategyByName(options.strategyName,allwords);

    // TODO: This is messy!
    let word;
    if (!process.env['INTERACTIVE']) {
        word = options.answer || randWord(allwords);
        Logger.log('game', 'info', `Picked solution word '${word}', solving with strategy ${strategy.constructor.name}`);
    }

    let remainingWords = allwords;
    let guesses = 0;
    while(1) {
        Logger.log('game', 'info', `Guess #${guesses+1}`);
        const guess = chooseGuess(strategy, guesses);
        guesses++;
        Logger.log('game', 'info', `Guessed word '${guess}'`);

        let resultStr;
        if (process.env['INTERACTIVE']) {
            resultStr = await promptForAnswer();
        } else {
            resultStr= takeGuess(guess, word);
        }

        Logger.log('game', 'info', `Result: ${resultStr}`);
        if (resultStr === "GGGGG") {
            Logger.log('game', 'info', `You guessed '${guess}' in ${guesses} guesses!`);
            gameStats.guesses[guesses] = (gameStats.guesses[guesses] || 0) + 1;
            break;
        }
        strategy.update(guess, resultStr.split(""));
        if (remainingWords.length === 0) {
            Logger.log('game', 'info', "Ran out of guesses!");
            gameStats.failures++;
            break;
        }
    }
}

(async () => {
    const { allWords } = await import(WORD_LIST);

    Logger.log('init', 'info', `Found ${allWords.length} words`);
    for(let i=0;i<options.numGames;i++) {
        Logger.log('game', 'info', `===== Game ${i}`);
        await playGame(allWords);
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
    Logger.log('summary', 'info', 'Game Statistics:', gameStats);

    LINE_READER.close();
})();

