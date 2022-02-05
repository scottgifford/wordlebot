export class FrequencyAnalysis {
    constructor(words, initialFreq = { }) {
        this.freq = initialFreq;
        for(let i=0;i<words.length;i++) {
            const word = words[i];
            for(let j=0;j<word.length;j++) {
                const letter = word[j];
                if (!this.freq[letter]) {
                    this.freq[letter] = [0, 0, 0, 0, 0];
                }
                this.freq[letter][j]++;
            }
        }
    }

    clone(filt = () => true) {
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .filter(filt)));
    }

    hasLetter(letter) {
        return !!this.freq[letter];
    }

    letterFrequencyAtPosition(letter, position) {
        return this.freq[letter][position];
    }

    letterFrequency(letter) {
        return this.freq[letter].reduce((sum, cur) => sum + cur);
    }
}