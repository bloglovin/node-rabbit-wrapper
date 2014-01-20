// Tests need a working rabbit server on localhost to run

var rabbit = require('./../index');
var config = {host: "amqp://localhost"};
var con = new rabbit(config);
var expect = require('chai').expect;

describe('Rabbit wrapper', function () {
  describe('go', function () {
    it('Should have a channel', function (done) {
      con.go(function (err, channel) {
        expect(err).to.equal(null);
        expect(channel).to.be.a('object');
        done();
      });
    });

    it('Should be able to send, receive and ack a message', function (done) {
      con.go(function (err, channel) {
        var queue = 'node-lib-test-queue';
        channel.assertQueue(queue);

        channel.consume(queue, function (message) {
          channel.ack(message);
          var content = JSON.parse(message.content.toString());

          expect(content.type).to.equal('test');
          done();
        });

        var message = {
           type: 'test'
        };

        var buf = new Buffer(JSON.stringify(message), 'utf8');

        channel.sendToQueue(queue, buf);
      });
    });
  });
});