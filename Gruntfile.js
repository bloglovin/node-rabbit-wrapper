/*jslint node: true */
'use strict';

var lintlovin = require('lintlovin');

module.exports = function (grunt) {
  lintlovin.initConfig(grunt, {}, {
    integrationWatch : true,
    jsFiles : ['examples/**/*.js']
  });
};
