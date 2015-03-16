# simple-di

simple-di is a very basic dependency injection system for Node.js.

#### Usage:

***constants.js***
```javascript
var di = require('simple-di');

di.declare('Constants', function() {
	this.pi = 3.14159;
});
```

***circle.js***
```javascript
var di = require('simple-di');

di.declare('Circle', function(Constants) {
	this.area = function(radius) {
		return Constants.pi * radius * radius;
	};
});
```

***app.js***
```javascript
var di = require('simple-di');

di.load([__dirname + "/**/*.js"], [__dirname + "/ignore_this_folder/**/*.js"]);

var circle = di.get('Circle');

console.log('A circle with a radius of 4 has an area of ' + circle.area(4));
```

#### Notes:

**simple-di** will throw an exception if:

* A module is multiply declared
* A circular dependencies.
	* Resolving these circular dependencies can typically be accomplished through refactoring the dependent modules, and extracting some of the functionality out into a new module.
* A module could not be resolved in a dependency chain.

A future build of simple-di may provide the ability to automatically resolve these circular dependencies through the use of proxy objects.
