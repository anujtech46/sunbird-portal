'use strict'

angular.module('playerApp')
  .controller('coursePaymentCtrl', ['$rootScope', '$stateParams', 'toasterService',
    '$timeout', 'contentStateService', '$scope', '$location', '$state', 'coursePayment', 'uuid4',
    function ($rootScope, $stateParams, toasterService, $timeout, contentStateService,
      $scope, $location, $state, coursePayment, uuid4) {
      var pay = this
      pay.upiId = ''
      pay.courseId = $stateParams.courseId
      pay.userId = $rootScope.userId
      pay.batchId = $stateParams.batchId
      pay.userTransactionDetail = {}
      pay.coursePrice = 20000
      pay.courseTax = 1150
      pay.activePatmentMode = 'UPI'
      pay.progress = true

      pay.courseDetail = function () {
        coursePayment.getCourseDetail(pay.courseId, function (courseDetail) {
          pay.courseTitle = courseDetail && courseDetail.name
          pay.courseImage = courseDetail && courseDetail.appIcon
        })
        pay.isEnrolledCourse = _.find($rootScope.enrolledCourses, { courseId: pay.courseId, batchId: pay.batchId })
        console.log('pay.isEnrolledCourse', pay.isEnrolledCourse)
      }

      pay.collectPayment = function () {
        var req = {
          'amount': 1,
          'instrumentType': 'VPA',
          'instrumentReference': pay.upiId
        }
        coursePayment.collectPayment({request: req}).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            pay.submitPaymentDetail(resp.result.data)
          } else {
            toasterService.error('Payment failed, please try again later')
          }
        }, function () {
          toasterService.error('Payment failed, please try again later')
        })
      }

      pay.submitPaymentDetail = function (resp) {
        var request = {
          entityName: 'userpayment',
          indexed: true,
          payload: {
            id: resp.transactionId,
            userid: pay.userId,
            courseid: pay.courseId,
            batchid: pay.batchId,
            upiid: pay.upiId,
            createddate: (new Date()).toISOString(),
            userpaidtransactionid: resp.transactionId
          }
        }
        coursePayment.createCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            $('#payModal').modal({closable: false}).model('show')
            coursePayment.checkPaymentStatusAfterRequest()
            pay.userTransactionDetail = resp.result.data
          } else {
            pay.userTransactionDetail = {}
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      pay.doPayment = function () {
        if (pay.userTransactionDetail && pay.userTransactionDetail.userpaid) {
          $rootScope.$emit('enrollCourse', { message: 'success', batchId: pay.batchId, courseId: pay.courseId })
          window.history.back()
        } else {
          pay.collectPayment()
        }
      }

      pay.checkCoursePayment = function () {
        var request = {
          entityName: 'userpayment',
          filters: {
            userid: pay.userId,
            courseid: pay.courseId,
            batchid: pay.batchId
          }
        }
        coursePayment.searchCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            pay.userTransactionDetail = resp.result.response.content[0]
          } else {
            pay.userTransactionDetail = {}
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      coursePayment.checkPaymentStatusAfterRequest = function () {
        coursePayment.stateUpdateTimeInterval = setInterval(function () {
          var request = {
            entityName: 'userpayment',
            userid: pay.userId,
            courseid: pay.courseId,
            batchid: pay.batchId,
            id: pay.userTransactionDetail.id
          }
          coursePayment.getCoursePayment(request).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var result = resp.result.response[0]
              if (result.userpaid) {
                pay.progress = false
              }
              if (result.paymentstatus === 'PAYMENT_SUCCESS') {
                clearInterval(coursePayment.stateUpdateTimeInterval)
              }
            }
          })
        }, 4000)
      }

      pay.close = function () {
        var msg = 'success'
        if (msg === 'success') {
          // $rootScope.$emit('enrollCourse', { message: msg, batchId: pay.batchId, courseId: pay.courseId })
        } else {
          // $rootScope.$emit('enrollCourse', { message: 'failure' })
        }
        window.history.back()
      }

      pay.checkCoursePayment()
      pay.courseDetail()
    }])
