/* jslint node: true */
'use strict';

//
// Rabbit
// ======
//
// Model to handle rabbit connections
//

var amqp = require('amqplib');
var EventEmitter = require('events').EventEmitter;

var Rabbit = function (config) {
  this.config           = config;
  this.config.heartbeat = config.heartbeat || 1;
  this.initial_timeout  = 1000;
  this.max_retries      = 30;
  this.connection       = null;
  this.eventer          = new EventEmitter();

  // Unlimited listeners
  this.eventer.setMaxListeners(100);

  // Initial connection
  this.connect(1);
};

Rabbit.prototype.connect = function (tries) {
  var self = this;

  self.connection = null;

  if (tries > this.max_retries) {
    var err = new Error('Rabbit: Too many connection attempts');
    throw err;
  }

  tries++;

  // Returns a promise of a connection
  self.connection = amqp.connect(self.config.host);

  self.connection.then(function (conn) {
    // Connected
    // Tell your friends
    self.eventer.emit('connected');
    // Reset our retry counter
    tries = 1;

    // Bind for new errors
    conn.once('error', function (e) {
      self.eventer.emit('error', e);
    });

    // If disconnect, we want to try to connect again
    self.eventer.once('error', function (e) {
      setTimeout(function () {
        self.connect.call(self, tries);
      }, self.initial_timeout);
    });
  }).then(null, function (e) {
    self.eventer.emit('connect_failed', e);
    // We end up here if the first promise
    // fails us. That is, there's no rabbit to connect to
    setTimeout(function () {
      self.connect.call(self, tries);
    }, (self.initial_timeout * (tries - 1)));
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
      onConnect(null, ch);
    });
  });

  self.eventer.once('error', function (e) {
    self.eventer.once('connected', function () {
      self.go(onConnect);
    });
  });
};

// Rabbit.prototype.disconnect = function ()

module.exports = function (config) {
  return new Rabbit(config);
};
