const request = require('request')
const envHelper = require('./environmentVariablesHelper.js')
const learnerURL = envHelper.LEARNER_URL
const learnerAuthorization = envHelper.PORTAL_API_AUTH_TOKEN
const telemetryHelper = require('./telemetryHelper')
const uuidv1 = require('uuid/v1')
const dateFormat = require('dateformat')

module.exports = {
  updateLoginTime: function (req, callback) {
    var data = this.prepareRequestBody(req)
    var token = req.kauth.grant.access_token.token
    this.sendUpdateTimeReq(req, token, data, function (err, status) {
      callback(err, status)
    })
  },
  prepareRequestBody: function (req) {
    var userId = req.kauth.grant.access_token.content.sub
    var data = {
      'params': {},
      'request': { 'userId': userId }
    }
    return data
  },
  sendUpdateTimeReq: function (req, token, data, callback) {
    var options = {
      method: 'PATCH',
      url: learnerURL + 'user/v1/update/logintime',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + learnerAuthorization,
        'x-authenticated-user-token': token
      },
      body: data,
      json: true
    }
    const telemetryData = {
      reqObj: req,
      options: options,
      uri: 'user/v1/update/logintime',
      type: 'user',
      id: data.request.userId,
      userId: data.request.userId
    }
    telemetryHelper.logAPICallEvent(telemetryData)

    request(options, function (error, response, body) {
      telemetryData.statusCode = response.statusCode
      if (callback) {
        if (error) {
          telemetryData.resp = body
          telemetryHelper.logAPIErrorEvent(telemetryData)
          console.log('Update login time failed due to', error)
          callback(null, true)
          console.log('Update login time failed due to', body.params.err)
        } else if (body && body.params && body.params.err) {
          telemetryData.resp = body
          telemetryHelper.logAPIErrorEvent(telemetryData)
          callback(null, true)
        } else {
          callback(null, body)
        }
      }
    })
  },
  createUserIfNotExist: function (req, callback) {
    var payload = (req.kauth && req.kauth.grant.access_token.content) || {}
    var userId = payload['sub']
    var options = {
      method: 'GET',
      url: learnerURL + 'user/v1/read/' + userId,
      headers: {
        'x-device-id': 'trampoline',
        'x-msgid': uuidv1(),
        'ts': dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss:lo'),
        'x-consumer-id': learnerAuthorization,
        'content-type': 'application/json',
        accept: 'application/json',
        'Authorization': 'Bearer ' + learnerAuthorization,
        'x-authenticated-user-token': req.kauth.grant.access_token.token
      },
      json: true
    }

    const telemetryData = {
      reqObj: req,
      options: options,
      uri: 'user/v1/read/' + userId,
      type: 'user',
      id: userId,
      userId: userId
    }
    telemetryHelper.logAPICallEvent(telemetryData)

    request(options, function (error, response, body) {
      telemetryData.statusCode = response.statusCode
      console.log('check user exists', response.statusCode, 'for user Id :', userId, JSON.stringify(body))
      if (body.responseCode === 'OK') {
        callback()
      } else if (body && body.params && body.params.err === 'USER_NOT_FOUND') {
        module.exports.createUser(req, function (err, res) {
          if (err) {
            callback()
          } else {
            console.log('user create successfully')
            callback()
          }
        })
      } else {
        telemetryData.resp = body
        telemetryHelper.logAPIErrorEvent(telemetryData)
        console.log('Check user exist error: ', JSON.stringify(error || body))
      }
    })
  },
  createUser: function (req, callback) {
    var payload = (req.kauth && req.kauth.grant.access_token.content) || {}
    var options = {
      method: 'POST',
      url: learnerURL + 'user/v1/create',
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + learnerAuthorization
      },
      body: {
        request: {
          firstName: payload['given_name'],
          lastName: payload['family_name'],
          email: payload['email'],
          emailVerified: true,
          userName: payload['preferred_username'],
          userId: payload['sub'],
          phone: payload['phone_number'],
          phoneVerified: false,
          provider: envHelper.SIGN_UP_USER_PROVIDER,
          isSocialRegister: true
        }
      },
      json: true
    }
    console.log('request body to create user', JSON.stringify(options.body.request))
    const telemetryData = {
      reqObj: req,
      options: options,
      uri: 'user/v1/create',
      type: 'user',
      id: options.headers['x-consumer-id'],
      userId: options.headers['x-consumer-id']
    }
    telemetryHelper.logAPICallEvent(telemetryData)

    request(options, function (error, response, body) {
      console.log('Create user response: ', JSON.stringify(body), response.statusCode)
      telemetryData.statusCode = response.statusCode
      if (error || response.statusCode !== 200) {
        telemetryData.resp = body
        telemetryHelper.logAPIErrorEvent(telemetryData)
        var err = error || body
        callback(err, null)
      } else if (body.responseCode === 'OK') {
        callback(null, true)
      } else {
        telemetryData.resp = body
        telemetryHelper.logAPIErrorEvent(telemetryData)
        callback(body.params.err, null)
      }
    })
  }
}
