'use string';

var _ = require('lodash');
var glob = require('glob');
var caller = require('caller');
var path = require('path');

var modules = {};

module.exports = {
    get: get,
    declare: declare,
    load: load
};

function get(name) {
    var instantiator = new Instantiator();
    return instantiator.get(name);
}

function declare(name, func) {
    if (modules[name]) {
        throw new Error("A module named '" + name + "' has already been registered!");
    }

    modules[name] = {
        name: name,
        func: func
    }
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

function Instantiator() {
    var self = this;

    self.stack = [];

    self.get = function(name) {
        var module = modules[name];
        if (!module) {
            return undefined;
        }

        if (!module.instance) {
            module.instance = self.instantiate(module);
        }

        return module.instance;
    };

    self.get_dependency_chain = function(name, start) {
        self.stack.push(name);
        return self.stack.slice(start || 0).join(' -> ');
    };

    self.instantiate = function instantiate(module) {
        var index = _.findIndex(self.stack, function(item) {
            return item === module.name;
        });

        if (index >= 0) {
            throw new Error("Circular dependency found! " + self.get_dependency_chain(module.name, index));
        }

        self.stack.push(module.name);

        var text = module.func.toString();
        var open = text.indexOf('(');
        var close = text.indexOf(')');
        var params_text = text.substring(open + 1, close);
        var param_names = _(params_text.split(','))
            .map(function(param_name) {
                param_name = param_name.trim();
                return param_name == "" ? null : param_name;
            })
            .compact()
            .value();

        var params = _.map(param_names, function(param_name) {
                var param = self.get(param_name);
                if (!param) {
                    throw new Error("Could not resolve '" + param_name + "'! " + self.get_dependency_chain(param_name));
                }

                return param;
            });

        function factory(args) {
            return module.func.apply(this, args);
        }

        factory.prototype = module.func.prototype;

        var instance = new factory(params);
        module.instantiating = false;
        return instance;
    };
}
