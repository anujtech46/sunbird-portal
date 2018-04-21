const PDFDocument = require('pdfkit')
const FileSystem = require('fs')
const bodyParser = require('body-parser')
const uuidv1 = require('uuid/v1')
const _ = require('lodash')
const path = require('path')
const async = require('async')
const moment = require('moment')

const UploadUtil = require('./uploadUtil')

const envVariables = require('./../environmentVariablesHelper.js')

const backgroundImg = FileSystem.readFileSync(path.join(__dirname, 'CertBackground.jpg'))
const companyLogo = FileSystem.readFileSync(path.join(__dirname, 'jc-logo-small.jpg'))
const containerName = envVariables.CERTIFICATE_STORE_CONTAINER_NAME || 'container'
const certificateProviderName = envVariables.CERTIFICATE_PROVIDER_NAME
const certificateInstructor = envVariables.CERTIFICATE_INSTRUCTOR_NAME
const uploadUtil = new UploadUtil(containerName)

module.exports = function (app) {
  app.post('/course/certificate/download', bodyParser.json({ limit: '1mb' }), createAndValidateRequestBody,
    createCerticate)
}

/**
 * This function is useful to modify date for certificate
 * @param {Date string} reqDate 
 */
function getCertificateDate (reqDate) {
  var date = reqDate ? new Date(reqDate) : new Date()
  return moment(date).format('DD-MMM-YYYY')
}

/**
 * This middleware function is used to validate request body and create response structure
 * @param {API object} req 
 * @param {API Object} res 
 * @param {API object} next 
 */
function createAndValidateRequestBody (req, res, next) {
  req.body = req.body || {}
  req.body.ts = new Date()
  req.body.url = req.url
  req.body.path = req.route.path
  req.body.params = req.body.params ? req.body.params : {}
  req.body.params.msgid = req.headers['msgid'] || req.body.params.msgid || uuidv1()

  var rspObj = {
    apiId: 'course.certificate.download ',
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
 * This function helps to return success response
 * @param {Object} data 
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
 * This function helps to check required fields in a object
 * @param {Object} data: Data in which, we have to check required fields 
 * @param {Array} keys: Array of required keys 
 */
function checkRequiredKeys (data, keys) {
  var isValid = true
  _.forEach(keys, function (key) {
    if (!data[key]) {
      isValid = false
    }
  })
  return isValid
}

function createPDF (data, filePath, callback) {
  // Extract all the data from request
  var title = data.title
  var name = data.name
  var provider = certificateProviderName
  var instructor = data.instructor || certificateInstructor
  var courseCompletionDate = getCertificateDate(data.createdDate || new Date())
  var courseName = data.courseName

  var doc = new PDFDocument({ autoFirstPage: false })

  var stream = doc.pipe(FileSystem.createWriteStream(filePath))

  doc.addPage({
    layout: 'landscape'
  })

  doc.image(backgroundImg, {
    width: 700
  })

  // doc.fontSize(15)
  //   .text('This is to certify that ' + title + ' ' + name + ' has completed the course "' +
  //   courseName + '" conducted by ' + provider, 150, 300, {
  //   })
  // .font('Times-Roman')
  doc.font('Helvetica').text('This is to certify that ', 150, 300, { continued: true })
    .font('Helvetica-Bold').text(title + ' ' + name, { continued: true })
    .font('Helvetica').text(' has completed the course "', { continued: true })
    .font('Helvetica-Bold').text(courseName, { continued: true })
    .font('Helvetica').text('" conducted by ', { continued: true })
    .font('Helvetica-Bold').text(provider)

  doc.moveDown()
  doc.moveDown()
  doc.image(companyLogo)

  doc.text(courseCompletionDate, 180, 480, {
    align: 'left'
  })

  /*
  doc.text('Course Instructor', 280, 340, {
      align: 'right'
  });
  */

  doc.text('(' + instructor + ' )', 550, 520, {
  })

  doc.end()
  stream.on('error', function (err) {
    callback(err, null)
  })
  stream.on('finish', function () {
    callback(null, {filePath: filePath})
  })
}

/**
 * API wrapper function to create certificate
 * @param {*} req 
 * @param {*} res 
 */
function createCerticate (req, res) {
  const data = req.body && req.body.request
  const rspObj = req.rspObj

  console.log('Request received: Request data', JSON.stringify(data))
  // Verify request and check all required fields
  if (!data || !checkRequiredKeys(data, ['name', 'courseName', 'userId', 'courseId'])) {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 'CLIENT_ERROR'
    return res.status(400).send(errorResponse(rspObj))
  }

  const userId = data.userId
  const courseId = data.courseId
  const courseName = data.courseName
  // Create file name with course name and courseId and courseName date
  const fileName = courseName + '-' + userId + '-' + courseId + '.pdf'
  // Create local file path
  const filePath = path.join(__dirname, fileName)
  // Create destination path (Azure bucket path)
  var destPath = path.join('course_certificate', fileName)
  async.waterfall([
    function (CB) {
      uploadUtil.checkFileExist(destPath, function (err, downloadFileData) {
        if (err) {
          console.log('err to download file, Now create pdf and upload', JSON.stringify(err))
          CB()
        } else {
          console.log('User have certificate')
          rspObj.result = { fileUrl: envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath }
          return res.status(200).send(successResponse(rspObj))
        }
      })
    },
    function (CB) {
      createPDF(data, filePath, function (err, result) {
        if (err) {
          console.log('Creating certificate failed, due to', JSON.stringify(err))
          rspObj.errCode = 'CREATE_CERTIFICATE_FAILED'
          rspObj.errMsg = 'Create certificate failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return res.status(500).send(errorResponse(rspObj))
        } else {
          CB()
        }
      })
    },
    function (CB) {
      uploadUtil.uploadFile(destPath, filePath, function (err, result) {
        if (err) {
          console.log('Error while uploading certificate', JSON.stringify(err))
          rspObj.errCode = 'CREATE_CERTIFICATE_FAILED'
          rspObj.errMsg = 'Create certificate failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return res.status(500).send(errorResponse(rspObj))
        } else {
          console.log('File uploaded successfully', envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath)
          rspObj.result = { fileUrl: envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath }
          FileSystem.unlink(filePath, function () { })
          return res.status(200).send(successResponse(rspObj))
        }
      })
    }
  ])
}