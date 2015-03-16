'use string';

var _ = require('lodash');
var glob = require('glob');

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
    modules[name] = {
        name: name,
        func: func
    }
}

function load(patterns, patterns_to_ignore) {
    if (!_.isArray(patterns)) {
        patterns = [patterns];
    }

    patterns.forEach(function(pattern) {
        var files = glob.sync(pattern, {
            nodir: true,
            ignore: patterns_to_ignore
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
        if (!module.instance) {
            module.instance = self.instantiate(module);
        }

        return module.instance;
    };

    self.instantiate = function instantiate(module) {
        var index = _.findIndex(self.stack, function(item) {
            return item === module.name;
        });
        if (index >= 0) {
            self.stack.push(module.name);
            var msg = self.stack.slice(index).join(' -> ');
            throw new Error("Circular dependency found! " + msg);
        }

        self.stack.push(module.name);

        var text = module.func.toString();
        var open = text.indexOf('(');
        var close = text.indexOf(')');
        var params_text = text.substring(open + 1, close);
        var param_names = params_text.split(',');
        var params = _(param_names)
            .map(function(param_name) {
                param_name = param_name.trim();
                return param_name === "" ? null : self.get(param_name);
            })
            .compact()
            .value();

        function factory(args) {
            return module.func.apply(this, args);
        }

        factory.prototype = module.func.prototype;

        var instance = new factory(params);
        module.instantiating = false;
        return instance;
    };
}
