export function randWord(words) {
    const wordNum = Math.floor(Math.random() * words.length);
    return words[wordNum];
}

export function charOccurrences(str, ch) {
    let count = 0;
    if (str) {
        for(let i=0;i<str.length;i++) {
            if (str[i] === ch) {
                count++;
            }
        }
    }
    return count;
}

export function sum(arr) {
    return arr.reduce((tot, i) => tot += i, 0);
}

export function takeGuess(guess, answer) {
    let guessArr = Array.from(guess);
    let answerArr = Array.from(answer);
    let resultArr = [];
    let yellowCount = { };

    // First count how many times each letter in the guess occurs
    for(let i=0;i<guessArr.length;i++) {
        const guessLetter = guessArr[i];
        yellowCount[guessLetter] = answerArr.filter(answerLetter => answerLetter === guessLetter).length;
    }

    // Now take care of all the ones that are in the right place
    for(let i=0;i<guessArr.length;i++) {
        const guessLetter = guessArr[i];
        if (guessArr[i] === answerArr[i]) {
            resultArr[i] = 'G';
            yellowCount[guessLetter]--;
        }
    }

    // Finally take care o the rest
    for(let i=0;i<guessArr.length;i++) {
        const guessLetter = guessArr[i];
        if (resultArr[i] === 'G') {
            // Do nothing, already solved above
        } else if (yellowCount[guessLetter]) {
            resultArr[i] = 'Y';
            yellowCount[guessLetter]--;
        } else {
            resultArr[i] = '-';
        }
    }
    return resultArr;
}