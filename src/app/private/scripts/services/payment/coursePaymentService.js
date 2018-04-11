/**
 * @author: Anuj Gupta
 * @description: This service useful to handle user payment
 */
'use strict'

angular.module('playerApp')
  .service('coursePayment', ['restfulLearnerService', 'phonePePaymentService', 'config', 'uuid4', '$q',
    'courseService', function (restfulLearnerService, phonePePaymentService, config, uuid4, $q, courseService) {
      this.courseDetail = {}

      this.setCourseDetail = function (courseDetail) {
        this.courseDetail = courseDetail
      }

      this.getCourseDetail = function (courseId, cb) {
        if (this.courseDetail && this.courseDetail.identifier === courseId) {
          cb(this.courseDetail)
        } else {
          courseService.courseHierarchy(courseId).then(function (res) {
            if (res && res.responseCode === 'OK') {
              cb(res.result.content)
            } else {
              cb()
            }
          }, function () {
            cb()
          })
        }
      }

      this.getReauestBody = function (req) {
        return {
          'id': uuid4.generate(),
          'ts': new Date(),
          'params': {},
          'request': req
        }
      }

      this.searchCoursePayment = function (req) {
        var url = config.URL.OBJECT.SEARCH
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.getCoursePayment = function (req) {
        var url = config.URL.OBJECT.READ
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.createCoursePayment = function (req) {
        var url = config.URL.OBJECT.CREATE
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.updateCoursePayment = function (req) {
        var url = config.URL.OBJECT.UPDATE
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.collectPayment = function (req) {
        var url = 'v3/charge'
        return phonePePaymentService.post(url, req)
      }

      this.refundPayment = function (req) {
        var deferred = $q.defer()
        if (req.upiId === 'anuj@okhdfcbank') {
          deferred.resolve({
            'transactionId': 'bt_' + Date.now(),
            'status': 'success'
          })
        } else {
          deferred.resolve({
            'transactionId': 'bt_' + Date.now(),
            'status': 'failure'
          })
        }
        return deferred.promise
      }
    }])
