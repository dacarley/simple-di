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
di.declare('Circle', function(Constants) {
    this.area = function(radius) {
        return Constants.pi * radius * radius;
    };
});
```

***app.js***
```javascript
var di = require('di');

// Have simple-di require all .js files in this folder and below.
di.load([__dirname + "/**/*.js"], [__dirname + "/ignore_this_folder/**/*.js"]);

var circle = di.get('Circle');
console.log("A circle with radius 4 has an area of: " + circle.area(4));
```
