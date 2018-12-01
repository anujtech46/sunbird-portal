const envHelper = require('./../environmentVariablesHelper.js')
const instructorModel = require('./instructorModel')()
const uuidv1 = require('uuid')
const _ = require('lodash')

/** 
 * This middleware function is used to validate request body and create response structure 
 * @param {Object} req  
 * @param {Object} res  
 * @param {Function} next : Middleware function, used to perform next operation 
 */
module.exports.createAndValidateRequestBody = function (req, res, next) {
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

/**
 * 
 */
module.exports.createInstructor = function (req, res) {

  const reqBody = req.body.request;
  let rspObj = req.rspObj;

  if (!reqBody || !reqBody.courseId || !reqBody.instructors) {
    console.log('Error while fetch notebook status', JSON.stringify(err))
    rspObj.errCode = 'INVALID_REQUEST_PARAMS'
    rspObj.errMsg = 'Request params are missing...'
    rspObj.responseCode = 'CLIENT_ERROR'
    return res.status(404).send(errorResponse(rspObj))
  }

  var instructor = new instructorModel({
    id: reqBody.courseId + (reqBody.batchId ? '_' + reqBody.batchId : ''),
    courseId: reqBody.courseId,
    batchId: reqBody.batchId,
    instructors: reqBody.instructors,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  instructor.saveAsync()
    .then(function () {
      rspObj.result = { node_id: instructor.id }
      return res.status(200).send(successResponse(rspObj))
    })
    .catch(function (err) {
      rspObj.errCode = 'SERVER_ERROR'
      rspObj.errMsg = 'Saving instructor failed, Please try again later...'
      rspObj.responseCode = 'SERVER_ERROR'
      console.log('Saving instructor failed, due to', JSON.stringify(err))
      return res.status(404).send(errorResponse(rspObj))
    });
}

/**
 * 
 */
module.exports.readInstructor = function (req, res) {
  const rspObj = req.rspObj
  const instructorId = req.params.instructorId
  instructorModel.findOne({ id: instructorId }, function (err, result) {
    if (err) {
      rspObj.errCode = 'CLIENT_ERROR'
      rspObj.errMsg = 'Invalid Request, Please try again later...'
      rspObj.responseCode = 'CLIENT_ERROR'
      return res.status(400).send(errorResponse(rspObj))
    }
    rspObj.result = { instructor: result }
    return res.status(200).send(successResponse(rspObj))
  });
}

/**
* This function helps up to call logout api to julia notebook
*/
module.exports.updateInstructor = function (req, res) {

  const rspObj = req.rspObj
  const instructorId = req.params.instructorId
  const reqBody = req.body.request;
  const query_object = { id: instructorId };
  const update_values_object = { instructors: reqBody.instructors, updatedAt: new Date() };
  const options = { if_exists: true };
  instructorModel.update(query_object, update_values_object, options, function (err) {
    if (err) {
      rspObj.errCode = 'CLIENT_ERROR'
      rspObj.errMsg = 'Invalid Request, Please try again later...'
      rspObj.responseCode = 'CLIENT_ERROR'
      return res.status(400).send(errorResponse(rspObj))
    }
    rspObj.result = {  }
    return res.status(200).send(successResponse(rspObj))
  });
}