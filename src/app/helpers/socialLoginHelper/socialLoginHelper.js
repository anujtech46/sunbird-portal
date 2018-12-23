const request = require('request')
const envHelper = require('./../environmentVariablesHelper.js')
const learnerURL = envHelper.LEARNER_URL
const learnerAuthorization = envHelper.PORTAL_API_AUTH_TOKEN
const telemetryHelper = require('./../telemetryHelper')
const uuidv1 = require('uuid/v1')
const dateFormat = require('dateformat')

module.exports = {
  createUserIfNotExist: function (req, callback) {
    var payload = (req.kauth && req.kauth.grant.access_token.content) || {}
    console.log('session token', req.kauth.grant.access_token.token)
    var userId = payload['sub']
    console.log('payload ::', JSON.stringify(payload))
    var options = {
      method: 'POST',
      url: learnerURL + 'user/v1/search',
      headers: {
        'x-consumer-id': learnerAuthorization,
        'content-type': 'application/json',
        accept: 'application/json',
        'Authorization': 'Bearer ' + learnerAuthorization,
        'x-authenticated-user-token': req.kauth.grant.access_token.token
      },
      body: {
        request: {
          filters: {
            email: payload.email
          }
        }
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
      telemetryData.statusCode = response && response.statusCode || 500
      console.log('check user exists', response.statusCode, 'for email :', payload.email, JSON.stringify(body))
      if (body.responseCode === 'OK' && body.result && body.result.response && body.result.response.count > 0) {
        callback()
      } else if (body.result && body.result.response && body.result.response.count === 0) {
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
          firstName: payload['given_name'] || payload['preferred_username'],
          lastName: payload['family_name'],
          email: payload['email'],
          emailVerified: true,
          userName: payload['preferred_username'],
          userId: payload['sub'],
          phone: payload['phone_number'],
          phoneVerified: false,
          channel: envHelper.DEFAULT_CHANNEL,
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
