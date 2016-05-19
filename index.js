"use strict";

var _ = require("lodash");
var glob = require("glob");
var caller = require("caller");
var path = require("path");

var modules = {};

module.exports = {
    get: getInstance,
    getByTag: getByTag,
    register: register,
    registerTransient: registerTransient,
    load: load,
    invoke: invoke
};

function getInstance(name) {
    var instantiator = new Instantiator();
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
}

function load(patterns, patterns_to_ignore) {
    if (!_.isArray(patterns)) {
        patterns = [patterns];
    }

    if (!_.isArray(patterns_to_ignore)) {
        patterns_to_ignore = [patterns_to_ignore];
    }

    var cwd = path.dirname(caller());

    // Fix up all the ignore patterns.
    patterns_to_ignore = _.map(patterns_to_ignore, function(pattern) {
        return path.resolve(cwd + "/" + pattern);
    });

    patterns.forEach(function(pattern) {
        var files = glob.sync(pattern, {
            nodir: true,
            cwd: cwd,
            ignore: patterns_to_ignore,
            realpath: true
        });
        files.forEach(function(file) {
            require(file);
        });
    });
}

function get_function_name(func) {
    var text = func.toString();
    var space = text.indexOf(" ");
    var open = text.indexOf("(");
    var name = text.substring(space + 1, open);
    return name || "anonymous function";
}

function invoke(func) {
    // Create a transient module for this function.
    var module = {
        name: "simple di invoked function: " + get_function_name(func),
        options: {
            transient: true
        },
        func: func
    };

    // Getting an instance of the transient module will cause 'func' to be invoked.
    var instantiator = new Instantiator();
    var value = instantiator.instantiate(module, {
        wrap_return: true
    });
    return value.return_value;
}

function Instantiator() {
    var self = this;

    self.stack = [];

    self.getInstance = function(name) {
        var module = modules[name];
        if (!module) {
            return undefined;
        }

        var instance = module.instance;
        if (!instance) {
            instance = self.instantiate(module);
            if (!module.options.transient) {
                module.instance = instance;
            }
        }

        return instance;
    };

    self.instantiate = function(module, options) {
        options = options || {};

        var index = _.findIndex(self.stack, function(item) {
            return item === module.name;
        });

        if (index >= 0) {
            throw new Error("Circular dependency found! " + get_dependency_chain(module.name, index));
        }

        self.stack.push(module.name);

        function Factory(args) {
            var value = module.func.apply(this, args);

            if (options.wrap_return) {
                value = {
                    return_value: value
                };
            }

            return value;
        }

        Factory.prototype = module.func.prototype;

        var params = get_params(module);

        var instance = new Factory(params);
        self.stack.pop();

        return instance;
    };

    function get_dependency_chain(name, start) {
        self.stack.push(name);
        return self.stack.slice(start || 0).join(" -> ");
    }

    function get_params(module) {
        var func = module.func;
        var text = func.toString();
        var open = text.indexOf("(");
        var close = text.indexOf(")");
        var params_text = text.substring(open + 1, close);
        var param_names = _(params_text.split(","))
            .map(function(param_name) {
                param_name = param_name.trim();
                return param_name === "" ? null : param_name;
            })
            .compact()
            .value();

        var params = _.map(param_names, function(param_name) {
            var param;
            if (module.options.transient && param_name === "__Owner") {
                param = _.nth(self.stack, -2);
            } else {
                param = self.getInstance(param_name);
            }

            if (!param) {
                throw new Error("Could not resolve '" + param_name + "'! " + get_dependency_chain(param_name));
            }

            return param;
        });

        return params;
    }
}
