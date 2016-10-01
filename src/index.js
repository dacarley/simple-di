import _ from "lodash";
import loader from "./loader";
import Instantiator from "./instantiator";

const modules = {};

export default {
    get: getInstance,
    getByTag,
    register,
    registerTransient,
    load: loader.load,
    invoke
};

function getInstance(name) {
    const instantiator = new Instantiator(modules);
    return instantiator.getInstance(name);
}

function getByTag(tag) {
    const instances = _(modules)
        .filter(module => module.tags.indexOf(tag) !== -1)
        .map(module => [module.name, getInstance(module.name)])
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
    const matches = name.match(/\s*([^(\s]*)\s*(\([^)]*\))?/);
    name = matches[1];
    let tags = _.trim(matches[2] || "", "()").split(",");
    tags = tags.map(tag => tag.trim());

    if (modules[name]) {
        throw new Error(`A module named '${name}' has already been registered!`);
    }

    modules[name] = {
        name,
        options: {
            transient
        },
        tags,
        func
    };
}

function getFunctionName(func) {
    const text = func.toString();
    const space = text.indexOf(" ");
    const open = text.indexOf("(");
    const name = text.substring(space + 1, open);
    return name || "anonymous function";
}

function invoke(func) {
    // Create a transient module for this function.
    const module = {
        name: `simple di invoked function: ${getFunctionName(func)}`,
        options: {
            transient: true
        },
        func
    };

    // Getting an instance of the transient module will cause 'func' to be invoked.
    const instantiator = new Instantiator(modules);
    const value = instantiator.instantiate(module, {
        wrap_return: true
    });
    return value.return_value;
}
