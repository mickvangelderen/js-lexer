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

	this._maximumMatchLength = options.maximumMatchLength || (1<<15) - 1;
	this._decoder = new StringDecoder('utf8');
	this._rules = rules;
	this._remainder = '';
	this._index = 0;
}

Lexer.prototype._transform = function(chunk, encoding, done) {
	chunk = this._remainder + this._decoder.write(chunk);
	
	try { this._remainder = this._process(chunk, false); }
	catch (e) { done(e); }

	done();
};

Lexer.prototype._flush = function(done) {
	var chunk = this._remainder + this._decoder.end();
	
	try { this._process(chunk, true); }
	catch (e) { done(e); }

	done();
};

Lexer.prototype._process = function(chunk, last) {
	var rules = this._rules;
	var rulesl = rules.length;

	// Initialize matches searching from local index 0
	var matches = [];
	for (var i = 0; i < rulesl; i++) {
		var regex = rules[i].regex;
		matches[i] = (regex.lastIndex = 0, regex.exec(chunk));
	}

	var index = 0;
	var end = chunk.length - (last ? 0 : this._maximumMatchLength - 1);

	// console.log('LEXING', JSON.stringify(chunk));
	LEXING: while (index < end) {

		// console.log('\tITERATING', index, '<', end);
		for (var i = 0; i < rulesl; i++) {
			
			var match = matches[i];
			// Continue with next rule if no match available in the remainder of this chunk
			if (match === null) continue;

			var rule = rules[i];
			var regex = rule.regex;
			// console.log('\t\tREMEMBERED', rule.type || rule.regex, match);

			// If the match index was before the current index, try to match again from the current index
			if (match.index < index) {
				regex.lastIndex = index;
				matches[i] = match = regex.exec(chunk);
				// console.log('\t\tADVANCED', rule.type || rule.regex, match);
				// Continue with the next rule if no match available in the remainder of this chunk
				if (match === null) continue;
			}

			// Continue with the next rule if the match index is after the current index meaning there are characters to be processed first
			if (match.index > index) continue;
			// console.log('\t\tMATCHED', rule.type || rule.regex, match);

			// Create token if there is an evaluator
			if (rule.evaluate) {
				match.index = this._index + index; // set match index to the global index
				var token = rule.evaluate(match);
				if (token !== undefined) this.push(token);
			}

			// Advance the index past this match and update line number and column
			index = regex.lastIndex;

			continue LEXING;
		}

		throw new Error('Unexpected string starting at ' + this._line + ':' + (1 + index - this._lineIndex) + ' ' + JSON.stringify(chunk.substr(index, 30)));
	}

	// Update indexes because of discarding a portion of our input
	this._index += index; // advance global index by index

	return chunk.substr(index);
}