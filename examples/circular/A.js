'use strict';

var di = require('../../index.js');

di.register('A', function(B) {
	this.ping = function() {
		return B.ping();
	}
});