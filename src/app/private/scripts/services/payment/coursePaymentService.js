/**
 * @author: Anuj Gupta
 * @description: This service useful to handle user payment
 */
'use strict'

angular.module('playerApp')
  .service('coursePayment', ['restfulLearnerService', 'restfulPlayerService', 'config', 'uuid4', '$q',
    'coursePriceService', 'courseService',
    function (restfulLearnerService, restfulPlayerService, config, uuid4, $q, coursePriceService, courseService) {
      var courseDetail = {}
      var paymentDetail = {}

      this.getPaymentDetail = function (courseId, batchId, callback) {
        if (paymentDetail && paymentDetail.batchid === batchId) {
          callback(paymentDetail)
        } else {
          var request = {
            entityName: 'courseprice',
            id: courseId + '+' + batchId
          }
          coursePriceService.getPrice(request).then(function (response) {
            if (response && response.responseCode === 'OK') {
              paymentDetail = response.result.response[0]
              return callback(response.result.response[0])
            } else {
              callback()
            }
          }).catch(function (err) {
            console.log('err:', err)
            callback()
          })
          return paymentDetail
        }
      }

      this.setPaymentDetail = function (payment) {
        paymentDetail = payment
      }

      this.setCourseDetail = function (courseDetail) {
        this.courseDetail = courseDetail
      }

      this.getCourseDetail = function (courseId, cb) {
        if (courseDetail && courseDetail.identifier === courseId) {
          cb(courseDetail)
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

      this.getRequestBody = function (req) {
        return {
          'id': uuid4.generate(),
          'ts': new Date(),
          'params': {},
          'request': req
        }
      }

      this.searchCoursePayment = function (req) {
        var url = config.URL.OBJECT.SEARCH
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.getCoursePayment = function (req) {
        var url = config.URL.OBJECT.READ
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.createCoursePayment = function (req) {
        var url = config.URL.OBJECT.CREATE
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.updateCoursePayment = function (req) {
        var url = config.URL.OBJECT.UPDATE
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }

      this.collectPayment = function (req) {
        var url = config.URL.PAYMENT.COLLECT
        return restfulPlayerService.post(url, req)
      }

      this.refundPayment = function (req) {
        var url = config.URL.PAYMENT.REFUND
        return restfulPlayerService.post(url, req)
      }
    }])
