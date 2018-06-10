/*
 * Filename: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src/app/helpers/paymentHelper.js
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Created Date: Sunday, May 13th 2018, 5:43:40 pm
 * Author: Anuj Gupta
 *
 * Copyright (c) 2018 Your Company
 */
const request = require('request')
const sha = require('sha256')
let PAYMENT_SERVICE_PROVIDER_BASE_URL = ''
let COLLECT_REQUEST_URI = ''
let PAYMENT_PROVIDER_SALT_KEY = ''
let PAYMENT_PROVIDER_SALT_INDEX = ''
let TXN_ID_PREFIX = ''
let COLLECT_PAYMENT_MERCHANT_ID = ''
let PAYMENT_REQUEST_TIME_OUT = ''
let PAYMENT_COLLECT_CALLBACK_URI = ''
let phonePeInstanse

function PhonePeProvider () {
  phonePeInstanse = this
}

PhonePeProvider.prototype.setConfig = function (config) {
  PAYMENT_SERVICE_PROVIDER_BASE_URL = config.PAYMENT_PROVIDER_BASE_URL
  COLLECT_REQUEST_URI = config.PAYMENT_PROVIDER_COLLECT_REQUEST_URI
  PAYMENT_PROVIDER_SALT_KEY = config.PAYMENT_PROVIDER_SALT_KEY
  PAYMENT_PROVIDER_SALT_INDEX = config.PAYMENT_PROVIDER_SALT_INDEX
  TXN_ID_PREFIX = config.PAYMENT_TRANSACTION_ID_PREFIX
  COLLECT_PAYMENT_MERCHANT_ID = config.PAYMENT_COLLECT_MERCHANT_ID
  PAYMENT_REQUEST_TIME_OUT = config.PAYMENT_COLLECT_REQUEST_TIME_OUT
  PAYMENT_COLLECT_CALLBACK_URI = config.PAYMENT_COLLECT_CALLBACK_URI
}

/**
 * Api wrapper to handle the payment callback, This api will call by  payment provider
 * @param {object} req: API request object
 * @param {object} res: API response object
 */
PhonePeProvider.prototype.collectPaymentCallback = function (req, callback) {
  const xVerfiy = req && req.headers['x-verify']
  const data = req.body.response
  const rspObj = {}

  console.log('Got Callback request with data', data, xVerfiy)
  if (!data || !xVerfiy) {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return callback(rspObj, null)
  } else {
    const shaData = sha(data + PAYMENT_PROVIDER_SALT_KEY) + '###' + PAYMENT_PROVIDER_SALT_INDEX
    if (shaData !== xVerfiy) {
      rspObj.errCode = 'INVALID_REQUEST_DATE'
      rspObj.errMsg = 'Requested data invalid.'
      rspObj.responseCode = 400
      console.log('Invalid request received, xVerify and response not matched')
      return callback(rspObj, null)
    } else {
      console.log('Valid request received')
      rspObj.responseCode = 200
      rspObj.result = {
        message: 'Request successfully verified.'
      }
      return callback(null, rspObj)
    }
  }
}

/**
 * This function helps to return base64 data to make collect payment
 * @param {object} req
 */
PhonePeProvider.prototype.getRequestBodyForCharge = function (req) {
  if (!req) {
    console.log('Invalid req object')
    return ''
  }
  const txnId = TXN_ID_PREFIX + Date.now()
  var body = {
    'merchantId': COLLECT_PAYMENT_MERCHANT_ID,
    'transactionId': txnId,
    'merchantOrderId': txnId,
    'amount': req.amount,
    'instrumentType': req.instrumentType,
    'instrumentReference': req.instrumentReference,
    'expiresIn': PAYMENT_REQUEST_TIME_OUT
  }
  return Buffer.from(JSON.stringify(body)).toString('base64')
}

/**
 * Api wrapper to handle the collect payment
 * @param {object} req: API request object
 * @param {object} res: API response object
 */
PhonePeProvider.prototype.collectPayment = function (data, callback) {
  let rspObj = {}
  if (!data || !data.instrumentType || !data.instrumentReference || !data.amount || typeof callback !== 'function') {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return callback(rspObj, null)
  } else {
    const reqBody = phonePeInstanse.getRequestBodyForCharge(data)
    console.log('Request body to call payment provider charge api', reqBody)

    var options = {
      method: 'POST',
      url: PAYMENT_SERVICE_PROVIDER_BASE_URL + COLLECT_REQUEST_URI,
      headers: {
        'Content-Type': 'application/json',
        'x-callback-url': data.callbackApi,
        'x-verify': sha(reqBody + COLLECT_REQUEST_URI + PAYMENT_PROVIDER_SALT_KEY) + '###' + PAYMENT_PROVIDER_SALT_INDEX
      },
      body: { request: reqBody },
      json: true
    }

    console.log('Req options for payment provider charge api', options)
    request(options, function (error, response, body) {
      console.log('Response from phone pay', JSON.stringify(body))
      if (!error && body && !body.success) {
        rspObj.errCode = body && body.code ? body.code : 'PAYMENT_FAILED'
        rspObj.errMsg = body && body.message ? body.message : 'Payment failed, please try again later'
        const httpStatus = body && (body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500)
        rspObj.responseCode = httpStatus
        rspObj.result = body
        return callback(rspObj, null)
      } else {
        rspObj.result = body
        rspObj.result.data && delete rspObj.result.data['merchantId']
        return callback(null, rspObj)
      }
    })
  }
}

module.exports = PhonePeProvider
