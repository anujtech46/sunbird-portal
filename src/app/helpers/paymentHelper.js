/*
 * Filename: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src/app/helpers/paymentHelper.js
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Created Date: Sunday, May 13th 2018, 5:43:40 pm
 * Author: Anuj Gupta
 * 
 * Copyright (c) 2018 Your Company
 */
const envVariables = require('./environmentVariablesHelper.js')
const learnerURL = envVariables.LEARNER_URL
const request = require('request')
let uuidv1 = require('uuid/v1')
const bodyParser = require('body-parser')
const sha = require('sha256')
const PAYMENT_STATUS_UPDATE_API = 'data/v1/object/update'
const PAYMENT_SERVICE_PROVIDER_BASE_URL = envVariables.PAYMENT_PROVIDER_BASE_URL
const COLLECT_REQUEST_URI = envVariables.PAYMENT_PROVIDER_COLLECT_REQUEST_URI
const PAYMENT_PROVIDER_SALT_KEY = envVariables.PAYMENT_PROVIDER_SALT_KEY
const PAYMENT_PROVIDER_SALT_INDEX = envVariables.PAYMENT_PROVIDER_SALT_INDEX
const TXN_ID_PREFIX = envVariables.PAYMENT_TRANSACTION_ID_PREFIX
const COLLECT_PAYMENT_MERCHANT_ID = envVariables.PAYMENT_COLLECT_MERCHANT_ID
const PAYMENT_REQUEST_TIME_OUT = envVariables.PAYMENT_COLLECT_REQUEST_TIME_OUT
const PAYMENT_CALLBACK_BASE_URL = envVariables.PAYMENT_COLLECT_CALLBACK_BASE_URL
const PAYMENT_COLLECT_CALLBACK_URI = envVariables.PAYMENT_COLLECT_CALLBACK_URI
const REFUND_REQUEST_BASE_URL = envVariables.PAYMENT_PROVIDER_REFUND_REQUEST_URL
const REFUND_REQUEST_URI = envVariables.PAYMENT_PROVIDER_REFUND_REQUEST_URI
const PAYMENT_REFUND_CALLBACK_URI = envVariables.PAYMENT_PROVIDER_REFUND_CALLBACK_URI
const refundTxnIdMap = {}

/**
 * Exports all the routes related to payments
 * @param {object} app 
 */
module.exports = function (app) {
  app.post('/payment' + COLLECT_REQUEST_URI, bodyParser.json({ limit: '1mb' }),
    createAndValidateRequestBody, collectPayment)

  app.post('/payment' + REFUND_REQUEST_URI, bodyParser.json({ limit: '1mb' }),
    createAndValidateRequestBody, refundPayment)

  app.all(PAYMENT_COLLECT_CALLBACK_URI, bodyParser.json({ limit: '1mb' }), createAndValidateRequestBody,
    handleCollectPaymentCallback)

  app.all(PAYMENT_REFUND_CALLBACK_URI, bodyParser.json({ limit: '1mb' }), createAndValidateRequestBody,
    handleRefundPaymentCallback)
}

/**
 * This function helps to update the payment status
 * @param {object} req: API req object 
 * @param {*} callback: Callback have 3 params(error, statusCode, successResp)
 */
