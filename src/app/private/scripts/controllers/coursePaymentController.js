'use strict'

angular.module('playerApp')
  .controller('coursePaymentCtrl', ['$rootScope', '$stateParams', 'toasterService',
    '$timeout', 'contentStateService', '$scope', '$location', '$state', 'coursePayment', 'uuid4', '$base64',
    function ($rootScope, $stateParams, toasterService, $timeout, contentStateService,
      $scope, $location, $state, coursePayment, uuid4, $base64) {
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
        var string = {
          merchantId: 'M2306160483220675579140',
          transactionId: 'TXN' + new Date().getTime(),
          merchantOrderId: 'TXN' + new Date().getTime(),
          amount: 100,
          instrumentType: 'VPA',
          instrumentReference: 'nishant@ybl',
          expiresIn: 300
        }
        //var encodedReq = btoa(string)
        coursePayment.collectPayment().then(function (resp) {
          console.log(resp.success);
          pay.progress = true;
          var resp = {status: 'success'}
          if (resp.status == 'success') {
            $('#payModal').modal('show');
            // Set time to call object API
            setTimeout(function(){
                pay.submitPaymentDetail(resp)
            }, 300);
          } else {
            toasterService.error('Payment failed, please try again later')
          }
        }, function () {
          toasterService.error('Payment failed, please try again later')
        })
      }

      pay.submitPaymentDetail = function (resp) {
        pay.progress = false;
        var request = {
          entityName: 'userpayment',
          indexed: true,
          payload: {
            id: uuid4.generate(),
            userid: pay.userId,
            courseid: pay.courseId,
            batchid: pay.batchId,
            upiid: pay.upiId,
            createddate: (new Date()).toISOString(),
            userpaid: true,
            userpaidtransactionid: resp.transactionId
          }
        }
        coursePayment.createCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'CLIENT ERROR') {
            $('#payModal').modal('show');
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
        coursePayment.getCoursePayment(request).then(function (resp) {
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

      pay.checkCoursePayment()

      pay.close = function () {
        var msg = 'success'
        if (msg === 'success') {
          $rootScope.$emit('enrollCourse', { message: msg, batchId: pay.batchId, courseId: pay.courseId })
        } else {
          $rootScope.$emit('enrollCourse', { message: 'failure' })
        }
        window.history.back()
      }

      pay.courseDetail()
    }])
