'use strict';

var di = require('../../index.js');

di.register('Circle', function(Constants) {
	this.area = function(radius) {
		return Constants.pi * radius * radius;
	};
});
