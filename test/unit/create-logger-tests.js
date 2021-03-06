'use strict';
/* global describe, it*/
const intercept = require('intercept-stdout');
const fs = require('fs');
const should = require('should');
const tools = require('../../lib/index');

function filterLog(log) {
  return log.split('\n')
    .filter(line => line.length > 0);
}

function getLogList(filename) {
  const log = fs.readFileSync(filename, 'utf-8');
  const list = filterLog(log)
    .map(line => JSON.parse(line));

  return list;
}

describe('.createLogger', function () {
  it('should create a rotating-file logger', function (done) {
    //Clean the files
    if (fs.existsSync('./logs/test-log-dir/fatal.log'))
      fs.truncateSync('./logs/test-log-dir/fatal.log', 0);
    if (fs.existsSync('./logs/test-log-dir/error.log'))
      fs.truncateSync('./logs/test-log-dir/error.log', 0);
    if (fs.existsSync('./logs/test-log-dir/warn.log'))
      fs.truncateSync('./logs/test-log-dir/warn.log', 0);
    if (fs.existsSync('./logs/test-log-dir/info.log'))
      fs.truncateSync('./logs/test-log-dir/info.log', 0);
    if (fs.existsSync('./logs/test-log-dir/debug.log'))
      fs.truncateSync('./logs/test-log-dir/debug.log', 0);
    if (fs.existsSync('./logs/test-log-dir/trace.log'))
      fs.truncateSync('./logs/test-log-dir/trace.log', 0);

    let logger = tools.createLogger({
      name: 'app log name',
      logLevels: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
      logOutput: 'rotating-file',
      logDirectory: './logs/test-log-dir'
    });

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.fatal('fatal');

    setTimeout(function () {
      let traceLogList = getLogList('./logs/test-log-dir/trace.log');
      let debugLogList = getLogList('./logs/test-log-dir/debug.log');
      let infoLogList = getLogList('./logs/test-log-dir/info.log');
      let warnLogList = getLogList('./logs/test-log-dir/warn.log');
      let errorLogList = getLogList('./logs/test-log-dir/error.log');
      let fatalLogList = getLogList('./logs/test-log-dir/fatal.log');

      //trace.log
      should.equal(traceLogList.length, 6);
      should.equal(traceLogList[0].name, 'app log name');
      should.equal(traceLogList[0].message, 'trace');
      should.equal(traceLogList[1].name, 'app log name');
      should.equal(traceLogList[1].message, 'debug');
      should.equal(traceLogList[2].name, 'app log name');
      should.equal(traceLogList[2].message, 'info');
      should.equal(traceLogList[3].name, 'app log name');
      should.equal(traceLogList[3].message, 'warn');
      should.equal(traceLogList[4].name, 'app log name');
      should.equal(traceLogList[4].message, 'error');
      should.equal(traceLogList[5].name, 'app log name');
      should.equal(traceLogList[5].message, 'fatal');

      //debug.log
      should.equal(debugLogList.length, 5);
      should.equal(debugLogList[0].name, 'app log name');
      should.equal(debugLogList[0].message, 'debug');
      should.equal(debugLogList[1].name, 'app log name');
      should.equal(debugLogList[1].message, 'info');
      should.equal(debugLogList[2].name, 'app log name');
      should.equal(debugLogList[2].message, 'warn');
      should.equal(debugLogList[3].name, 'app log name');
      should.equal(debugLogList[3].message, 'error');
      should.equal(debugLogList[4].name, 'app log name');
      should.equal(debugLogList[4].message, 'fatal');

      //info.log
      should.equal(infoLogList.length, 4);
      should.equal(infoLogList[0].name, 'app log name');
      should.equal(infoLogList[0].message, 'info');
      should.equal(infoLogList[1].name, 'app log name');
      should.equal(infoLogList[1].message, 'warn');
      should.equal(infoLogList[2].name, 'app log name');
      should.equal(infoLogList[2].message, 'error');
      should.equal(infoLogList[3].name, 'app log name');
      should.equal(infoLogList[3].message, 'fatal');

      //warn.log
      should.equal(warnLogList.length, 3);
      should.equal(warnLogList[0].name, 'app log name');
      should.equal(warnLogList[0].message, 'warn');
      should.equal(warnLogList[1].name, 'app log name');
      should.equal(warnLogList[1].message, 'error');
      should.equal(warnLogList[2].name, 'app log name');
      should.equal(warnLogList[2].message, 'fatal');

      //error.log
      should.equal(errorLogList.length, 2);
      should.equal(errorLogList[0].name, 'app log name');
      should.equal(errorLogList[0].message, 'error');
      should.equal(errorLogList[1].name, 'app log name');
      should.equal(errorLogList[1].message, 'fatal');

      //fatal.log
      should.equal(fatalLogList.length, 1);
      should.equal(fatalLogList[0].name, 'app log name');
      should.equal(fatalLogList[0].message, 'fatal');

      done();
    }, 50);
  });
  it('should create a standard-streams logger', function (done) {
    let logger = tools.createLogger({
      name: 'app log name',
      logLevels: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
      logOutput: 'standard-streams',
      logDirectory: './test-log-dir'
    });

    let logText = '';
    let unhook;
    let logLines;

    try {
      unhook = intercept(function (txt) {
        logText += txt;
        return '';
      });
      //Fatal
      logger.fatal('fatal');
      logLines = filterLog(logText);
      should.equal(logLines.length, 6);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'fatal');
      }
      logText = '';

      //Error
      logger.error('error');
      logLines = filterLog(logText);
      should.equal(logLines.length, 5);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'error');
      }
      logText = '';

      //Warn
      logger.warn('warn');
      logLines = filterLog(logText);
      should.equal(logLines.length, 4);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'warn');
      }
      logText = '';

      //Info
      logger.info('info');
      logLines = filterLog(logText);
      should.equal(logLines.length, 3);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'info');
      }
      logText = '';

      //Debug
      logger.debug('debug');
      logLines = filterLog(logText);
      should.equal(logLines.length, 2);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'debug');
      }
      logText = '';

      //Trace
      logger.trace('trace');
      logLines = filterLog(logText);
      should.equal(logLines.length, 1);
      for (let line of logLines) {
        let log = JSON.parse(line);
        should.equal(log.name, 'app log name');
        should.equal(log.message, 'trace');
      }
      logText = '';

    } finally {
      if (unhook) {
        unhook();
      }
    }

    done();
  });
  it('fail for invalid arguments', function (done) {
    (function createLogger(){
      tools.createLogger({
        name: 'app log name',
        logLevels: ['invalid-level', 'error', 'warn', 'info'],
        logOutput: 'standard-streams',
        logDirectory: './test-log-dir'
      });}).should.throw();

    (function createLogger(){
      tools.createLogger({
        name: 'app log name',
        logLevels: ['fatal', 'error', 'warn', 'info'],
        logOutput: 'invalid-output',
        logDirectory: './test-log-dir'
      });}).should.throw();

    done();
  });
});
