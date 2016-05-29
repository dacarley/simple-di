"use strict";

var _ = require("lodash");
var loader = require("./loader");
var Instantiator = require("./Instantiator");

var modules = {};

module.exports = {
    get: getInstance,
    getByTag: getByTag,
    register: register,
    registerTransient: registerTransient,
    load: loader.load,
    invoke: invoke
};

function getInstance(name) {
    var instantiator = new Instantiator(modules);
    return instantiator.getInstance(name);
}

function getByTag(tag) {
    var instances = _(modules)
        .filter(function(module) {
            return _.includes(module.tags, tag);
        })
        .map(function(module) {
            return [module.name, getInstance(module.name)];
        })
        .fromPairs()
        .value();

    return instances;
}

function register(name, func) {
    return registerCore(name, func, false);
}

function registerTransient(name, func) {
    return registerCore(name, func, true);
}

function registerCore(name, func, transient) {
    var matches = name.match(/\s*([^(\s]*)\s*(\([^)]*\))?/);
    name = matches[1];
    var tags = _.trim(matches[2] || "", "()").split(",");
    tags = _.map(tags, function(tag) {
        return tag.trim();
    });

    if (modules[name]) {
        throw new Error("A module named '" + name + "' has already been registered!");
    }

    modules[name] = {
        name: name,
        options: {
            transient: transient
        },
        tags: tags,
        func: func
    };

    var end = Date.now();
}

function getFunctionName(func) {
    var text = func.toString();
    var space = text.indexOf(" ");
    var open = text.indexOf("(");
    var name = text.substring(space + 1, open);
    return name || "anonymous function";
}

function invoke(func) {
    // Create a transient module for this function.
    var module = {
        name: "simple di invoked function: " + getFunctionName(func),
        options: {
            transient: true
        },
        func: func
    };

    // Getting an instance of the transient module will cause 'func' to be invoked.
    var instantiator = new Instantiator(modules);
    var value = instantiator.instantiate(module, {
        wrap_return: true
    });
    return value.return_value;
}
