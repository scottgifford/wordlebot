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

    cloneMap(f = () => true) {
        return new FrequencyAnalysis([], Object.fromEntries(Object.entries(this.freq)
            .map(f)
            .filter(([k, v]) => v !== undefined)));
    }

    hasLetter(letter) {
        return this.letterFrequency(letter) > 0;
    }

    letterFrequencyAtPosition(letter, position) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter][position];
    }

    letterFrequency(letter) {
        if (!this.freq[letter]) {
            return 0;
        }
        return this.freq[letter].reduce((sum, cur) => sum + cur);
    }

    getEntry(letter) {
        return this.freq[letter];
    }
}