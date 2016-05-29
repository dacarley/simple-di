"use strict";

var _ = require("lodash");
var glob = require("glob");
var caller = require("caller");
var path = require("path");
var fs = require("fs");

module.exports = {
    load: load
};

var loadedPaths = {};

function exists(filepath) {
    try {
        fs.accessSync(filepath);
        return true;
    } catch (_err_) {
        return false;
    }
}

function load() {
    var cwd = path.dirname(caller());

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

    var configPath = path.join(cwd, ".simple-di.json");
    if (loadFromConfig(cwd, configPath)) {
        return;
    }

    var pkg = path.join(cwd, "package.json");
    if (exists(pkg)) {
        return;
    }

    loadFromDir(path.resolve(cwd, ".."));
}

function loadFromConfig(cwd, filepath) {
    if (!exists(filepath)) {
        return false;
    }

    var config = require(filepath);

    var patterns = _.filter(config.load, function(item) {
        return item[0] !== "!";
    });

    var patternsToIgnore = _(config.load)
        .map(function(item) {
            return item[0] === "!" ? item.slice(1) : "";
        })
        .compact()
        .value();

    loadWithPatterns(cwd, patterns, patternsToIgnore);

    return config.root;
}

function loadWithPatterns(cwd, patterns, patternsToIgnore) {
    if (!_.isArray(patterns)) {
        patterns = [patterns];
    }

    if (!_.isArray(patternsToIgnore)) {
        patternsToIgnore = [patternsToIgnore];
    }

    // Fix up all the ignore patterns.
    patternsToIgnore = _.map(patternsToIgnore, function(pattern) {
        return path.resolve(cwd + "/" + pattern);
    });

    var options = {
        nodir: true,
        cwd: cwd,
        ignore: patternsToIgnore,
        realpath: true,
        symlinks: {},
        statCache: {},
        realpathCache: {},
        cache: {}
    };

    _(patterns)
        .flatMap(function(pattern) {
            return glob.sync(pattern, options);
        })
        .each(require);
}
