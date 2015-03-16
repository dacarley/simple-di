'use strict';

var di = require('../../index.js');

di.load("**/*.js");

var A = di.get('A');

console.log('This line will never be reached, due to a circular dependency exception.  Root.ping : ' + A.ping());
