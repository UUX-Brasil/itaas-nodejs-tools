'use strict';

const tools = require('./index');

class HttpStatusHelper {
  static isHttpStatus (status) {
    if (!tools.number.isInt32(status)) {
      return false;
    }
    
    let statusInt = tools.number.parseInt32(status);
    
    if (statusInt < 100 || statusInt > 599) {
      return false;
    }

    return true;
  }

  static isClientError(status) {
    let errorClass = HttpStatusHelper.getClass(status);

    return errorClass === 4;
  }

  static isServerError(status) {
    let errorClass = HttpStatusHelper.getClass(status);
    
    return errorClass === 5;
  }

  static isHttpError(status) {
    return HttpStatusHelper.isClientError(status) || HttpStatusHelper.isServerError(status);
  }

  static getClass(status) {
    if (!tools.number.isInt32(status)) {
      throw new Error(`Status should be an integer, got: ${status}`);
    }
    
    if (!HttpStatusHelper.isHttpStatus(status)) {
      throw new Error(`Status should be between 100 and 599, got: ${status}`);
    }

    return Math.floor(tools.number.parseInt32(status) / 100);
  }
}

module.exports = HttpStatusHelper;