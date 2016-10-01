import _ from "lodash";

export default class Instantiator {
    constructor(modules) {
        this._stack = [];
        this._modules = modules;
    }

    getInstance(name) {
        const module = this._modules[name];
        if (!module) {
            return undefined;
        }

        let instance = module.instance;
        if (!instance) {
            instance = this.instantiate(module);
            if (!module.options.transient) {
                module.instance = instance;
            }
        }

        return instance;
    }

    instantiate(module, options) {
        options = options || {};

        const index = this._stack.findIndex(item => item === module.name);

        if (index >= 0) {
            throw new Error(`Circular dependency found! ${this._getDependencyChan(module.name, index)}`);
        }

        this._stack.push(module.name);

        function Factory(args) {
            let value = module.func.apply(this, args);

            if (options.wrap_return) {
                value = {
                    return_value: value
                };
            }

            return value;
        }

        Factory.prototype = module.func.prototype;

        const params = this._getParams(module);

        const instance = new Factory(params);
        this._stack.pop();

        return instance;
    }

    _getDependencyChan(name, start) {
        this._stack.push(name);
        return this._stack.slice(start || 0).join(" -> ");
    }

    _getParams(module) {
        const func = module.func;
        const params_text = func.toString().match(/.*?\(([^)]*)\).*{/)[1];
        const param_names = _(params_text.split(","))
            .map(param_name => {
                param_name = param_name.trim();
                return param_name === "" ? null : param_name;
            })
            .compact()
            .value();

        const params = param_names.map(param_name => {
            let param;
            if (module.options.transient && param_name === "__Owner") {
                param = this._stack.slice(-2,-1)[0];
            } else {
                param = this.getInstance(param_name);
            }

            if (!param) {
                throw new Error(`Could not resolve '${param_name}'! ${this._getDependencyChan(param_name)}`);
            }

            return param;
        });

        return params;
    }
}