function updatePaymentStatus (req, callback) {
  var rspObj = req.rspObj
  // Check required fields and type
  if (typeof req !== 'object' || typeof callback !== 'function') {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Invalid request received'
    rspObj.responseCode = 400
    return callback(errorResponse(rspObj), 400, null)
  }
  const encodedData = req.body && req.body.response // extract properties
  const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString()) // decode request
  console.log('Decode data of payment callback:', JSON.stringify(decodedData))
  if (decodedData) {
    var body = {
      entityName: 'userpayment',
      indexed: true,
      payload: {
        id: decodedData.data && decodedData.data.transactionId,
        userpaid: decodedData.code === 'PAYMENT_SUCCESS',
        paymentstatus: decodedData.code
      }
    }
    var options = {
      method: 'POST',
      url: learnerURL + PAYMENT_STATUS_UPDATE_API,
      body: {request: body},
      headers: req.headers,
      json: true
    }
    console.log('Update status of transaction', JSON.stringify(options))
    request(options, function (error, response, body) {
      if (!error && body && body.responseCode === 'OK') {
        console.log('Payment status update successfully for transaction id: ', decodedData.data.transactionId)
        return callback(null, 200, body.result)
      } else {
        console.log('Payment status update failed for transaction id: ', decodedData.data.transactionId,
          JSON.stringify(body))
        rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_PAYMENT_STATUS_FAILED'
        rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update payment status failed'
        rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
        rspObj.result = body && body.result
        var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
        var errRspObj = errorResponse(rspObj)
        return callback(errRspObj, httpStatus, false)
      }
    })
  } else {
    console.log('Invalid data received to update the request')
    rspObj.errCode = 'INVALID_REQUEST_RECEIVED'
    rspObj.errMsg = 'Invalid request received, Please try again later'
    rspObj.responseCode = 400
    var httpStatus = 400
    return callback(errorResponse(rspObj), httpStatus, false)
  }
}

/**
 * Api wrapper to handle the payment callback, This api will call by  payment provider
 * @param {object} req: API request object 
 * @param {object} res: API response object
 */
function handleCollectPaymentCallback (req, res) {
  const xVerfiy = req && req.headers['x-verify']
  const data = req.body.response
  const rspObj = req.rspObj

  console.log('Got Callback request with data', data, xVerfiy)
  if (!data || !xVerfiy) {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return res.status(400).send(errorResponse(rspObj))
  } else {
    const shaData = sha(data + PAYMENT_PROVIDER_SALT_KEY) + '###' + PAYMENT_PROVIDER_SALT_INDEX
    if (shaData !== xVerfiy) {
      rspObj.errCode = 'INVALID_REQUEST_DATE'
      rspObj.errMsg = 'Requested data invalid.'
      rspObj.responseCode = 400
      console.log('Invalid request received, xVerify and response not matched')
      return res.status(400).send(errorResponse(rspObj))
    } else {
      console.log('Valid request received')
      updatePaymentStatus(req, function () { })
      rspObj.responseCode = 200
      rspObj.result = {
        message: 'Request successfully verified.'
      }
      return res.status(200).send(successResponse(rspObj))
    }
  }
}

/**
 * This function helps to return base64 data to make collect payment
 * @param {object} req 
 */
function getRequestBodyForCharge (req) {
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
function collectPayment (req, res) {
  var rspObj = req.rspObj || {}
  var data = req.body && req.body.request
  console.log('Request received with data', JSON.stringify(data))
  if (!data || !data.instrumentType || !data.instrumentReference || !data.amount) {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return res.status(400).send(errorResponse(rspObj))
  } else {
    const reqBody = getRequestBodyForCharge(data)
    console.log('Request body to call payment provider charge api', reqBody)

    var options = {
      method: 'POST',
      url: PAYMENT_SERVICE_PROVIDER_BASE_URL + COLLECT_REQUEST_URI,
      headers: {
        'Content-Type': 'application/json',
        'x-callback-url': PAYMENT_CALLBACK_BASE_URL + PAYMENT_COLLECT_CALLBACK_URI,
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
        return res.status(400).send(errorResponse(rspObj))
      } else {
        rspObj.result = body
        rspObj.result.data && delete rspObj.result.data['merchantId']
        return res.status(200).send(successResponse(rspObj))
      }
    })
  }
}

/**
 * This middleware function is used to create and validate the request body
 * @param {Object} req 
 * @param {Object} res 
 * @param {function} next 
 */
