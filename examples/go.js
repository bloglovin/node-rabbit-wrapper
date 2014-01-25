var rabbit = require('./../index')({host: "amqp://localhost"});

rabbit.go(function (channel) {
  console.log('Started!');
});
