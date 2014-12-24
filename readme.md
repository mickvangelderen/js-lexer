# JavaScript Lexer

I wanted to write a streaming regex based lexer in JavaScript, so I did. 

troubles:
 * chunks -> keep track of remainder, update regex indexes every time we discard a piece
 * unable to match partial regexes if they hit the end of the string along the way -> maximumMatchLength
 * unable to force regex to return matches starting from a certain index -> save matches, compare indexes with current index. If no match, no need to consider this rule anymore during this chunk. If match index < current index, set lastIndex to index and execute regex again. If match index === current index we've got a match. 
 * sorting matches by index so we can find them more optimally -> need to preserve rule order so with a low number of rules its probably not worth it, have to check
 * keeping track of which line we are on is problematic if a token consumes a partial newline, so only \r in \r\n. Also it clutters the code and not everyone will need it. -> Give the user the power to track newlines. Unfortunately the user will have to do extra work on the newlines if tokens consume them and still be aware of the possibility that a token consumes half a newline. 

Now I want to add a context so we can allow certain keywords only in certain situations or create tokens which are defined recursively