function createAndValidateRequestBody (req, res, next) {
  req.body = req.body || {}
  req.body.ts = new Date()
  req.body.url = req.url
  req.body.path = req.route.path
  req.body.params = req.body.params ? req.body.params : {}
  req.body.params.msgid = req.headers['msgid'] || req.body.params.msgid || uuidv1()

  var rspObj = {
    apiId: 'update.content.state',
    path: req.body.path,
    apiVersion: '1.0',
    msgid: req.body.params.msgid,
    result: {},
    startTime: new Date(),
    method: req.originalMethod
  }
  var removedHeaders = ['host', 'origin', 'accept', 'referer', 'content-length', 'user-agent', 'accept-encoding',
    'accept-language', 'accept-charset', 'cookie', 'dnt', 'postman-token', 'cache-control', 'connection']

  removedHeaders.forEach(function (e) {
    delete req.headers[e]
  })
  req.headers['Authorization'] = req.headers['Authorization'] ? req.headers['Authorization']
    : 'Bearer ' + envVariables.PORTAL_API_AUTH_TOKEN
  console.log('Add Auth key', req.headers)
  req.rspObj = rspObj
  next()
}

/**
 * This is util function. Which helps to get success response
 * @param {object} data 
 */
function successResponse (data) {
  var response = {}
  response.id = data.apiId
  response.ver = data.apiVersion
  response.ts = new Date()
  response.params = getParams(data.msgid, 'successful', null, null)
  response.responseCode = data.responseCode || 'OK'
  response.result = data.result
  return response
}

/**
 * this function create error response body.
 * @param {Object} data
 * @returns {nm$_responseUtil.errorResponse.response}
 */
function errorResponse (data) {
  var response = {}
  response.id = data.apiId
  response.ver = data.apiVersion
  response.ts = new Date()
  response.params = getParams(data.msgId, 'failed', data.errCode, data.errMsg)
  response.responseCode = data.responseCode
  response.result = data.result
  return response
}

/**
 * This is util function. Which helps to get params for response
 * @param {string} msgId 
 * @param {string} status 
 * @param {string} errCode 
 * @param {string} msg 
 */
function getParams (msgId, status, errCode, msg) {
  var params = {}
  params.resmsgid = uuidv1()
  params.msgid = msgId || null
  params.status = status
  params.err = errCode
  params.errmsg = msg

  return params
}

/**
 * Api wrapper to handle the refund payment
 * @param {object} req: API request object
 * @param {object} res: API response object
 */
function refundPayment (req, res) {
  var rspObj = req.rspObj || {}
  var data = req.body && req.body.request
  console.log('Refund request received with data', JSON.stringify(data))
  if (!data || !data.instrumentType || !data.instrumentReference || !data.amount) {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return res.status(400).send(errorResponse(rspObj))
  } else {
    const reqBody = getRequestBodyForCharge(data)
    console.log('Request body to call payment provider charge api', reqBody)

    var options = {
      method: 'POST',
      url: REFUND_REQUEST_BASE_URL + REFUND_REQUEST_URI,
      headers: {
        'Content-Type': 'application/json',
        'x-callback-url': PAYMENT_CALLBACK_BASE_URL + PAYMENT_REFUND_CALLBACK_URI,
        'x-verify': sha(reqBody + REFUND_REQUEST_URI + PAYMENT_PROVIDER_SALT_KEY) + '###' + PAYMENT_PROVIDER_SALT_INDEX
      },
      body: { request: reqBody },
      json: true
    }

    console.log('Req options for payment provider charge api', options)
    request(options, function (error, response, body) {
      console.log('Refund response from phone pay', JSON.stringify(body))
      if (!error && body && !body.success) {
        rspObj.errCode = body && body.code ? body.code : 'PAYMENT_FAILED'
        rspObj.errMsg = body && body.message ? body.message : 'Payment failed, please try again later'
        const httpStatus = body && (body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500)
        rspObj.responseCode = httpStatus
        rspObj.result = body
        return res.status(400).send(errorResponse(rspObj))
      } else {
        rspObj.result = body
        refundTxnIdMap[body.data.transactionId] = data.userPaidTxnId
        console.log('Map status', refundTxnIdMap[body.data.transactionId])
        rspObj.result.data && delete rspObj.result.data['merchantId']
        return res.status(200).send(successResponse(rspObj))
      }
    })
  }
}

