'use strict';

var di = require('../../index.js');

di.load(["**/*.js"], ["ignore_this_folder/**/*.js"]);

var circle = di.get('Circle');

console.log('A circle with a radius of 4 has an area of ' + circle.area(4));
