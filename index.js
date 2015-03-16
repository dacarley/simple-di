'use string';

var _ = require('lodash');

var modules = {};

module.exports = {
    get: get,
    declare: declare
};

function get(name) {
    var module = modules[name];
    if (!module.instance) {
        module.instance = instantiate(module);
    }

    return module.instance;
}

function declare(name, func) {
    modules[name] = {
        name: name,
        func: func
    }
}

function instantiate(module) {
    var text = module.func.toString();
    var open = text.indexOf('(');
    var close = text.indexOf(')');
    var params_text = text.substring(open + 1, close);
    var params = params_text.split(',');
    params = _(params)
        .map(function(param) {
            param = param.trim();
            return param === "" ? null : get(param);
        })
        .compact()
        .value();

    function injector(args) {
        return module.func.apply(this, args);
    }

    injector.prototype = module.func.prototype;

    return new injector(params);
}
