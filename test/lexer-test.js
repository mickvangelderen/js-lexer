var expect = require('chai').expect;

var Lexer = require('../lib/lexer');

var rules = [{
	regex: /\s+/gm,
}, {
	regex: /(\d*\.\d+)/g,
	evaluate: function(match) { return { index: match.index, type: 'real', value: +match[1] }; }
}, {
	regex: /(\d+)/g,
	evaluate: function(match) { return { index: match.index, type: 'integer', value: +match[1] }; }
}];

describe('lib/lexer', function() {

	it('should return an integer', function(done) {
		var l = new Lexer(rules);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				index: 0, type: 'integer', value: 312
			});
			done();
		});
		l.write('312');
		l.end();
	});

	it('should return a real', function(done) {
		var l = new Lexer(rules);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				index: 0, type: 'real', value: 3.14
			});
			done();
		});
		l.write('3.14');
		l.end();
	});

	it('should concat buffers if a regex matches until the end', function(done) {
		var l = new Lexer(rules);
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				index: 0, type: 'real', value: 3.1415
			});
			done();
		});
		l.write('3.14');
		l.write('15');
		l.end();
	});

	it('should mess up if the maximum match length is too small', function(done) {
		var l = new Lexer(rules, {
			maximumMatchLength: 4
		});
		var results = [{
			index: 0, type: 'real', value: 3.14
		}, {
			index: 4, type: 'integer', value: 15
		}];
		l.on('data', function(data) {
			expect(data).to.deep.equal(results.shift());
			if (results.length === 0) done();
		});
		l.write('3.14');
		l.write('15');
		l.end();
	});

	it('should not mess up if the maximum match length is large enough', function(done) {
		var l = new Lexer(rules, {
			maximumMatchLength: 5
		});
		l.on('data', function(data) {
			expect(data).to.deep.equal({
				index: 0, type: 'real', value: 3.1415
			});
			done();
		});
		l.write('3.14');
		l.write('15');
		l.end();
	});

	it('should detect newlines even if they are matched', function(done) {
		var l = new Lexer(rules);
		var results = [{
			index: 0, type: 'real', value: 3.14
		}, {
			index: 6, type: 'integer', value: 15
		}, {
			index: 10, type: 'integer', value: 3
		}];
		l.on('data', function(data) {
			expect(data).to.deep.equal(results.shift());
			if (results.length === 0) done();
		});
		l.write('3.14\r');
		l.write('\n15\r 3');
		l.end();
	});
});



