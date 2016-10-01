var packageJSON = require('./package.json');
require('babel-register')(packageJSON.babel);
module.exports = require('./src/index').default;
