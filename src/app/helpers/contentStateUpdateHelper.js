var async = require('async')
const envVariables = require('./environmentVariablesHelper.js')
const learnerURL = envVariables.LEARNER_URL
const request = require('request')
let uuidv1 = require('uuid/v1')
const _ = require('lodash')
const bodyParser = require('body-parser')
const feedback = require('./feedback/contentFeedback')
const courseCompletionBadgeId = envVariables.COURSE_COMPLETION_BADGE_ID

module.exports = function (app) {
  app.post('/update/content/state', bodyParser.json({ limit: '1mb' }), createAndValidateRequestBody,
    updateContentState)
}

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

function getParams (msgId, status, errCode, msg) {
  var params = {}
  params.resmsgid = uuidv1()
  params.msgid = msgId || null
  params.status = status
  params.err = errCode
  params.errmsg = msg

  return params
}

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

function updateContentState (req, response) {
  async.waterfall([
    function (cb) {
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
      getCourseHierarchy(req, function (error, status, resp) {
        if (error) {
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
      getState(req, contentList, function (error, status, resp) {
        if (error) {
          return response.send(error)
        } else {
          if (checkProgress(resp, contentList)) {
            console.log('Progress 100, Now assign badge')
            cb(null, updateResp)
          } else {
            return response.send(updateResp)
          }
        }
      })
    },
    function (updateResp, cb) {
      assignBadge(req, function (error, res) {
        console.log('eror:', error)
        cb(null, updateResp)
      })
    }
  ], function (err, resp) {
    console.log('err:', err)
    return response.send(resp)
  })
}

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
      console.log('sdfsdfs')
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

function checkProgress (data, contentList) {
  var courseProgress = 0
  _.forEach(data.contentList, function (content) {
    if (content.status === 2) {
      courseProgress += 1
    }
  })
  console.log('Completed module: ', courseProgress)
  if (courseProgress >= contentList.length) {
    return true
  } else {
    return false
  }
}

function checkRequiredKeys (data, keys) {
  var isValid = true
  _.forEach(keys, function (key) {
    if (!data[key]) {
      isValid = false
    }
  })
  return isValid
}

function getPartialResponseObj (name, success, err, errMsg, status) {
  return {
    name: name,
    success: success,
    err: err,
    errmsg: errMsg,
    status: status
  }
};

function updateStateAndFeedback (req, callback) {
  const body = req.body
  var rspObj = req.rspObj
  var progressUpdate, feedbackUpdate, scoreUpdate
  var result = []
  var printBody = Object.assign({}, body.request)
  delete printBody['feedback']
  console.log('User request body:', JSON.stringify(printBody))
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
        updateState(req, function (error, status, resp) {
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
      },
      function (cb) {
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
        updateScore(req, data, function (error, status, resp) {
          if (error) {
            scoreUpdate = false
            result.push(getPartialResponseObj('Score_Feedback Update', scoreUpdate, error.params.err,
              error.params.errmsg, error.params.status))
            console.log('Update score fail:', JSON.stringify(error), status)
          } else {
            scoreUpdate = true
            result.push(getPartialResponseObj('Score_Feedback Update', scoreUpdate, '', '', ''))
            console.log('Update score success:', JSON.stringify(resp), status)
          }
          cb()
        })
      }
    ], function () {
      rspObj.result = result
      if (progressUpdate && feedbackUpdate && scoreUpdate) {
        var successRspObj = successResponse(rspObj)
        return callback(null, 200, successRspObj)
      } else if (progressUpdate || feedbackUpdate || scoreUpdate) {
        return callback(errorResponse(rspObj), 207, null)
      } else {
        return callback(errorResponse(rspObj), 500, null)
      }
    })
  }
}

function getObjectRequestData (schemaName, payload) {
  return {
    request: {
      entityName: schemaName,
      indexed: true,
      payload: payload
    }
  }
}

function updateScore (req, feedbackData, callback) {
  const body = req.body
  var rspObj = req.rspObj
  rspObj.userId = body.request.uid
  var optType = body.request.first_submission // Operation type
  var requestBody = {
    id: body.request.uid + '+' + body.request.courseId + '+' + body.request.contentId,
    userid: body.request.uid,
    contentid: body.request.contentId,
    courseid: body.request.courseId,
    userscore: Number((body.request.score).toFixed(0)),
    maxscore: Number((body.request.max_score).toFixed(0)),
    updateddate: new Date()
  }
  if (feedbackData && feedbackData.result) {
    requestBody.feedback = feedbackData.result.fileUrl
  }
  optType = (optType === 'true' || typeof (optType) === 'boolean') ? JSON.parse(optType) : false
  if (optType) {
    requestBody.createddate = new Date()
  }

  var options = {
    method: 'POST',
    url: learnerURL + 'data/v1/object/create',
    headers: req.headers,
    body: getObjectRequestData('coursescore', requestBody),
    json: true
  }
  console.log('Request to learner service for course score:', JSON.stringify(options))
  request(options, function (error, response, body) {
    if (!error && body && body.responseCode === 'OK') {
      rspObj.result = body.result
      var successRspObj = successResponse(rspObj)
      return callback(null, 200, successRspObj)
    } else {
      console.log('Error response from server to update score', JSON.stringify(body))
      rspObj.errCode = body && body.params ? body.params.err : 'UPDATE_SCORE_FAILED'
      rspObj.errMsg = body && body.params ? body.params.errmsg : 'Updating score failed, please try again later'
      rspObj.responseCode = body && body.responseCode ? body.responseCode : 500
      rspObj.result = body && body.result
      var httpStatus = body && body.statusCode >= 100 && body.statusCode < 600 ? response.statusCode : 500
      var errRspObj = errorResponse(rspObj)
      return callback(errRspObj, httpStatus, false)
    }
  })
}

function updateState (req, callback) {
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
        progress: body.request.progress
      }
    ]
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
 * Get content state
 * @param {*} req 
 * @param {*} callback 
 */
function getState (req, contentList, callback) {
  const body = req.body
  var rspObj = req.rspObj
  var requestBody = {
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

function assignBadgeToUser (req, token, badgeDetail, callback) {
  var rspObj = req.rspObj
  var reqBody = {
    'issuerId': badgeDetail.issuerId,
    'badgeId': badgeDetail.badgeId,
    'recipientId': rspObj.userId,
    'recipientType': 'user'
  }
  console.log('Issu: ', reqBody)
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
