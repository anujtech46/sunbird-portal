/**
 * @author: Anuj Gupta
 * @description: This service useful to handle course price crud
 */
'use strict'

angular.module('playerApp')
  .service('coursePriceService', ['restfulLearnerService', 'config', 'uuid4', 'userService', '$rootScope',
    function (restfulLearnerService, config, uuid4, userService, $rootScope) {
      this.getRequestBody = function (req) {
        return {
          'id': uuid4.generate(),
          'ts': new Date(),
          'params': {},
          'request': req
        }
      }

      this.addPrice = function (req) {
        var url = config.URL.OBJECT.CREATE
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.getPrice = function (req) {
        var url = config.URL.OBJECT.READ
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.editPrice = function (req) {
        var url = config.URL.OBJECT.UPDATE
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }
    }])
