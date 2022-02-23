import { Logger } from "./log.mjs";

export class StrategyOption {
    constructor(name, defaultValue, description, validator = () => { }) {
        this.name = name;
        this.defaultValue = defaultValue;
        this.description = description;
        this.validator = validator;
    }

    validate(value) {
        try {
            this.validator(value);
        } catch (ex) {
            this.throwInvalid(ex.message);
        }
    }

    throwInvalid(message) {
        throw new Error(`Option ${this.name} is not valid: ${message}`);
    }

    isInternal() {
        return false;
    }
}

export class StrategyOptionInteger extends StrategyOption {
    constructor(name, defaultValue, description) {
        super(name, defaultValue, description, (v) => { if (!Number.isInteger(v)) { this.throwInvalid(`value '${v}' is not a number`)} })
    }
}

export class StrategyOptionInternal extends StrategyOption {
    constructor(name, defaultValue, description, validator = () => { }) {
        super(name, defaultValue, description, validator);
    }

    isInternal() {
        return true;
    }

}
export class Strategy {
    constructor(words, options) {
        this.words = words;
        this.processOptions(options);
        Logger.log('strategy', 'debug', 'Options:', this.options);
    }

    getSupportedOptions() {
        return [ ];
    }

    processOptions(options) {
        this.options = { };

        this.getSupportedOptions().forEach(entry => {
            if (entry.defaultValue) {
                this.options[entry.name] = entry.defaultValue;
            }
        });

        const optionsMap = Object.fromEntries(this.getSupportedOptions().map(entry => [entry.name, entry]));
        Object.entries(options).forEach(([name, value]) => {
            const optionEntry = optionsMap[name];
            if (optionEntry) {
                optionEntry.validate(value); // Will throw if invalid
                this.options[name] = value;
            } else{
                throw new Error(`Unrecognized strategy option '${name}'`);
            }
        });
    }

    guess(guessNum) {
        throw new Error("Abstract method");
    }

    update(guess, result) {
        throw new Error("Abstract method");
    }

    guessLog() {
        // Do nothing
    }

    updateLog() {
        // Do nothing
    }
}
