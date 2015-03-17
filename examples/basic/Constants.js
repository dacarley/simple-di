'use strict';

var di = require('../../index.js');

di.register('Constants', function() {
	this.pi = 3.14159;
});
