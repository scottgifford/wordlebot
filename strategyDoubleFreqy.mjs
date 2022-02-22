import { Logger } from "./log.mjs";
import { StrategyFreqy } from "./strategyFreqy.mjs";

// TODO: Deprecate this strategy, its functionality is subsumed into its parent class.
export class StrategyDoubleFreqy extends StrategyFreqy {
    constructor(words, options) {
        super(words, {
            useDoubleFreq: true,
            ...options,
        })
    }
}
