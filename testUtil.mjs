#!/usr/bin/env node --experimental-modules

import { charOccurrences, takeGuess } from "./util.mjs";

console.assert(charOccurrences("abba", "a") == 2, "finds a 2");
console.assert(charOccurrences("abba", "b") == 2, "finds b 2");
console.assert(charOccurrences("abba", "c") == 0, "finds c 0");

console.assert(takeGuess("abcde","fghij") === "-----", "none matching");
console.assert(takeGuess("abcde","abcde") === "GGGGG", "all matching");
console.assert(takeGuess("aaaaa","aaaaa") === "GGGGG", "all same");
console.assert(takeGuess("aaaaa","abbbb") === "G----", "one in many");
console.assert(takeGuess("balza","henna") === "----G", "balza/henna");