/**
 * Api wrapper to handle the payment refund callback, This api will call by payment provider
 * @param {object} req: API request object 
 * @param {object} res: API response object
 */
function handleRefundPaymentCallback (req, res) {
  const xVerfiy = req && req.headers['x-verify']
  console.log('req.body', req.body)
  const data = req.body.response
  const rspObj = req.rspObj

  console.log('Got Callback request with data', data, xVerfiy)
  if (!data || !xVerfiy) {
    rspObj.errCode = 'MISSING_REQUIRED_FIELDS'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 400
    return res.status(400).send(errorResponse(rspObj))
  } else {
    const shaData = sha(data + PAYMENT_PROVIDER_SALT_KEY) + '###' + PAYMENT_PROVIDER_SALT_INDEX
    if (shaData !== xVerfiy) {
      rspObj.errCode = 'INVALID_REQUEST_DATA'
      rspObj.errMsg = 'Requested data invalid.'
      rspObj.responseCode = 400
      console.log('Invalid request received, xverify and response not matched')
      return res.status(200).send(errorResponse(rspObj))
    } else {
      console.log('Valid request received')
      updateRefundPaymentStatus(req, function () { })
      rspObj.responseCode = 200
      rspObj.result = {
        message: 'Request successfully verified.'
      }
      return res.status(200).send(successResponse(rspObj))
    }
  }
}

/**
 * This function helps to update the payment status
 * @param {object} req: API req object 
 * @param {*} callback: Callback have 3 params(error, statusCode, successResp)
 */
function updateRefundPaymentStatus (req, callback) {
  var rspObj = req.rspObj
  if (typeof req !== 'object' || typeof callback !== 'function') {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Invalid request received'
    rspObj.responseCode = 400
    return callback(errorResponse(rspObj), 400, null)
  }
  const encodedData = req.body && req.body.response
  const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString())
  console.log('Decode data of payment callback:', JSON.stringify(decodedData))
  if (decodedData) {
    var body = {
      entityName: 'userpayment',
      indexed: true,
      payload: {
        id: refundTxnIdMap[decodedData.data && decodedData.data.transactionId],
        benefittransfertransactionid: decodedData.data && decodedData.data.transactionId,
        benefittransfer: decodedData.code === 'PAYMENT_SUCCESS',
        benefittransferstatus: decodedData.code
      }
    }
    var options = {
      method: 'POST',
      url: learnerURL + PAYMENT_STATUS_UPDATE_API,
      body: {request: body},
      headers: req.headers,
      json: true
    }
    console.log('Update status of transaction', JSON.stringify(options))
    request(options, function (error, response, body) {
      delete refundTxnIdMap[decodedData.data && decodedData.data.transactionId]
      if (!error && body && body.responseCode === 'OK') {
        console.log('Payment status update successfully for transaction id: ', decodedData.data.transactionId)
        return callback(null, 200, body.result)
      } else {
        console.log('Payment status update failed for transaction id: ', decodedData.data.transactionId,
          JSON.stringify(body))
        rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_PAYMENT_STATUS_FAILED'
        rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update payment status failed'
        rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
        rspObj.result = body && body.result
        var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
        var errRspObj = errorResponse(rspObj)
        return callback(errRspObj, httpStatus, false)
      }
    })
  } else {
    console.log('Invalid data received to update the request')
    rspObj.errCode = 'INVALID_REQUEST_RECEIVED'
    rspObj.errMsg = 'Invalid request received, Please try again later'
    rspObj.responseCode = 400
    var httpStatus = 400
    return callback(errorResponse(rspObj), httpStatus, false)
  }
}
