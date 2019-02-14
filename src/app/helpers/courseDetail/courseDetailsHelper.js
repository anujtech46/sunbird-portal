/*
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Author: Anuj Gupta
 * 
 * Copyright (c) 2018 Your Company
 */

const fs = require('fs')

const async = require('async')
const envVariables = require('../environmentVariablesHelper.js')
const request = require('request')
let uuidv1 = require('uuid/v1')
const _ = require('lodash')
const bodyParser = require('body-parser')
var json2csv = require('json2csv').parse;
const apiLimitSize = envVariables.API_REQUEST_LIMIT_SIZE
const containerName = 'courseprogress'
const UploadUtil = require('./../pdfCreator/uploadUtil')
const uploadUtil = new UploadUtil(containerName)
const path = require('path')
const rimraf = require('rimraf')

/**
 * Exports all the routes for update content state api
 * @param {object} app 
 */
module.exports = function (app) {
  app.get('/course/progress', bodyParser.json({ limit: apiLimitSize }), createAndValidateRequestBody,
    updateContentState)
}

/**
 * This is middleware function. Which is used to validate request body
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
function createAndValidateRequestBody(req, res, next) {
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
  req.rspObj = rspObj
  next()
}
/**
* This is util function. Which helps to get success response
* @param {object} data
* @returns {object} response object
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
 * @param {object} data
 * @return {object} response object
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

async function getContentList() {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'POST',
      url: envVariables.CONTENT_URL + '/content/v1/search',
      headers:
      {
        authorization: 'Bearer ' + envVariables.PORTAL_API_AUTH_TOKEN,
        'content-type': 'application/json'
      },
      body:
      {
        request:
        {
          filters:
          {
            status: ['Live'],
            contentType: ['Course'],
            objectType: 'Content'
          },
          offset: 0,
          limit: 1000
        }
      },
      json: true
    };

    request(options, function (error, response, body) {
      if (error) reject(error);
      else resolve(body)
    });

  })
}

const getAllBatch = async (contents, tokenData) => {
  return new Promise((resolve, reject) => {
    let arrData = []
    async.each(contents, function (content, CB) {
      var options = {
        method: 'POST',
        url: envVariables.LEARNER_URL + '/course/v1/batch/list',
        headers:
        {
          authorization: 'Bearer ' + envVariables.PORTAL_API_AUTH_TOKEN,
          'content-type': 'application/json',
          'x-authenticated-user-token': tokenData.access_token
        },
        body: { "request": { "filters": { "status": "1", "courseId": content.identifier }, "sort_by": { "createdDate": "desc" } } },
        json: true
      };
      request(options, function (error, response, body) {
        if (error || body && body.responseCode !== 'OK') {
          console.log('error', error)
          CB(error)
        }
        else {
          let result = body.result.response && body.result.response && body.result.response.content || []
          result = result.map(e => ({
            courseName: content.name, courseId: content.identifier, batchId: e.identifier,
          }))

          // data[id] = result
          arrData = [...arrData, ...result]
          CB()
        }
      });
    }, function (err) {
      console.log('arr', arrData.length)
      resolve(arrData)
    })
  })
}

const getCourseDetails = async (contents, query, tokenData) => {
  console.log('content lenght', contents.length)
  return new Promise((resolve, reject) => {
    let arrData = []
    async.each(contents, function (content, CB) {
      var options = {
        method: 'GET',
        url: envVariables.LEARNER_URL + 'dashboard/v1/progress/course/' + content.batchId,
        headers:
        {
          authorization: 'Bearer ' + envVariables.PORTAL_API_AUTH_TOKEN,
          'content-type': 'application/json',
          'x-authenticated-user-token': tokenData.access_token
        },
        json: true
      };
      if (query) {
        options.qs = query
      }
      request(options, function (error, response, body) {
        if (error || body && body.responseCode !== 'OK') {
          console.log('error', error)
          CB()
        }
        else {
          let result = body.result.series && body.result.series['course.progress.course_progress_per_user.count'] &&
            body.result.series['course.progress.course_progress_per_user.count'].buckets || []
          result = result.map(e => {
            return {
              ...e,
              ...content
            }
          })
          // data[id] = result
          arrData = arrData.concat(result)
          CB()
        }
      });
    }, function (err) {
      resolve(arrData)
    });
  })
}

async function createCsvANdUpload(arrData) {
  return new Promise((resolve, reject) => {
    const fields = ['courseId', 'courseName', 'progress', 'userName', 'user', 'batchEndsOn', 'lastAccessTime', 'enrolledOn'];
    const opts = { fields };
    const csv = json2csv(arrData, opts);
    const fileName = 'courseProgress.csv'
    const filePath = path.join(__dirname)
    const csvFilePath = path.join(filePath + '/' + fileName)
    const destPath = path.join('content_progress', fileName)
    fs.writeFile(csvFilePath, csv, function (err) {
      if (err) throw err;
      console.log('file saved');
      uploadUtil.uploadFile(destPath, csvFilePath, function (err, result) {
        if (err) {
          throw new Error(err)
        } else {
          console.log('File uploaded successfully', envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath)
          rimraf(csvFilePath, function () { console.log('delete file after upload') })
          resolve(envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath)
        }
      })
    });
  })
}


/**
 * This function is use to get auth token for user who will assign badge
 * @param {Function} callback 
 */
async function getBadgeAssignUserAuthToken() {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'POST',
      url: envVariables.PORTAL_AUTH_SERVER_URL + '/realms/' +
        envVariables.PORTAL_REALM + '/protocol/openid-connect/token',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      json: true,
      form: {
        'client_id': 'admin-cli',
        'username': envVariables.COURSE_MENTOR_USER_ID,
        'password': envVariables.COURSE_MENTOR_USER_PASSWORD,
        'grant_type': 'password'
      }
    }
    request(options, function (error, response, body) {
      if (!error && body) {
        resolve(body)
      } else {
        throw new Error(error)
      }
    })
  })
}

/**
 * @param {Object} req 
 * @param {Object} response 
 */
async function updateContentState(req, response) {
  try {
    const contentData = await getContentList()
    console.log(contentData.result.count)

    if (contentData.result.content <= 0) {
      console.log('Zero content found')
      response.status(400).send(errorResponse(req.resObj))
    }

    const tokenData = await getBadgeAssignUserAuthToken()
    const batchData = await getAllBatch(contentData.result.content, tokenData)
    const courseDetail = await getCourseDetails(batchData, req.query, tokenData)
    const fileData = await createCsvANdUpload(courseDetail)
    console.log('courseDetail', fileData)
    response.status(200).send(successResponse({ ...req.resObj, ...{ result: { fileUrl: fileData } } }))
  } catch (e) {
    console.log(e)
    response.status(500).send(errorResponse(req.resObj))
  }

}

