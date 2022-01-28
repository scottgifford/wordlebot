import { occurencesBeforePos, takeGuess } from "./util.mjs";

console.assert(occurencesBeforePos("abba", "a", 1) == 1, "finds a 1");
console.assert(occurencesBeforePos("abba", "a", 2) == 1, "finds a 2");
console.assert(occurencesBeforePos("abba", "a", 3) == 1, "finds a 3");
console.assert(occurencesBeforePos("abba", "a", 4) == 2, "finds a 4");

console.assert(occurencesBeforePos("abba", "b", 1) == 0, "finds b 1");
console.assert(occurencesBeforePos("abba", "b", 2) == 1, "finds b 2");
console.assert(occurencesBeforePos("abba", "b", 3) == 2, "finds b 3");
console.assert(occurencesBeforePos("abba", "b", 4) == 2, "finds b 4");

console.assert(takeGuess("abcde","fghij").join("") === "-----", "none matching");
console.assert(takeGuess("abcde","abcde").join("") === "GGGGG", "all matching");
console.assert(takeGuess("aaaaa","aaaaa").join("") === "GGGGG", "all same");
console.assert(takeGuess("aaaaa","abbbb").join("") === "G----", "one in many");
console.assert(takeGuess("balza","henna").join("") === "----G", "balza/henna");
