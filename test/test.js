"use strict";

var _ = require("lodash");
var chai = require("chai");
var expect = chai.expect;
chai.should();
var intercept = require("intercept-stdout");

/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression
/*jshint -W098 */ // {var} is defined but never used

describe("simple-di", function() {
    var di;
    var require_cache_keys;

    beforeEach(function() {
        // Take a snapshot of the currently 'require'd modules, so we can remove anything that gets require'd during this test run.
        require_cache_keys = _.keys(require.cache);
        di = require("../index.js");
    });

    afterEach(function() {
        // Remove any files that have been require'd during this test run.
        var new_keys = _.keys(require.cache);
        var added = _.difference(new_keys, require_cache_keys);
        _.each(added, function(key) {
            delete require.cache[key];
        });
    });

    it("should not find a module that isn't defined", function() {
        var circle = di.get("Circle");
        expect(circle).to.not.exist;
    });

    it("should be able to instantiate a valid dependency graph", function() {
        di.load("../examples/basic/**/*.js", ["../examples/basic/app.js", "../examples/basic/ignore_this_folder/**/*"]);
        var circle = di.get("Circle");
        expect(circle).to.exist;
    });

    it("should throw an exception if there is a circular dependency", function() {
        di.load("../examples/circular/**/*.js", "../examples/circular/app.js");

        function getA() {
            return di.get("A");
        }

        expect(getA).to.throw("Circular dependency found! A -> B -> A");
    });

    it("should throw an exception if there is an unresolved dependency", function() {
        var A = di.get("A");
        expect(A).to.not.exist;

        di.load("../examples/unresolvable/**/*.js", "../examples/unresolvable/app.js");

        function getA() {
            return di.get("A");
        }

        expect(getA).to.throw("Could not resolve 'C'! A -> B -> C");
    });

    it("should throw an exception if the same module is declared multiple times", function() {
        var A = di.get("A");
        expect(A).to.not.exist;

        function register_two() {
            di.register("A", function() {});
            di.register("A", function() {});
        }

        expect(register_two).to.throw("A module named 'A' has already been registered!");
    });

    it("should allow for invoking a function with injection", function() {
        di.register("Math", function() {
            this.square = function(x) {
                return x * x;
            };
        });

        var sixteen = di.invoke(function(Math) {
            return Math.square(4);
        });

        expect(sixteen).to.equal(16);
    });

    it("should allow for tagging", function() {
        di.register("FirstNames (NameSource)", function() {
            this.getNames = function() {
                return ["Dave", "Chris"];
            };
        });

        di.register("LastNames (NameSource)", function() {
            this.getNames = function() {
                return ["Carley", "Bergstrom"];
            };
        });

        var sources = di.getByTag("NameSource");

        sources.should.have.keys("FirstNames", "LastNames");

        var names = _.map(sources, function(source) {
            return source.getNames();
        });
        names = _.flatten(names);

        expect(names).to.have.members(["Dave", "Chris", "Carley", "Bergstrom"]);
    });

    it("should allow for tagging with multiple tags", function() {
        di.register("FirstNames (NameSource, FirstNameSource)", function() {
            this.getNames = function() {
                return ["Dave", "Chris"];
            };
        });

        di.register("LastNames (NameSource)", function() {
            this.getNames = function() {
                return ["Carley", "Bergstrom"];
            };
        });

        var sources = di.getByTag("FirstNameSource");

        sources.should.have.keys("FirstNames");

        var names = _.map(sources, function(source) {
            return source.getNames();
        });
        names = _.flatten(names);

        expect(names).to.have.members(["Dave", "Chris"]);
    });

    it("should allow registering transient modules", function() {
        di.registerTransient("MyTransient", function() {
            var id = Math.ceil(Math.random() * 1000000);
            this.getId = function() {
                return id;
            };
        });

        var firstInstance = di.get("MyTransient");
        var secondInstance = di.get("MyTransient");

        firstInstance.getId().should.not.equal(secondInstance.getId());
    });

    it("should allow the __Owner parameter for transient modules", function() {
        di.registerTransient("MyTransient", function(__Owner) {
            this.getOwner = function() {
                return __Owner;
            };
        });

        di.register("MySingleton", function(MyTransient) {
            this.getTransientOwner = function() {
                return MyTransient.getOwner();
            };
        });

        di.register("AnotherSingleton", function(MySingleton) {
            this.getTransientOwner = function() {
                return MySingleton.getTransientOwner();
            }
        });

        var singleton = di.get("AnotherSingleton");

        singleton.getTransientOwner().should.equal("MySingleton");
    });

    it("should not allow the __Owner parameter for non-transient modules", function() {
        di.register("MySingleton", function(__Owner) {
            this.getOwner = function() {
                return __Owner;
            };
        });

        function getMySingleton() {
            return di.get("MySingleton");
        }

        expect(getMySingleton).to.throw("Could not resolve '__Owner'! MySingleton -> __Owner");
    });

    describe("examples", function() {
        describe("basic", function() {
            it("should succeeed", function() {

                function basic() {
                    require("../examples/basic/app.js");
                }

                var captured_text = "";
                var unhook_intercept = intercept(function(txt) {
                    captured_text += txt;
                });

                expect(basic).to.not.throw();
                expect(captured_text).to.equal("A circle with a radius of 4 has an area of 50.26544\n");
                unhook_intercept();
            });
        });

        describe("circular", function() {
            it("should throw an exception", function() {

                function circular() {
                    require("../examples/circular/app.js");
                }

                expect(circular).to.throw("Circular dependency found! A -> B -> A");
            });
        });

        describe("unresolvable", function() {
            it("should throw an exception", function() {

                function unresolvable() {
                    require("../examples/unresolvable/app.js");
                }

                expect(unresolvable).to.throw("Could not resolve 'C'! A -> B -> C");
            });
        });
    });
});
