import { charOccurrences, takeGuess } from "./util.mjs";

console.assert(charOccurrences("abba", "a") == 2, "finds a 2");
console.assert(charOccurrences("abba", "b") == 2, "finds b 2");
console.assert(charOccurrences("abba", "c") == 0, "finds c 0");

console.assert(takeGuess("abcde","fghij").join("") === "-----", "none matching");
console.assert(takeGuess("abcde","abcde").join("") === "GGGGG", "all matching");
console.assert(takeGuess("aaaaa","aaaaa").join("") === "GGGGG", "all same");
console.assert(takeGuess("aaaaa","abbbb").join("") === "G----", "one in many");
console.assert(takeGuess("balza","henna").join("") === "----G", "balza/henna");
