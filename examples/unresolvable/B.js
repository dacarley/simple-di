'use strict';

var di = require('../../index.js');

di.register('B', function(C) {
	this.ping = C.ping;
});
