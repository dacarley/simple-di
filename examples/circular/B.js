'use strict';

var di = require('../../index.js');

di.declare('B', function(A) {
	this.ping = function() {
		return A.ping();
	}
});