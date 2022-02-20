#!/usr/bin/env node --experimental-modules

import { randWord, sum, takeGuess } from "./util.mjs";
import { strategyByName, STRATEGIES } from "./strategyByName.mjs";
import { Logger } from "./log.mjs";

import * as readline from 'readline';
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import asciiHistogram from "bars";

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean, description: "Show usage instructions"},
    { name: 'strategy', alias: 's', type: String, description: "Choose a strategy, one of: " + Object.keys(STRATEGIES).join(", ") },
    { name: 'runs', alias: 'r', type: Number, description: "Number of times to run"},
    { name: 'pick-strategy', alias: 'p', type: String, description: "How to pick solution words (default random)"},
    { name: 'interactive', alias: 'i', type: Boolean, description: "Interactively prompt for Wordle result" },
    { name: 'words', alias: 'w', type: String, description: "JavaScript module exporting valid words" },
    { name: 'answer', alias: 'a', type: String, description: "Use the given answer instead of a random one" },
    { name: 'guess', alias: 'g', type: String, multiple: true, description: "Use these as initial guesses" },
    { name: 'strategy-config', alias: 'o', type: String, description: "JSON string of strategy-specific configuration options, see strategy source"},
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
const STATS_DESCRIPTION_COL_WIDTH = 35;
const STATS_FORMAT_SIG_DIG = 2;
const LINE_READER = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    strategyOptionsString: commandLineOptions['strategy-config'] || '{}',
    logConfigString: commandLineOptions['log-config'],
    solutionPicker: solutionPickerForOptions(commandLineOptions),
}; 


const simpleFormatter = n => n.toString();
const averageFormatter = n => n.toFixed(STATS_FORMAT_SIG_DIG).toString();
const percentFormatter = n => averageFormatter(n) + " %";
const jsonFormatter = n => JSON.stringify(n);

const statDescriptions = {
    strategyName: ["Strategy Name", simpleFormatter],
    strategyOptions: ["Strategy Options", jsonFormatter],
    numGames: ["Number of games played", simpleFormatter],
    wins: ["Number of wins", simpleFormatter],
    losses: ["Number of losses", simpleFormatter],
    winPercent: ["Winning Percentage", percentFormatter],
    averageGuesses: ["Overall average guesses", averageFormatter],
    averageGuessesForWins: ["Average guesses for winning games", averageFormatter],
};

function formatGameStats(gameStats, strategyName, strategyOptions) {
    let formattedStr = '';
    const printOptions = {
        ...gameStats,
        strategyName,
        strategyOptions,
    }

    Object.entries(statDescriptions).forEach(([statName, [description, formatter]]) => {
        const statValue = printOptions[statName];
        formattedStr += `${description.padStart(STATS_DESCRIPTION_COL_WIDTH)}: ${formatter(statValue)}\n`;
    });
    const histogramData = Object.fromEntries(gameStats.guesses
        .map((count, numGuesses) => [count, numGuesses])
        .filter(([count, numGuesses]) => numGuesses > 0)
        .map(([count, numGuesses]) => [`${numGuesses} Guess${numGuesses > 1 ? 'es' : ''}`, count])
    );
    formattedStr += `Game Histogram:\n`;
    formattedStr += asciiHistogram(histogramData);

    return formattedStr;
}

function solutionPickerForOptions(options) {
    if (options.answer) {
        return () => options.answer;
    } else if (options.interactive) {
        return () => undefined;
    } else switch(options['pick-strategy']) {
        case 'random':
        case '':
        case undefined:
            return randWord;

        case 'inorder': {
            let i = 0;
            return (words) => {
                return words[i++];
            }
        }
        default:
            throw new Error(`Unrecognized pick-strategy '${options['pick-strategy']}'`);
    }
}

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

async function playGame(strategyName, solutionWords, allwords, solutionPicker, strategyOptions) {
    const strategy = strategyByName(strategyName, allwords, strategyOptions);

    const solution = solutionPicker(solutionWords);
    // !options.interactive ? options.answer || randWord(solutionWords) : undefined;
    if (solution) {
        Logger.log('game', 'info', `Picked solution word '${solution}', solving with strategy ${strategy.constructor.name}`);
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
            resultStr = takeGuess(guess, solution);
        }

        Logger.log('game', 'info', `Result: ${resultStr}`);
        if (resultStr === "GGGGG") {
            Logger.log('game', 'info', `You guessed '${guess}' in ${guesses} guesses!`);
            return guesses;
        }
        strategy.update(guess, resultStr.split(""));
    }
}

(async () => {
    try {
        if (options.logConfigString) {
            Logger.updateConfig(JSON.parse(options.logConfigString));
        }

        const { solutionWords, allWords } = await import(options.wordList);
        const gameStats = {
            guesses: [],
            failures: 0,
        };
        
        const strategyName = options.strategyName;
        const strategyOptions = JSON.parse(options.strategyOptionsString);

        Logger.log('init', 'info', `Found ${solutionWords.length} possible solutions, ${allWords.length} total words`);
        Logger.log('init', 'debug', `Using solution picker ${options.solutionPicker}`);

        for(let i=0;i<options.numGames;i++) {
            Logger.log('game', 'info', `===== Game ${i} Started`);

            try {
                const guesses = await playGame(strategyName, solutionWords, allWords, options.solutionPicker, strategyOptions);
                gameStats.guesses[guesses] = (gameStats.guesses[guesses] || 0) + 1;

            } catch (ex) {
                Logger.log('game', 'error', 'Game failed: ', ex);
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

        const isWinningGuess = (count, numGuesses) => numGuesses <= MAX_GUESSES;
        const averageGuesses = (sum, val, i) => sum + i * val;

        gameStats.numGames = gameStats.guesses.reduce((sum, val) => sum + val, 0);
        gameStats.wins = sum(gameStats.guesses.filter(isWinningGuess));
        gameStats.losses = gameStats.numGames - gameStats.wins;
        gameStats.winRate = gameStats.wins / gameStats.numGames * 1.0;
        gameStats.winPercent = gameStats.winRate * 100.0;
        gameStats.averageGuesses = gameStats.guesses.reduce(averageGuesses, 0) / gameStats.numGames;
        gameStats.averageGuessesForWins = gameStats.guesses.filter(isWinningGuess).reduce(averageGuesses, 0) / gameStats.wins;

        Logger.log('summary', 'debug', `Game stats object: `, gameStats)
        Logger.log('summary', 'info', `===== Game Statistics\n` + formatGameStats(gameStats, strategyName, strategyOptions));
    } catch (ex) {
        Logger.log('game', 'fatal', 'Wordler main loop failed', ex);
    }
    LINE_READER.close();
})();
