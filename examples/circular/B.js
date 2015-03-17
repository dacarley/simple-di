'use strict';

var di = require('../../index.js');

di.register('B', function(A) {
	this.ping = function() {
		return A.ping();
	}
});