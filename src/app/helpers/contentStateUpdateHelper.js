/*
 * Filename: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src/app/helpers/contentStateUpdateHelper.js
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Created Date: Sunday, May 13th 2018, 5:11:21 pm
 * Author: Anuj Gupta
 * 
 * Copyright (c) 2018 Your Company
 */

const async = require('async')
const envVariables = require('./environmentVariablesHelper.js')
const learnerURL = envVariables.LEARNER_URL
const request = require('request')
let uuidv1 = require('uuid/v1')
const _ = require('lodash')
const bodyParser = require('body-parser')
const feedback = require('./feedback/contentFeedback')
const courseCompletionBadgeId = envVariables.COURSE_COMPLETION_BADGE_ID
const apiLimitSize = envVariables.API_REQUEST_LIMIT_SIZE

/**
 * Exports all the routes for update content state api
 * @param {object} app 
 */
module.exports = function (app) {
  app.post('/update/content/state', bodyParser.json({ limit: apiLimitSize }), createAndValidateRequestBody,
    updateContentState)
}

/**
 * This is middleware function. Which is used to validate request body
 * @param {object} req 
 * @param {object} res 
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
  req.rspObj = rspObj
  next()
}
/**
* This is util function. Which helps to get success response
* @param {object} data
* @returns {object} response object
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
 * @param {object} data
 * @return {object} response object
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
 * This function is use to get params data for response
 * @param {string} msgId 
 * @param {string} status 
 * @param {string} errCode 
 * @param {string} msg 
 * @return {object} response params object
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
 * This function is use to get content list of a course
 * @param {Object} contentData 
 * @param {Object} contentList 
 * @return {Array} 
 */
function getCourseContents (contentData, contentList) {
  if (contentData.mimeType !==
    'application/vnd.ekstep.content-collection') {
    contentList.push(contentData)
  } else {
    _.forEach(contentData.children, function (child, item) {
      getCourseContents(contentData.children[item], contentList)
    })
  }
  return contentList
}

/**
 * This function is use to update content state, create feedback and update score and feedback url
 * it's also check user profile for badge, if user don't have badge, We are checking that user completed
 * all the course module. Once course progress is 100 %, we are assigning the badge to user.
 * @param {Object} req 
 * @param {Object} response 
 */
function updateContentState (req, response) {
  async.waterfall([
    function (cb) {
      // This function is use to update content state, feedback and score.
      updateStateAndFeedback(req, function (error, status, resp) {
        if (error) {
          console.log('Update fail: sending response back', JSON.stringify(error), status)
          return response.status(status).send(error)
        } else {
          console.log('Update status success: sending response back', JSON.stringify(resp), status)
          cb(null, resp)
        }
      })
    },
    function (updateResp, cb) {
      // This function is use to get user profile for checking the user has badge or not
      console.log('rspObj', JSON.stringify(req.rspObj))
      getUserProfile(req, function (error, status, resp) {
        if (error || (resp.response && resp.response.badgeAssertions && resp.response.badgeAssertions.length > 0 &&
          _.findIndex(resp.response.badgeAssertions, { badgeId: courseCompletionBadgeId }) > -1)) {
          console.log('User have badge')
          return response.send(updateResp)
        } else {
          console.log('User don\'t have badge')
          cb(null, updateResp)
        }
      })
    },
    function (updateResp, cb) {
      // This function is use to get course hierarchy for get all the content modules
      getCourseHierarchy(req, function (error, status, resp) {
        if (error) {
          console.log('Get course hierarchy failed, due to', JSON.stringify(error))
          return response.send(updateResp)
        } else {
          console.log('Got course hierarchy response')
          cb(null, resp, updateResp)
        }
      })
    },
    function (data, updateResp, cb) {
      var contentList = getCourseContents(data.content, [])
      console.log('contentList: ', contentList.length)
      // This function is use to get progress of all the content and check progress is 100 % or not
      // If progress is completed, we are assigning badge
      var batchId = req.body && req.body.request && req.body.request.batchId
      getState(req, contentList, function (error, status, resp) {
        if (error) {
          return response.send(error)
        } else {
          if (checkProgress(resp, batchId, contentList)) {
            console.log('Progress 100, Now assign badge')
            cb(null, updateResp)
          } else {
            return response.send(updateResp)
          }
        }
      })
    },
    function (updateResp, cb) {
      // Assign badge
      assignBadge(req, function (error, res) {
        if (error) console.log('error:', error)
        cb(null, updateResp)
      })
    }
  ], function (err, resp) {
    if (err) console.log('err:', err)
    return response.send(resp)
  })
}

