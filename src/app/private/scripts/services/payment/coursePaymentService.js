/**
 * @author: Anuj Gupta
 * @description: This service useful to handle user payment
 */
'use strict'

angular.module('playerApp')
  .service('coursePayment', ['restfulLearnerService', 'config', 'uuid4', '$q', 'courseService',
    function (restfulLearnerService, config, uuid4, $q, courseService) {
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
      /**
             * @method addBadges
             * @desc assign badge to  users .
             * @memberOf Services.adminService
             * @param {Object}  request - Request object
             * @param {string}  request.badgeTypeId - Badge type id
             * @param {string}  request.receiverId - User  id
             * @returns {Promise} Promise object containing response code and message.
             * @instance
             */

      this.getCoursePayment = function (req) {
        var url = config.URL.OBJECT.SEARCH
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }
      /**
                     * @method getBadges
                     * @desc Get badges
                     * @memberOf Services.adminService
                     * @returns {Promise} Promise object containing list of badges.
                     * @instance
                     */
      this.createCoursePayment = function (req) {
        var url = config.URL.OBJECT.CREATE
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.updateCoursePayment = function (req) {
        var url = config.URL.OBJECT.UPDATE
        return restfulLearnerService.post(url, this.getReauestBody(req))
      }

      this.collectPayment = function (req) {
        var deferred = $q.defer()
        if (req.upiId === 'anuj@okhdfcbank') {
          deferred.resolve({
            'transactionId': 'transaction_123456',
            'status': 'success'
          })
        } else {
          deferred.resolve({
            'transactionId': 'transaction_123456',
            'status': 'failure'
          })
        }
        return deferred.promise
      }

      this.refundPayment = function (req) {
        var deferred = $q.defer()
        if (req.upiId === 'anuj@okhdfcbank') {
          deferred.resolve({
            'transactionId': 'transaction_123456',
            'status': 'success'
          })
        } else {
          deferred.resolve({
            'transactionId': 'tid_' + Date.now(),
            'status': 'failure'
          })
        }
        return deferred.promise
      }
    }])
