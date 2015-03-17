# simple-di

## Install

```
$ npm install simple-di --save
```

## Usage

Getting started is very simple.  Just create a couple node modules, require **simple-di**, register your modules, and consume them at will.

See [Basic Usage Example](#basic-usage-example) for a quick "Getting Started" example.

Currently, all modules registered with **simple-di** have a lifetime of 'app'.  This means that any module will be instantiated once and only once, and will live until your process exits.

A future release of **simple-di**

## API

### di.register(name, func)

Registers a module with the specified name, and uses the provided function as the constructor for the module instance.

**simple-di** assumes that all parameters to the function are dependencies, and will attempt to resolve them when creating the module's instance.

### di.get(name)

Requests an instance of the module with the specified name.

### di.load(patterns, patterns_to_ignore)

Causes **simple-di** to load the specified files using [require](https://nodejs.org/api/modules.html#modules_module_require_id).  Typically would be used one time during your app's startup routines to load all your modules, giving them a chance to register themselves with **simple-di**.

***patterns*** - this is a glob string, or an array of glob strings to match against.  The globs are matched using the path of the calling source file as the current working directory.  Any file that matches one of these patterns (and does not match one of the *patterns_to_ignore*) will be loaded by **simple-di**.

***patterns_to_ignore*** - this is a glob string, or an array of glob strings that should be ignored.  Any files matching these patterns will *not* be loaded.

### di.invoke(func)

Causes **simple-di** to invoke *func*, satisfying its dependencies via injection.

Provides an easy way to inject modules into a function, without needing to call **di.get(name)**.

## Error Scenarios

* **Multiple Registrations**
	* If a module with the same name is registered more than once, **simple-di** will throw an exception.
	* A future build of simple-di will provide a namespace feature that will allow for disambiguation of modules.

* **Circular Dependencies**
	* If a circular dependency is found when resolving a module, **simple-di** will throw an exception.
	* See the [Circular Dependency Example](#circular-dependency-example) for an illustration of this scenario.
	* Fixing these circular dependencies can typically be accomplished through refactoring the dependent modules, and extracting some of the functionality out into a new module.
	* A future build of simple-di may provide the ability to automatically resolve these circular dependencies through the use of proxy objects.

* **Unresolvable Dependencies**
	* If a module could not be resolved while evaluating a dependency graph, **simple-di** will throw an exception.
	* See the [Unresolvable Dependency Example](#unresolvable-dependency-example) for an illustration of this scenario.

## Basic Usage Example

***constants.js***
```javascript
var di = require('simple-di');

// Create a module called Constants that exposes the value of 'pi'.
di.register('Constants', function() {
	this.pi = 3.14159;
});
```

***circle.js***
```javascript
var di = require('simple-di');

// Note that 'Circle' depends on 'Constants'
di.register('Circle', function(Constants) {
	this.area = function(radius) {
		return Constants.pi * radius * radius;
	};
});
```

***app.js***
```javascript
var di = require('simple-di');

// This will cause simple-di to require all the specified
// files into your app's runtime workspace.
// You can also manually require your modules, or use
// a manifest system of your own design.
di.load(["**/*.js"], ["ignore_this_folder/**/*.js"]);

// Ask simple-di for the Circle module
// Circle's dependencies (in this case, Constants) will be
// automatically injected when instantiating Circle.
var circle = di.get('Circle');

// Finally, use your 'circle' instance as you would any other Javascript object.
console.log('A circle with a radius of 4 has an area of ' + circle.area(4));
```

## Circular Dependency Example

Circular dependencies occur when a series of module dependencies contain a 'loop'.

If module A depends on module B, and B in turn depends on A, then you have a circular dependency.  You will see an exception that looks like **"Circular dependency found! A -> B -> A"**.

Here's an example:

***A.js***
```javascript
var di = require('simple-di');

// Note that A depends on B
di.register('A', function(B) {
	this.ping = function() {
		return B.ping();
	}
});
```

***B.js***
```javascript
var di = require('simple-di');

// Also note that B depends on A
di.register('B', function(A) {
	this.ping = function() {
		return A.ping();
	}
});
```

***app.js***
```javascript
var di = require('simple-di');

// Require the modules
di.load("**/*.js");

// Try to get an instance of A.
// This will throw an exception, because A depends on B,
// and B depends on A. (Or 'A -> B -> A')
var A = di.get('A');

console.log('This line will never be reached.');
```

In practical terms, you're more likely to hit this scenario with a dependency graph more complicated than this.

Often, there may be many modules in the list when you see a circular dependency exception.  You might see something like **"Circular dependency found! AccountService -> AccountRepository -> AccountValidator -> AccountService"**.

Let's imagine that this circular dependency was caused because **AccountValidator** needed the *accountStatusTypes* method from **AccountService**.

A new module called **AccountHelper** can be created, and the *accountStatusType* method can be moved there.  Then, **AccountValidator** can be updated to depend on **AccountHelper** rather than **AccountService**, thus breaking the circular dependency.

The dependency graph would then look like **AccountService -> AccountRepository -> AccountValidator -> AccountHelper"**.  Additionally, **AccountService** would likely need to have **AccountHelper** added to its list of dependencies.

## Unresolvable Dependency Example

Unresolvable dependencies occur when a module depends on another module which cannot be located by **simple-di**.  You will see an exception that looks like **"Could not resolve 'C'! A -> B -> C"**.

Here's an example:

***A.js***
```javascript
var di = require('simple-di');

// Note that A depends on B.
di.register('A', function(B) {
	this.ping = B.ping;
});
```

***B.js***
```javascript
var di = require('simple-di');

// Note that B then depends on C, which is never registered.
di.register('B', function(C) {
	this.ping = C.ping;
});

```

***app.js***
```javascript
var di = require('simple-di');

// Require the modules
di.load("**/*.js");

// Try to get an instance of A.
// This will throw an exception, because A depends on B,
// and B depends on C. (Or 'A -> B -> C')
var A = di.get('A');

console.log('This line will never be reached.');

```
