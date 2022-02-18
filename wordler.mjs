#!/usr/bin/env node --experimental-modules

import { randWord, takeGuess } from "./util.mjs";
import { strategyByName, STRATEGIES } from "./strategyByName.mjs";
import { Logger } from "./log.mjs";

import * as readline from 'readline';
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean, description: "Show usage instructions"},
    { name: 'strategy', alias: 's', type: String, description: "Choose a strategy, one of: " + Object.keys(STRATEGIES).join(", ") },
    { name: 'runs', alias: 'r', type: Number, description: "Number of times to run"},
    { name: 'interactive', alias: 'i', type: Boolean, description: "Interactively prompt for Wordle result" },
    { name: 'words', alias: 'w', type: String, description: "JavaScript module exporting valid words" },
    { name: 'answer', alias: 'a', type: String, description: "Use the given answer instead of a random one" },
    { name: 'guess', alias: 'g', type: String, multiple: true, description: "Use these as initial guesses" },
    { name: 'strategy-options', alias: 'o', type: String, description: "JSON string of configuration-specific options"},
    { name: 'log-config', alias: 'l', type: String, description: "JSON string with log configuration options, see README" },
];

const help = [
    {
        header: 'WordleBot 🤖',
        content: 'A friendly robot to play Wordle'
    }, {
    header: 'Synopsis',
    content: [
        `wordler.mjs [options]`,
        `wordler.mjs {bold -h}`,
    ]
    }, {
        header: 'Options',
        optionList: optionDefinitions,
    }, {
        header: 'Strategies',
        content: Object.entries(STRATEGIES).map(([name, summary]) => { return { name, summary } }),
    }, {
        header: 'Examples',
        content: [
          {
            desc:'Play 1000 runs with refreqflex3 strategy',
            example: './wordler.mjs -r 1000 -s refreqflex3'
          },
          {
            desc: 'Play an interactive game with refreqflex3 strategy and Wordle dictionary',
            example: './wordler.mjs -w ./wordleWords.mjs -i -s refreqflex3'
          },
          {
            desc: 'Use debug options',
            example: `./wordler.mjs -l '\\{"score": "debug", "strategy": "debug" \\}' -w ./wordleWords.mjs -s 'refreqflex3' -o ' \\{"extraScoreWords": ["aaaaa", "bbbbb"] \\}'`
          },
        ]
    }, {
        content: 'Project home: {underline https://github.com/scottgifford/wordlebot}'
    }

];

const DEFAULT_STRATEGY_NAME = 'random';
const DEFAULT_NUM_GAMES = 1;
const DEFAULT_WORD_LIST = './allWords.mjs';
const MAX_GUESSES = 6;
const LINE_READER = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const gameStats = {
    guesses: [],
    failures: 0,
}

const commandLineOptions = commandLineArgs(optionDefinitions);
if (commandLineOptions.help) {
    console.log(commandLineUsage(help));
    process.exit(2);
}

const options = {
    strategyName: commandLineOptions.strategy || DEFAULT_STRATEGY_NAME,
    numGames: commandLineOptions.runs || DEFAULT_NUM_GAMES,
    wordList: commandLineOptions.words || DEFAULT_WORD_LIST,
    answer: commandLineOptions.answer,
    guesses: commandLineOptions.guess || [],
    interactive: commandLineOptions.interactive,
    strategyOptionsString: commandLineOptions['strategy-options'] || '{}',
    logConfigString: commandLineOptions['log-config'],
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

async function playGame(allwords, strategyOptions) {
    const strategy = strategyByName(options.strategyName, allwords, strategyOptions);
    const word = !options.interactive ? options.answer || randWord(allwords) : undefined;
    if (word) {
        Logger.log('game', 'info', `Picked solution word '${word}', solving with strategy ${strategy.constructor.name}`);
    }

    let guesses = 0;
    while(1) {
        Logger.log('game', 'info', `Guess #${guesses+1}`);
        const guess = chooseGuess(strategy, guesses);
        if (!guess) {
            throw new Error(`Ran out of guesses!`);
        }
        guesses++;
        Logger.log('game', 'info', `Guessed word '${guess}'`);

        let resultStr;
        if (options.interactive) {
            resultStr = await promptForAnswer();
        } else {
            resultStr = takeGuess(guess, word);
        }

        Logger.log('game', 'info', `Result: ${resultStr}`);
        if (resultStr === "GGGGG") {
            Logger.log('game', 'info', `You guessed '${guess}' in ${guesses} guesses!`);
            gameStats.guesses[guesses] = (gameStats.guesses[guesses] || 0) + 1;
            break;
        }
        strategy.update(guess, resultStr.split(""));
    }
}

(async () => {
    try {
        const { allWords } = await import(options.wordList);

        if (options.logConfigString) {
            Logger.updateConfig(JSON.parse(options.logConfigString));
        }

        const strategyOptions = JSON.parse(options.strategyOptionsString);

        Logger.log('init', 'info', `Found ${allWords.length} words`);
        for(let i=0;i<options.numGames;i++) {
            Logger.log('game', 'info', `===== Game ${i} Started`);

            try {
                await playGame(allWords, strategyOptions);
            } catch (ex) {
                Logger.log('game', 'error', 'Game failed: ' + ex);
                gameStats.failures++;
            }
            Logger.log('game', 'info', `===== Game ${i} Ended`);
        }

        // Clean up stats
        for(let i=0;i<gameStats.guesses.length;i++) {
            if (!gameStats.guesses[i]) {
                gameStats.guesses[i] = 0;
            }
        }
        gameStats.numGames = gameStats.guesses.reduce((sum, val) => sum + val, 0);
        gameStats.wins = gameStats.guesses.reduce((sum, val, i) => sum + ((i <= MAX_GUESSES) ? val : 0), 0);
        gameStats.losses = gameStats.numGames - gameStats.wins;
        gameStats.winRate = gameStats.wins / gameStats.numGames * 1.0;
        gameStats.averageGuesses = gameStats.guesses.reduce((sum, val, i) => sum + i * val, 0) / gameStats.numGames;
        Logger.log('summary', 'info', 'Game Statistics:', gameStats);
    } catch (ex) {
        Logger.log('game', 'fatal', 'Wordler main loop failed', ex);
    }
    LINE_READER.close();
})();

