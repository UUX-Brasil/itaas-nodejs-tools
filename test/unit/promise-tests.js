'use strict';
/* global describe, it*/

const assert = require('assert');
const tools = require('../../lib/index');

describe('.promise', function () {
  describe('.any', function () {
    it('resolve when all promises resolves', function (done) {
      let promise1 = Promise.resolve(1);
      let promise2 = Promise.resolve(2);
      let promise3 = Promise.resolve(3);

      tools.promise.any([promise1, promise2, promise3])
        .then((value) => {

          let hasValue = [1, 2, 3].indexOf(value) > -1;

          assert(hasValue, 'should resolve with 1, 2 or 3');

          done();
        })
        .catch(done);
    });
    it('resolve when one promise reject', function (done) {
      let promise1 = Promise.reject(1);
      let promise2 = Promise.resolve(2);
      let promise3 = Promise.resolve(3);

      tools.promise.any([promise1, promise2, promise3])
        .then((value) => {

          let hasValue = [2, 3].indexOf(value) > -1;

          assert(hasValue, 'should resolve with 2 or 3');

          done();
        })
        .catch(done);
    });
    it('resolve when more than one promise reject', function (done) {
      let promise1 = Promise.reject(1);
      let promise2 = Promise.resolve(2);
      let promise3 = Promise.reject(3);

      tools.promise.any([promise1, promise2, promise3])
        .then((value) => {

          let hasValue = value === 2;

          assert(hasValue, 'should resolve with 2');

          done();
        })
        .catch(done);
    });
    it('resolve with only one promise', function (done) {
      let promise1 = Promise.resolve(1);

      tools.promise.any([promise1])
        .then((value) => {

          let hasValue = value === 1;

          assert(hasValue, 'should resolve with 1');

          done();
        })
        .catch(done);
    });
    it('reject when all is rejected', function (done) {
      let promise1 = Promise.reject(1);
      let promise2 = Promise.reject(2);
      let promise3 = Promise.reject(3);

      tools.promise.any([promise1, promise2, promise3])
        .then((value) => {
          done(new Error('Should not resolve when all promises was rejected'));
        })
        .catch((value) => {
          let isEquals = value.indexOf(1) > -1
            && value.indexOf(2) > -1
            && value.indexOf(3) > -1;

          assert.ok(isEquals, 'should have all rejected values');

          done();
        }).catch(done);
    });
    it('reject with only one promise', function (done) {
      let promise1 = Promise.reject(1);

      tools.promise.any([promise1])
        .then((value) => {
          done(new Error('Should reject when there is only one rejected promise'));
        })
        .catch((value) => {
          let isEquals = value[0] === 1;

          assert.ok(isEquals, 'should have all rejected values');

          done();
        }).catch(done);
    });
    it('resolve when not a promise', function (done) {
      let notPromise1 = 1;

      tools.promise.any([notPromise1]).then((value) => {
        assert(value, 1);
        done();
      }).catch(done);
    });
  });
});
