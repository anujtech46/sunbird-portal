const bodyParser = require('body-parser')
const instructorController = require('./instructorController')

 module.exports = function (app, keycloak) {
  app.post('/instructor/v1/create', bodyParser.json({ limit: '1mb' }), instructorController.createAndValidateRequestBody,
  instructorController.createInstructor)
  app.get('/instructor/v1/read/:instructorId', bodyParser.json({ limit: '1mb' }), instructorController.createAndValidateRequestBody,
  instructorController.readInstructor)
  app.patch('/instructor/v1/update/:instructorId', bodyParser.json({ limit: '1mb' }), instructorController.createAndValidateRequestBody,
  instructorController.updateInstructor)
}

