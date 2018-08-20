const request = require('request')
const envHelper = require('./../environmentVariablesHelper.js')
const bodyParser = require('body-parser')
const uuidv1 = require('uuid')

module.exports = function (app) {
  app.get('/juliabox/notebook/status', bodyParser.json({ limit: '10mb' }), createAndValidateRequestBody,
  checkNoteBookStatus)
}

/** 
 * This middleware function is used to validate request body and create response structure 
 * @param {Object} req  
 * @param {Object} res  
 * @param {Function} next : Middleware function, used to perform next operation 
 */
function createAndValidateRequestBody(req, res, next) {
  req.body = req.body || {}
  req.body.ts = new Date()
  req.body.url = req.url
  req.body.path = req.route.path
  req.body.params = req.body.params ? req.body.params : {}
  req.body.params.msgid = req.headers['msgid'] || req.body.params.msgid || uuidv1()

  var rspObj = {
    apiId: 'julia.notebook.status',
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
  req.rspObj = rspObj
  next()
}

/** 
 * This function helps to return success response 
 * @param {Object} data  
 * @returns {Object} Success response object 
 */
function successResponse(data) {
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
function errorResponse(data) {
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
 * This function is use to get params data for response 
 * @param {string} msgId  
 * @param {string} status  
 * @param {string} errCode  
 * @param {string} msg  
 * @return {object} response params object 
 */
function getParams(msgId, status, errCode, msg) {
  var params = {}
  params.resmsgid = uuidv1()
  params.msgid = msgId || null
  params.status = status
  params.err = errCode
  params.errmsg = msg

  return params
}

function checkNoteBookStatus(req, res) {
  console.log('Julia notebook status ::')
  const url = req.query.noteBookUrl
  var options = {
    url: url,
    method: 'GET',
    json: false,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const rspObj = req.rspObj

  request(options, function (err, response, body) {
    if (response.statusCode === 404) {
      console.log('Error while fetch notebook status', JSON.stringify(err))
      rspObj.errCode = 'RESOURCE_NOT_FOUND'
      rspObj.errMsg = 'fetching notebook status failed, Please try again later...'
      rspObj.responseCode = 'RESOURCE_NOT_FOUND'
      return res.status(404).send(errorResponse(rspObj))
    } else if (err || response.statusCode !== 200) {
      console.log('Error while fetch notebook status', JSON.stringify(err))
      rspObj.errCode = 'SERVER_ERROR'
      rspObj.errMsg = 'fetching notebook status failed, Please try again later...'
      rspObj.responseCode = 'SERVER_ERROR'
      return res.status(404).send(errorResponse(rspObj))
    } {
      rspObj.result = {}
      return res.status(200).send(successResponse(rspObj))
    }
  });
}

/**
 * This function helps up to call logout api to julia notebook
 */
module.exports.logoutHelper = function() {
  console.log('Call logout to Julia notebook ::')
  const url = envHelper.JULIA_BOX_BASE_URL
  var options = {
    url: url,
    method: 'GET',
    json: false,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  request(options, function (err, response, body) {
    if (err) console.log('Julia notebook logout error :: ')
    else console.log('Julia logout status :: ', response && response.statusCode)
  });
}