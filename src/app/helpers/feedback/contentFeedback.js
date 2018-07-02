/*
 * Filename: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src/app/helpers/feedback/contentFeedback.js
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Author: Anuj Gupta
 */

const pako = require('pako')
const FileSystem = require('fs')
const atob = require('atob')
const _ = require('lodash')
const path = require('path')
const async = require('async')
const tar = require('tar-fs')
const rimraf = require('rimraf')

const UploadUtil = require('./../pdfCreator/uploadUtil')

const envVariables = require('./../environmentVariablesHelper.js')

const containerName = envVariables.CONTENT_FEEDBACK_STORE_CONTAINER_NAME || 'container'
const uploadUtil = new UploadUtil(containerName)

/**
 * This function is use to create feedback tar file and extract tar file and get the html file
 * @param {Object} data : Request data from api
 * @param {String} folderName : tar file folder name
 * @param {String} filePath : File path, Where we have to create tar file
 * @param {Function} callback : It have error or success params
 */
function createFeedback (data, folderName, filePath, callback) {
  var base64 = data.feedback
  var fileName = data.feedback_file_name
  var strData = atob(base64)
  var htmlData = pako.inflate(strData, {to: 'string'})
  var tarFileName = path.join(__dirname, folderName + '.tar')
  FileSystem.writeFile(tarFileName, htmlData, function (err, data) {
    if (err) {
      console.log('Unable to create tar file: ', JSON.stringify(err))
      callback(err, null)
    } else {
      var stream = FileSystem.createReadStream(tarFileName, {bufferSize: 64 * 1024})
      stream.pipe(tar.extract(filePath))

      stream.on('close', function () {
        FileSystem.unlinkSync(tarFileName)
        callback(null, fileName)
      })
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
 * API wrapper function to create and upload feedback
 * @param {Object} req 
 * @param {Object} res 
 */
function createAndUploadFeedback (req, callback) {
  const data = req.body && req.body.request
  const rspObj = req.rspObj
  // Verify request and check all required fields
  if (!data || !checkRequiredKeys(data, ['contentId', 'uid', 'courseId', 'feedback', 'feedback_file_name'])) {
    rspObj.errCode = 'INVALID_REQUEST'
    rspObj.errMsg = 'Required fields are missing.'
    rspObj.responseCode = 'CLIENT_ERROR'
    return callback(rspObj, null)
  }

  const userId = data.uid
  const courseId = data.courseId
  const contentId = data.contentId
  // Create file name with course name and courseId and courseName date
  const folderName = userId + '-' + courseId + '-' + contentId
  // Create local file path
  const filePath = path.join(__dirname, folderName)
  async.waterfall([
    function (CB) {
      createFeedback(data, folderName, filePath, function (err, fileName) {
        if (err) {
          console.log('Creating feedback failed, due to', JSON.stringify(err))
          rspObj.errCode = 'CREATE_FEEDBACK_FAILED'
          rspObj.errMsg = 'Create feedback failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return callback(rspObj, null)
        } else {
          var htmlFilePath = path.join(filePath + '/' + fileName)
          // Create destination path (Azure bucket path)
          var destPath = path.join('content_feedback', folderName, fileName)
          CB(null, destPath, htmlFilePath)
        }
      })
    },
    function (destPath, htmlFilePath, CB) {
      uploadUtil.uploadFile(destPath, htmlFilePath, function (err, result) {
        if (err) {
          console.log('Error while uploading feedback', JSON.stringify(err))
          rspObj.errCode = 'CREATE_FEEDBACK_FAILED'
          rspObj.errMsg = 'Create feedback failed, Please try again later...'
          rspObj.responseCode = 'SERVER_ERROR'
          return callback(rspObj, null)
        } else {
          console.log('File uploaded successfully', envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath)
          rspObj.result = { fileUrl: envVariables.AZURE_STORAGE_URL + containerName + '/' + destPath }
          rimraf(filePath, function () { console.log('delete file after upload') })
          return callback(null, rspObj)
        }
      })
    }
  ])
}

module.exports.createAndUploadFeedback = createAndUploadFeedback
