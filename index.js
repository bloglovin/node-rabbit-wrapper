/* jslint node: true */
'use strict';

//
// Rabbit
// ======
//
// Model to handle rabbit connections
//

var amqp = require('amqplib');

var Rabbit = function (config) {
  this.connection = amqp.connect(config.host);
}

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
Rabbit.prototype.go = function (onConnect, errorHandler) {
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
};

module.exports = function (config) {
  return new Rabbit(config);
};