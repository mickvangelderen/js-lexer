var inherits = require('util').inherits;
var Transform = require('stream').Transform;
var StringDecoder = require('string_decoder').StringDecoder;

inherits(Lexer, Transform);

module.exports = Lexer;

function Lexer(tokens, options) {
	if (!(this instanceof Lexer)) return new Lexer(tokens, options);

	Transform.call(this, options);
	this._readableState.objectMode = true;

	this._decoder = new StringDecoder('utf8');
	this._tokens = tokens;
	this._remainder = '';
}

Lexer.prototype._transform = function(chunk, encoding, done) {
	chunk = this._remainder + this._decoder.write(chunk);
	var chunkl = chunk.length;
	var tokens = this._tokens;
	var tokensl = tokens.length;
	var index = 0;

	LEXING:
	while (index < chunkl) {
		for (var i = 0; i < tokensl; i++) {
			var token = tokens[i];
			var regex = token.regex;
			var match = null;
			regex.lastIndex = index;
			if ((match = regex.exec(chunk)) && match.index === index) {
				if (regex.lastIndex === chunkl) break LEXING;
				index = regex.lastIndex;
				if (token.evaluate) this.push(token.evaluate(match));
				continue LEXING;
			}
		}

		done(new Error('Unexpected string: ' + index + ' ' + chunk.substr(index, 30)));
	}

	this._remainder = chunk.substr(index);
	done();
};

Lexer.prototype._flush = function(done) {
	var chunk = this._remainder + this._decoder.end();
	var chunkl = chunk.length;
	var tokens = this._tokens;
	var tokensl = tokens.length;
	var index = 0;

	LEXING:
	while (index < chunkl) {
		for (var i = 0; i < tokensl; i++) {
			var token = tokens[i];
			var regex = token.regex;
			var match = null;
			regex.lastIndex = index;
			if ((match = regex.exec(chunk)) && match.index === index) {
				index = regex.lastIndex;
				if (token.evaluate) this.push(token.evaluate(match));
				continue LEXING;
			}
		}

		done(new Error('Unexpected string: ' + index + chunk.substr(index, 30)));
	}

	done();
};