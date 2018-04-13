var azure = require('azure-storage')
var envVariables = require('./../environmentVariablesHelper.js')
var blobService = azure.createBlobService(envVariables.AZURE_ACCOUNT_NAME, envVariables.AZURE_ACCOUNT_KEY)

function UploadUtil (name) {
  this.containerName = name
  const self = this
  blobService.createContainerIfNotExists(this.containerName, { publicAccessLevel: 'blob' }, function (err) {
    if (err) {
      console.log('Unable to create container in azure: ', JSON.stringify(err))
    } else {
      console.log(self.containerName, ' Container created successfully')
    }
  })
}

UploadUtil.prototype.uploadFile = function uploadFile (destPath, sourcePath, callback) {
  blobService.createBlockBlobFromLocalFile(this.containerName, destPath, sourcePath, callback)
}

UploadUtil.prototype.checkFileExist = function checkFileExist (sourcePath, callback) {
  blobService.getBlobProperties(this.containerName, sourcePath, callback)
}

module.exports = UploadUtil
