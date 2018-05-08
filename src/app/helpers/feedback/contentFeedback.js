const pako = require('pako')
const FileSystem = require('fs')
const atob = require('atob')
const _ = require('lodash')
const path = require('path')
const async = require('async')

const UploadUtil = require('./../pdfCreator/uploadUtil')

const envVariables = require('./../environmentVariablesHelper.js')

const containerName = envVariables.CONTENT_FEEDBACK_STORE_CONTAINER_NAME || 'container'
console.log(containerName)
const uploadUtil = new UploadUtil(containerName)

function createFeedback (data, filePath, callback) {
  var base64 = data.feedback
  var strData = atob(base64)
  var htmlData = pako.inflate(strData, {to: 'string'})
  htmlData = htmlData.replace(/^.+<!DOCTYPE html>/, '')
  FileSystem.writeFile(filePath, htmlData, function (err) {
    if (err) {
      console.log('Unable to content feedback file:', JSON.stringify(err))
      callback(err, null)
    } else {
      console.log('content feedback file create successfully')
      callback(null, filePath)
    }
  })
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

/**
 * API wrapper function to create feedback
 * @param {*} req 
 * @param {*} res 
 */
function createAndUploadFeedback (req, callback) {
  const data = req.body && req.body.request
  const rspObj = req.rspObj
  // Verify request and check all required fields
  if (!data || !checkRequiredKeys(data, ['contentId', 'uid', 'courseId', 'feedback'])) {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 'CLIENT_ERROR'
    return callback(rspObj, null)
  }

  const userId = data.uid
  const courseId = data.courseId
  const contentId = data.contentId
  // Create file name with course name and courseId and courseName date
  const fileName = userId + '-' + courseId + '-' + contentId + '.html'
  // Create local file path
  const filePath = path.join(__dirname, fileName)
  // Create destination path (Azure bucket path)
  var destPath = path.join('content_feedback', fileName)
  async.waterfall([
    function (CB) {
      createFeedback(data, filePath, function (err, result) {
        if (err) {
          console.log('Creating feedback failed, due to', JSON.stringify(err))
          rspObj.errCode = 'CREATE_FEEDBACK_FAILED'
          rspObj.errMsg = 'Create feedback failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return callback(rspObj, null)
        } else {
          CB()
        }
      })
    },
    function (CB) {
      uploadUtil.uploadFile(destPath, filePath, function (err, result) {
        if (err) {
          console.log('Error while uploading feedback', JSON.stringify(err))
          rspObj.errCode = 'CREATE_CERTIFICATE_FAILED'
          rspObj.errMsg = 'Create feedback failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return callback(rspObj, null)
        } else {
          console.log('File uploaded successfully', envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath)
          rspObj.result = { fileUrl: envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath }
          FileSystem.unlink(filePath, function () { })
          return callback(null, rspObj)
        }
      })
    }
  ])
}

module.exports.createAndUploadFeedback = createAndUploadFeedback
