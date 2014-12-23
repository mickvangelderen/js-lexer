var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var StringDecoder = require('string_decoder').StringDecoder;

inherits(Lexer, Transform);

module.exports = Lexer;

function Lexer(rules, options) {
	if (!(this instanceof Lexer)) return new Lexer(rules, options);

	Transform.call(this, options);
	this._readableState.objectMode = true;

	options || (options = {});

	this._maximumMatchLength = options.maximumMatchLength || (1<<16) - 1;
	this._decoder = new StringDecoder('utf8');
	this._rules = rules;
	this._remainder = '';
	this._lineRegex = /\r\n|\r|\n/g;
	this._lineStart = 0;
	this._line = 1;
}

Lexer.prototype._transform = function(chunk, encoding, done) {
	chunk = this._remainder + this._decoder.write(chunk);
	
	try {
		this._remainder = this._process(chunk, false);
	} catch (e) {
		done(e);
	}

	done();
};

Lexer.prototype._flush = function(done) {
	var chunk = this._remainder + this._decoder.end();
	
	try {
		this._process(chunk, true);
	} catch (e) {
		done(e);
	}

	done();
};

Lexer.prototype._process = function(chunk, last) {
	var rules = this._rules;
	var rulesl = rules.length;
	var index = 0;
	var end = chunk.length - (last ? 0 : this._maximumMatchLength - 1);
	var lineRegex = this._lineRegex; 
	var lineStart = this._lineStart;
	var lineMatch = lineRegex.test(chunk); // holds the next line end
	var line = this._line;

	LEXING:
	while (index < end) {

		// console.log('LEXING', JSON.stringify(chunk), index, '<', end);
		for (var i = 0; i < rulesl; i++) {
			var rule = rules[i];
			// console.log('MATCHING', JSON.stringify(chunk), index, '<', end, rule.regex);
			var regex = rule.regex;
			var match = null;
			regex.lastIndex = index;
			if ((match = regex.exec(chunk)) && match.index === index) {
				// console.log('MATCHED', JSON.stringify(chunk), index, '<', end, rule.regex, match);
				index = regex.lastIndex;

				// Count line ends while line-start-index <= current-index
				while(lineMatch && lineRegex.lastIndex <= index) {
					line++;
					lineStart = lineRegex.lastIndex;
					lineMatch = lineRegex.test(chunk);
				}

				if (rule.type === undefined) continue LEXING;
				var token = { line: line, column: match.index - lineStart + 1, type: rule.type };
				if (rule.value) token.value = rule.value(match);
				this.push(token);
				continue LEXING;
			}
		}

		throw new Error('Unexpected string at ' + index + ': ' + chunk.substr(index, 30));
	}

	if (!last) {
		lineStart -= index;
		lineRegex.lastIndex = lineStart > 0 ? lineStart : 0;
		this._lineStart = lineStart;
		this._line = line;
	}

	return chunk.substr(index);
}