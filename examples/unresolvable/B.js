'use strict';

var di = require('../../index.js');

di.declare('B', function(C) {
	this.ping = C.ping;
});
