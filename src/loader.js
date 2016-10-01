import _ from "lodash";
import glob from "glob";
import caller from "caller";
import path from "path";
import fs from "fs";

export default {
    load
};

const loadedPaths = {};

function exists(filepath) {
    try {
        fs.accessSync(filepath);
        return true;
    } catch (_err_) {
        return false;
    }
}

function load() {
    const cwd = path.dirname(caller());

    if (arguments.length === 1 || arguments.length === 2) {
        return loadWithPatterns(cwd, arguments[0], arguments[1]);
    }

    loadFromDir(cwd);
}

function loadFromDir(cwd) {
    if (loadedPaths[cwd]) {
        return;
    }

    loadedPaths[cwd] = true;

    const configPath = path.join(cwd, ".simple-di.json");
    if (loadFromConfig(cwd, configPath)) {
        return;
    }

    const pkg = path.join(cwd, "package.json");
    if (exists(pkg)) {
        return;
    }

    loadFromDir(path.resolve(cwd, ".."));
}

function loadFromConfig(cwd, filepath) {
    if (!exists(filepath)) {
        return false;
    }

    const config = require(filepath);

    const patterns = config.load.filter(item => item[0] !== "!");

    const patternsToIgnore = _(config.load)
        .map(item => item[0] === "!" ? item.slice(1) : "")
        .compact()
        .value();

    loadWithPatterns(cwd, patterns, patternsToIgnore);

    return config.root;
}

function loadWithPatterns(cwd, patterns, patternsToIgnore) {
    if (!Array.isArray(patterns)) {
        patterns = [patterns];
    }

    if (!Array.isArray(patternsToIgnore)) {
        patternsToIgnore = [patternsToIgnore];
    }

    // Fix up all the ignore patterns.
    patternsToIgnore = patternsToIgnore.map(pattern => path.resolve(`${cwd}/${pattern}`));

    const options = {
        nodir: true,
        cwd,
        ignore: patternsToIgnore,
        realpath: true,
        symlinks: {},
        statCache: {},
        realpathCache: {},
        cache: {}
    };

    _(patterns)
        .flatMap(pattern => glob.sync(pattern, options))
        .each(require);
}
