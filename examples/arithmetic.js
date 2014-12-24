var fs = require('fs');
var Lexer = require('../lib/lexer');

var lineNumber = 1;
var lineStart = 0;

var tokens = [{
	regex: /\r\n?|\n/g,
	evaluate: function(match) { lineNumber++; lineStart = match.index; }
}, {
	regex: /[^\S\r\n]/g,
}, {
	regex: /[+]/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'plus' }; }
}, {
	regex: /[-]/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'minus' }; }
}, {
	regex: /[*]/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'times' }; }
}, {
	regex: /\//g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'divide' }; }
}, {
	regex: /[(]/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'open' }; }
}, {
	regex: /[)]/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'close' }; }
}, {
	regex: /(\d+)/g,
	evaluate: function(match) { return { index: match.index, line: lineNumber, column: 1 + match.index - lineStart, type: 'number', value: +match[1] }; }
}];

console.log(fs.readFileSync(__dirname + '/arithmetic.txt').toString());

var lexer = new Lexer(tokens);

fs.createReadStream(__dirname + '/arithmetic.txt')
	.pipe(lexer).on('data', function(data) {
		console.log(data);
	});
