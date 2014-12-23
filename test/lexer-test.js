var expect = require('chai').expect;

var Lexer = require('../lib/lexer');

var tokens = [{
	regex: /\s+/gm,
	evaluate: function() { return null; }
}, {
	regex: /(\d*\.\d+)/g,
	evaluate: function(match) { return { type: 'real', value: +match[1] }; }
}, {
	regex: /(\d+)/g,
	evaluate: function(match) { return { type: 'integer', value: +match[1] }; }
}];

describe('lib/lexer', function() {

	it('should return an integer', function(done) {
		var l = new Lexer(tokens);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				type: 'integer',
				value: 312
			});
			done()
		});
		l.write('312');
		l.end();
	});

	it('should return a real', function(done) {
		var l = new Lexer(tokens);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				type: 'real',
				value: 3.14
			});
			done()
		});
		l.write('3.14');
		l.end();
	});

	it('should concat buffers if a regex matches until the end', function(done) {
		var l = new Lexer(tokens);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				type: 'real',
				value: 3.1415
			});
			done()
		});
		l.write('3.14');
		l.write('15');
		l.end();
	});

});



