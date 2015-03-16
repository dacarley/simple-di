# simple-di

simple-di is a very basic dependency injection system for Node.js.

####Usage:

***constants.js***
```javascript
var di = require('di');

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
require('constants');
require('circle');

var circle = di.get('Circle');
console.log("A circle with radius 4 has an area of: " + circle.area(4));
```

####Notes
In non-trivial usage, you would likely use some system to automatically require all .js files in your source tree, to allow them to register themselves with simple-di.
