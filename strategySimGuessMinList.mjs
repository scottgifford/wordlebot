import { StrategySimGuess } from "./strategySimGuess.mjs";

export class StrategySimGuessMinList extends StrategySimGuess {
    /**
     * Assign a comparative score to the generated word list, given the current word list as context.
     * 
     * This specific implementation aims for a word which comes as close as possible to cutting the current list in half.
     * 
     * @param {*} generatedWordList List of next-step words generated in the current simulation
     * @param {*} currentWordList Current list of words (for context)
     * @returns Score suitable for comparison with other words (higher score is better)
     */
    scoreWordLists(generatedWordList, currentWordList) {
        return generatedWordList.length;
    }
}