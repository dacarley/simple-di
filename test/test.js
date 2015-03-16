var expect = require('chai').expect;

describe("simple-di", function() {
  var di = require('../index.js');

  it("should not find a module that isn't defined", function() {
    var circle = di.get('Circle');
    expect(circle).to.not.exist;
  });

  it("should be able to instantiate a valid dependency graph", function() {
    di.load("../examples/basic/**/*.js", ["../examples/basic/app.js", "../examples/basic/ignore_this_folder/**/*"]);
    var circle = di.get('Circle');
    expect(circle).to.exist;
  });

  it("should throw an exception if there is a circular dependency", function() {
    di.load("../examples/circular/**/*.js", "../examples/circular/app.js");
    
    function getA() {
      var A = di.get('A');
    }

    expect(getA).to.throw(Error);
  });

    it("should throw an exception if there is an unresolved dependency", function() {
    di.load("../examples/unresolved/**/*.js", "../examples/unresolved/app.js");
    
    function getA() {
      var A = di.get('A');
    }

    expect(getA).to.throw(Error);
  });
});
