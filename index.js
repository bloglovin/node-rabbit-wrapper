/* jslint node: true */
'use strict';

//
// Rabbit
// ======
//
// Model to handle rabbit connections
//

var amqp = require('amqplib');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Rabbit = function (config) {
  this.config           = config;
  this.log              = config.log || console.error.bind(console);
  this.config.heartbeat = config.heartbeat || 1;
  this.initial_timeout  = config.timeout || 200;
  this.max_timeout      = config.maxTimeout || 5000;
  this.log_interval     = config.logInterval || 10000;
  this.max_retries      = config.maxRetries !== undefined ? config.maxRetries : 30;
  this.connection       = null;
  this.eventer          = new EventEmitter();

  // Unlimited listeners
  this.eventer.setMaxListeners(100);

  // Initial connection
  this.connect();
};

Rabbit.prototype.connect = function (tries, nextLog) {
  var self = this;

  tries = tries || 0;

  self.connection = null;

  if (this.max_retries !== 0 && tries > this.max_retries) {
    var err = new Error('Rabbit: Too many connection attempts');
    throw err;
  }

  // Returns a promise of a connection
  self.connection = amqp.connect(self.config.host);

  self.connection.then(function (conn) {
    // Connected
    // Tell your friends
    self.eventer.emit('connected');

    // Bind for new errors
    conn.once('error', function (e) {
      self.eventer.emit('error', e);
    });

    if (tries) {
      self.log(['rabbit', 'recovery'], {
        message: 'Rabbitmq connection re-opened',
      });
    }

    // If disconnect, we want to try to connect again
    self.eventer.once('error', function (err) {
      self.log(['rabbit', 'error'], {
        message: 'Rabbitmq connection lost',
        error: err.message,
      });

      setTimeout(function () {
        self.connect(1, Date.now() + self.log_interval);
      }, self.initial_timeout * Math.random());
    });
  }).then(null, function (err) {
    if (Date.now() >= nextLog) {
      self.log(['rabbit', 'error'], {
        message: util.format('Rabbitmq connection still offline, %d attempts made to reconnect', tries),
        error: err.message,
      });
      nextLog = Date.now() + self.log_interval;
    }

    var backOff = Math.min(self.max_timeout,
      self.initial_timeout + (self.initial_timeout * tries * (0.5 + Math.random())));

    // We end up here if the first promise
    // fails us. That is, there's no rabbit to connect to
    setTimeout(function () {
      self.connect(tries+1, nextLog);
    }, backOff);
    self.eventer.emit('connect_failed', err);
  });

};

//
// ## run rabbit
//
// example:
//
// ```
// rabbit(function (err, channel) {
//   this.setAllUserBindings(channel, function () {});
// });
// ```
//
// * **onConnect** callback(err, channel) runs this when we have a connection to rabbit
//
Rabbit.prototype.go = function (onConnect) {
  var self = this;

  // Use the promise of a connection
  self.connection.then(function (conn) {
    // Set up a channel to rabbit (some sort of session)
    var channel = conn.createChannel();

    // Bind our precious rabbits in shayol gul
    channel.then(function (ch) {
      process.nextTick(function () {
        onConnect(null, ch);
      });
    });
  });

  self.eventer.once('error', function () {
    self.eventer.once('connected', function () {
      self.go(onConnect);
    });
  });
};

// Rabbit.prototype.disconnect = function ()

module.exports = function (config) {
  return new Rabbit(config);
};
