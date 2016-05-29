var _ = require("lodash");

module.exports = Instantiator;

function Instantiator(modules) {
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
