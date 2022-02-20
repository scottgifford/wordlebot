# Overview
Scott's WordleBot is a half-assed AI for playing Wordle.  It is hacky but functional, and supports interactive play
(for example in conjunction with the Wordle Website), or batch play for collectin statistics on a new strategy.
It has a logging module which can be used to deep-dive the strategies.

# Usage
## Examples

### Interactive Play
```
env INTERACTIVE=1 WORDS=./wordleWords.mjs ./wordler.mjs refreqflex3
```

Play a single interactive game using Wordle dictionary and strategy "refreqflex3", with default logging options.

### Batch Play
```
env WORDS=./wordleWords.mjs ./wordler.mjs refreqflex3 10
```

Play 10 interactive games using Wordle dictionary and strategy "refreqflex3", with default logging options.
Statistics will be output

### Debug Single Word
```
env LOG_CONFIG='{"default": "debug", "strategy": "trace"}' ./wordler.mjs refreqflex3 1 woozy
```

Play a single automatic game with the given solution word, showing debug logs for most modules, and trace
logs for the strategy module.

## Options
### env LOG_CONFIG
Set to a JSON string where keys are modules and values are debugging levels for that module.

Debugging levels:
* `trace`: Show detailed tracing, plus all below
* `debug`: Show debug information, plus all below
* `info`: Show informational logs, plus all below
* `warn`: Show warnings, plus all below
* `error`: Show errors, plus all below
* `fatal`: Show fatals, plus all below

Debugging modules:
* `game`: Game mechanics
* `init`: Initialization
* `freq`: Letter frequency analysis
* `lettertrack`: Letter tracking
* `strategy`: Strategy details
* `score`: Word scoring

# Strategies
## random
Randomly choose a word which matches the information known so far.

## freq
Use a frequency analyzer, and choose the word with the highest score from the frequency analyzer
(i.e., the word with the letters seen most frequently in the list of words).  Double/Triple/etc.
letter occurrences are not scored.

## refreq
Use the frequency analyzer as above, but after each guess, create a new frequency analyzer
with the remaining possibilities.

## doublefreq
Use a smarter scorer that takes into account double/triple/etc. letter occurrences.

## doublerefreq
Re-analyze frequency of remaining words as in `refreq`, but use the improved scorer from `doublefreq`.

## refreqflex
Like the `refreq` strategy, but be more flexible about choosing words: Instead of guessing only real possibilities,
if a not-possible word gets a much better score than a possible one, guess that instead.

## refreqflex2
Like the `refreqflex` strategy, but keep guessing words which may not be possible until we have some
threshold of found letters.  Experimentation has shown that continuing until we know all letters has
the best result, so that is the default.

## refreqflex3
Like the `refreqflex` strategy, but with lots of additional optimizations, including
* Better scoring for double/triple/etc. letter occurences
* Don't award score points for letters we already know about
* If a real possibility scores as well as the best overall word, choose that
* As a score tiebreaker, prefer words with more new letters
* If it is our last turn, always guess a real possibility

This is currently the best strategy, winning 100% of the time on the most recent test run.

## refreqflex4
Like `refreqflex3`, but instead of choosing the highest-scoring word, choose something further down the list.
Currently this always does worse unless it is configured to choose the best possible word, which is identical
to `refreqflex3` and is the default.

The thinking here is that by starting with the most popular letters, we are left with letters that are infrequent
and so hard to incorporate into other words; often later guesses only get 1-2 new characters out of all 5.
In other words, the very popular letters we will get naturally when guessing other words,
so try starting with the least popular ones?

## Developing a New Strategy

For a brand new strategy, implement the interface from `strategy.mjs`, with the two methods defined there.

For a strategy similar to an existing one, extend the existing strategy and override any methods you want to customize.

When you are ready to test, add your strategy to `strategyByName.mjs` so you can use it from the command-line.

# Apologia
This code was written quickly for fun, and is a weird mix of modern JavaScript and whatever popped into my head.
It grossly abuses object-oriented paradigms in the interest of quick experimentation, and contains a haphazard
minefield of copypasta code.

I don't write production code like this, I promise.

# License
This code is placed into the public domain by Scott Gifford <sgifford@suspectclass.com>
