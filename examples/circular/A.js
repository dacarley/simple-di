'use strict';

var di = require('../../index.js');

di.declare('A', function(B) {
	this.ping = function() {
		return B.ping();
	}
});