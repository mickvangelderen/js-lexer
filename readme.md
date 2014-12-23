# JavaScript Compiler Generator

I want to write streaming compilers in JavaScript. 

## Lexer

troubles:
 * chunks -> keep track of remainder, update regex indexes every time we discard a piece
 * unable to match partial regexes if they hit the end of the string along the way -> maximumMatchLength
 * unable to force regex to return matches starting from a certain index -> save matches, compare indexes with current index. If no match, no need to consider this rule anymore during this chunk. If match index < current index, set lastIndex to index and execute regex again. If match index === current index we've got a match. 
 * sorting matches by index so we can find them more optimally -> need to preserve rule order so with a low number of rules its probably not worth it, have to check
