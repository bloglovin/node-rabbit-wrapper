// Tests need a working rabbit server on localhost to run

var rabbit = require('./../index');
var config = {host: "amqp://localhost"};
var con = new rabbit(config);
var expect = require('chai').expect;
var sinon = require('sinon');

describe('Rabbit wrapper', function () {
  describe('Connection', function () {
    it('should emit event connected', function (done) {
      con.eventer.once('connected', function (e) {
        done();
      });
    });

    it('should reconnect on error', function (done) {
      var clock = sinon.useFakeTimers();

      con.eventer.once('error', function (e) {
        con.eventer.once('connected', function () {
          done();
        });
      });

      con.eventer.emit('error');
      clock.tick(1100);
      clock.restore();
    });

    it('should only try to reconnect x times on error', function () {
      var rabbiter = new rabbit(config);
      var fn = function () {
        rabbiter.connect((rabbiter.max_retries + 1));
      };

      expect(fn).to.throw(/Too many/);
    });

    it('should fail first time', function (done) {
      var rabbiter = new rabbit({host: "amqp://nohost"});
      rabbiter.max_retries = 1;

      rabbiter.eventer.on('connect_failed', function (e) {
        done();
      });
    });
  });

  describe('go', function () {
    it('Should have a channel', function (done) {
      con.go(function (err, channel) {
        expect(err).to.equal(null);
        expect(channel).to.be.a('object');
        done();
      });
    });

    it('should set up new channel on error', function (done) {
      var rabbiter = new rabbit(config);
      var spy = sinon.spy();

      rabbiter.go(function (ch) {
        spy(ch);
        var clock = sinon.useFakeTimers();
        clock.tick(1100);
        expect(spy.calledTwice).to.be.ok;
        clock.restore();
        done();
      });

      rabbiter.eventer.emit('error', 'Error');
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
