import { config } from "process";

const NAME_LEVELS = {
    'fatal': 1,
    'error': 2,
    'warn': 3,
    'info': 4,
    'debug': 5,
    'trace': 6,
};
const LEVEL_NAMES = Object.fromEntries(Object.entries(NAME_LEVELS).map(([k, v]) => [v, k]));
const DEFAULT_NAME = 'default';
const DEFAULT_LEVEL = NAME_LEVELS['info'];
const DEFAULT_CONFIG = { DEFAULT_NAME: DEFAULT_LEVEL };

function parseLevel(levelStr) {
    if (typeof (levelStr) === 'number') {
        return levelStr;
    } else if (isNaN(levelStr)) {
        const level = NAME_LEVELS[levelStr.toLowerCase()];
        if (level) {
            return level;
        } else {
            throw new Error(`Unrecognized level '${levelStr}' when parsing log config`);
        }
    } else {
        return parseInt(levelStr);
    }
}

function parseConfig(config) {
    return Object.fromEntries(Object.entries(config)
        .map(([k, v]) => [k, parseLevel(v)]));
}

export class Logger {
    constructor(name) {
        this.name = name;
    }

    static updateConfig(config) {
        Logger.config = parseConfig(config);
    }

    fatal(...msg) {
        Logger.log(this.name, 'fatal', ...msg);
    }

    error(...msg) {
        Logger.log(this.name, 'error', ...msg);
    }

    warn(...msg) {
        Logger.log(this.name, 'warn', ...msg);
    }

    info(...msg) {
        Logger.log(this.name, 'info', ...msg);
    }

    debug(...msg) {
        Logger.log(this.name, 'debug', ...msg);
    }

    trace(...msg) {
        Logger.log(this.name, 'trace', ...msg);
    }

    static getConfiguredLevel(name) {
        return Logger.config[name] || Logger.config[DEFAULT_NAME] || DEFAULT_LEVEL;
    }

    static log(name, levelStr, ...msg) {
        const level = parseLevel(levelStr);
        const configLevel = Logger.getConfiguredLevel(name);
        if (level <= configLevel) {
            console.log(`-> ${name.toUpperCase().padEnd(15)} [${LEVEL_NAMES[level].toUpperCase().padEnd(5)}]`, ...msg);
        }
    }

    static dynLog(name, levelStr, msgFunc) {
        const level = parseLevel(levelStr);
        const configLevel = Logger.getConfiguredLevel(name);
        if (level <= configLevel) {
            Logger.log(name, level, msgFunc());
        }
    }
}

Logger.updateConfig(DEFAULT_CONFIG);