/**
 * This function is use to get user profile.
 * @param {Object} req 
 * @param {function} callback 
 */
function getUserProfile (req, callback) {
  var rspObj = req.rspObj
  var options = {
    method: 'GET',
    url: learnerURL + 'user/v1/read/' + rspObj.userId,
    headers: req.headers,
    qs: 'badgeAssertions',
    json: true
  }

  console.log('Req for user detail', options.url)
  request(options, function (error, response, body) {
    if (!error && body && body.responseCode === 'OK') {
      return callback(null, 200, body.result)
    } else {
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && (body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500)
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to check progress of all module is completed.
 * @param {Object} data 
 * @param {String} batchId
 * @param {Array} contentList 
 * @return {Boolean}
 */
function checkProgress (data, batchId, contentList) {
  var courseProgress = 0
  _.forEach(data.contentList, function (content) {
    if (content.status === 2 && content.batchId === batchId) {
      courseProgress += 1
    }
  })
  console.log('Completed module: ', courseProgress, batchId)
  if (courseProgress >= contentList.length) {
    return true
  } else {
    return false
  }
}

/**
 * This function is use to check the required keys in data
 * @param {Object} data 
 * @param {Array} keys
 * @returns {Boolean}
 */
function checkRequiredKeys (data, keys) {
  var isValid = true
  _.forEach(keys, function (key) {
    if (!data[key] && data[key] !== 0 && data[key] !== '') {
      isValid = false
    }
  })
  return isValid
}

/**
 * This function is use to get response for all process, Which tells the response of all the operation
 * @param {string} name: Name of the process 
 * @param {boolean} success : Status
 * @param {string} err
 * @param {string} errMsg
 * @param {string} status 
 */
function getPartialResponseObj (name, success, err, errMsg, status) {
  return {
    name: name,
    success: success,
    err: err,
    errmsg: errMsg,
    status: status
  }
};

/**
 * In this function we are doing some operation
 * Update content progress
 * create and upload feedback
 * update score and feedback url
 * @param {object} req 
 * @param {function} callback : if all are success the success resp, if any one failed then err response
 */
function updateStateAndFeedback (req, callback) {
  const body = req.body
  var rspObj = req.rspObj
  var progressUpdate, feedbackUpdate
  var result = []
  var printBody = Object.assign({}, body.request)
  delete printBody['feedback']
  console.log('User request body:', JSON.stringify(printBody), new Date())
  console.log('User request header', JSON.stringify(req.headers))
  if (!body || !body.request || !checkRequiredKeys(body.request, ['contentId', 'courseId', 'progress', 'uid'])) {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 'CLIENT_ERROR'
    var errRspObj = errorResponse(rspObj)
    return callback(errRspObj, 400, false)
  } else {
    async.waterfall([
      function (cb) {
        // This function is use to create and upload feedback html file
        feedback.createAndUploadFeedback(req, function (error, resp) {
          if (error) {
            feedbackUpdate = false
            result.push(getPartialResponseObj('Feedback file creation', feedbackUpdate, error.errMsg,
              error.errmsg, error.responseCode))
            console.log('Update feedback fail:', JSON.stringify(error))
            cb(null, error)
          } else {
            feedbackUpdate = true
            result.push(getPartialResponseObj('Feedback file creation', feedbackUpdate, '', '', ''))
            console.log('Update feedback success:', JSON.stringify(resp))
            cb(null, resp)
          }
        })
      },
      function (data, cb) {
        // This function is use to update state
        updateState(req, data, function (error, status, resp) {
          if (error) {
            progressUpdate = false
            result.push(getPartialResponseObj('Progress Update', progressUpdate, error.params.err,
              error.params.errmsg, error.params.status))
            console.log('Update state fail:', JSON.stringify(error), status)
          } else {
            progressUpdate = true
            result.push(getPartialResponseObj('Progress Update', progressUpdate, '', '', ''))
            console.log('Update state success:', JSON.stringify(resp), status)
          }
          cb()
        })
      }
    ], function () {
      rspObj.result = result
      if (progressUpdate && feedbackUpdate) {
        var successRspObj = successResponse(rspObj)
        return callback(null, 200, successRspObj)
      } else if (progressUpdate || feedbackUpdate) {
        var partialSuccessRspObj = successResponse(rspObj)
        return callback(null, 207, partialSuccessRspObj)
      } else {
        return callback(errorResponse(rspObj), 500, null)
      }
    })
  }
}

/**
 * This function is use to update content state and progress
 * @param {String} req 
 * @param {Function} callback 
 */
function updateState (req, feedbackData, callback) {
  const body = req.body
  var rspObj = req.rspObj
  rspObj.userId = body.request.uid
  var progress = body.request.progress
  var status = body.request.status ? body.request.status : progress > 0 ? (progress >= 100 ? 2 : 1) : 0
  var requestBody = {
    userId: body.request.uid,
    contents: [
      {
        contentId: body.request.contentId,
        courseId: body.request.courseId,
        batchId: body.request.batchId,
        status: status,
        progress: body.request.progress,
        grade: String(body.request.score),
        score: String(body.request.max_score)
      }
    ]
  }

  if (feedbackData && feedbackData.result) {
    requestBody.contents[0].result = feedbackData.result.fileUrl
  }
  var options = {
    method: 'PATCH',
    url: learnerURL + 'course/v1/content/state/update',
    headers: req.headers,
    body: { request: requestBody },
    json: true
  }
  console.log('Request to learner service for update progress:', JSON.stringify(options))
  request(options, function (error, response, body) {
    if (!error && body && body.responseCode === 'OK') {
      rspObj.result = body.result
      var successRspObj = successResponse(rspObj)
      return callback(null, 200, successRspObj)
    } else {
      console.log('Error response from server', JSON.stringify(body))
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to get content state
 * @param {Object} req 
 * @param {Function} callback 
 */
function getState (req, contentList, callback) {
  const body = req.body
  var rspObj = req.rspObj
  var requestBody = {
    batchId: body.request.batchId,
    userId: rspObj.userId,
    courseIds: [body.request.courseId],
    contentIds: _.map(contentList, 'identifier')
  }
  var options = {
    method: 'POST',
    url: learnerURL + 'course/v1/content/state/read',
    headers: req.headers,
    body: { request: requestBody },
    json: true
  }
  console.log('Request for get content state: ', JSON.stringify(requestBody))
  request(options, function (error, response, body) {
    console.log('response:', JSON.stringify(body))
    if (!error && body && body.responseCode === 'OK') {
      return callback(null, 200, body.result)
    } else {
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to get course hierarchy
 * @param {Object} req 
 * @param {Function} callback 
 */
function getCourseHierarchy (req, callback) {
  const body = req && req.body
  var rspObj = req && req.rspObj
  var options = {
    method: 'GET',
    url: envVariables.CONTENT_URL + 'course/v1/hierarchy' + '/' + body.request.courseId,
    headers: req && req.headers,
    json: true
  }

  console.log('Request: ', JSON.stringify(options))
  request(options, function (error, response, body) {
    // console.log("response: ", JSON.stringify(body))
    if (!error && body && body.responseCode === 'OK') {
      return callback(null, 200, body.result)
    } else {
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to get auth token for user who will assign badge
 * @param {Function} callback 
 */
function getBadgeAssignUserAuthToken (callback) {
  var options = {
    method: 'POST',
    url: envVariables.PORTAL_AUTH_SERVER_URL + '/realms/' +
      envVariables.PORTAL_REALM + '/protocol/openid-connect/token',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    json: true,
    form: {
      'client_id': 'admin-cli',
      'username': envVariables.BADGE_ASSIGN_USERNAME,
      'password': envVariables.BADGE_ASSIGN_USER_PASSWORD,
      'grant_type': 'password'
    }
  }
  request(options, function (error, response, body) {
    if (!error && body) {
      return callback(null, 200, body.access_token)
    } else {
      return callback(error, 404, false)
    }
  })
}

/**
 * This function is use to get badge detail
 * @param {Object} req 
 * @param {Function} callback 
 */
function getBadgeDetailWithID (req, callback) {
  var rspObj = req.rspObj
  var options = {
    method: 'GET',
    url: learnerURL + 'badging/v1/issuer/badge/read/' + envVariables.COURSE_COMPLETION_BADGE_ID,
    headers: req.headers,
    json: true
  }

  request(options, function (error, response, body) {
    if (!error && body && body.responseCode === 'OK') {
      return callback(null, 200, body.result)
    } else {
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to call api to assign badge
 * @param {Object} req 
 * @param {String} token 
 * @param {Object} badgeDetail 
 * @param {Function} callback 
 */
function assignBadgeToUser (req, token, badgeDetail, callback) {
  var rspObj = req.rspObj
  var reqBody = {
    'issuerId': badgeDetail.issuerId,
    'badgeId': badgeDetail.badgeId,
    'recipientId': rspObj.userId,
    'recipientType': 'user'
  }
  console.log('Issue: ', reqBody)
  var headers = Object.assign({}, req.headers)
  headers['x-authenticated-user-token'] = token
  var options = {
    method: 'POST',
    url: learnerURL + 'badging/v1/issuer/badge/assertion/create',
    headers: headers,
    body: { request: reqBody },
    json: true
  }

  console.log('Assign badge req', JSON.stringify(options))
  request(options, function (error, response, body) {
    console.log('Res: ', JSON.stringify(body))
    if (!error && body && body.responseCode === 'OK') {
      return callback(null, 200, body.result)
    } else {
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_CONTENT_STATE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Update content state failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

/**
 * This function is use to assign badge, This function is doing multiple operation
 * Get badge detail
 * Get auth token of user who will assign badge
 * Assign badge to user
 * @param {Object} req 
 * @param {Function} callback 
 */
function assignBadge (req, callback) {
  async.waterfall([
    function (cb) {
      getBadgeDetailWithID(req, function (error, status, badgeDetail) {
        if (status !== 200) {
          console.log('Getting badge detail failed')
          return callback(error, status, false)
        } else {
          console.log('Getting badge detail success')
          cb(null, badgeDetail)
        }
      })
    },
    function (badgeDetail, cb) {
      getBadgeAssignUserAuthToken(function (error, status, token) {
        if (status !== 200) {
          console.log('Get badge assign user token failed')
          return callback(error, status, false)
        } else {
          console.log('Get badge assign user token success')
          cb(null, token, badgeDetail)
        }
      })
    },
    function (token, badgeDetail, cb) {
      assignBadgeToUser(req, token, badgeDetail, function (error, status, resp) {
        if (status !== 200) {
          console.log('Assign badge to user failed')
          return callback(error, status, false)
        } else {
          console.log('Assign badge to user success')
          return callback(null, status, resp)
        }
      })
    }
  ])
}
