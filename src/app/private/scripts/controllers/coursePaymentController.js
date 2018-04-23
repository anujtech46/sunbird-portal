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
      pay.coursePrice = 0
      // pay.courseTax = 11
      pay.activePatmentMode = 'UPI'
      pay.progress = true

      pay.courseDetail = function () {
        coursePayment.getCourseDetail(pay.courseId, function (courseDetail) {
          pay.courseTitle = courseDetail && courseDetail.name
          pay.courseImage = courseDetail && courseDetail.appIcon
        })
        coursePayment.getPaymentDetail(pay.courseId, function (priceDetail) {
          pay.coursePrice = priceDetail && priceDetail.courseprice
          pay.coursePayment = (priceDetail && priceDetail.payment).toLowerCase()
        })
        pay.isEnrolledCourse = _.find($rootScope.enrolledCourses, { courseId: pay.courseId, batchId: pay.batchId })
        console.log('pay.isEnrolledCourse', pay.isEnrolledCourse)
      }

      pay.collectPayment = function () {
        if (pay.coursePrice === undefined) {
          toasterService.warning('Price is not defined for this course, Please contact admin...')
          return
        }
        if(pay.upiId == ''){
          toasterService.warning('Please enter UPI ID.')
          return
        }
        var req = {
          'amount': pay.coursePrice * 100,
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
            $('#payModal').modal({ closable: false }).modal('show')
            pay.checkPaymentStatusAfterRequest()
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

      pay.skipAndContinue = function () {
        var request = {
          entityName: 'userpayment',
          indexed: true,
          payload: {
            id: uuid4.generate(),
            userid: pay.userId,
            courseid: pay.courseId,
            batchid: pay.batchId,
            upiid: pay.upiId,
            createddate: (new Date()).toISOString()
          }
        }
        coursePayment.createCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            $rootScope.$emit('enrollCourse', { message: 'success', batchId: pay.batchId, courseId: pay.courseId })
            window.history.back()
            pay.userTransactionDetail = resp.result.data
          } else {
            pay.userTransactionDetail = {}
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
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
            var paymentDetail = _.find(resp.result.response.content, { paymentstatus: 'PAYMENT_SUCCESS' })
            pay.userTransactionDetail = paymentDetail
          } else {
            pay.userTransactionDetail = {}
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      pay.checkPaymentStatusAfterRequest = function () {
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
              pay.userTransactionDetail = result
              console.log('Payment status: ', result.paymentstatus)
              if (result.paymentstatus) {
                pay.statusMessage = result.paymentstatus
                pay.progress = false
              }
              if (result.paymentstatus) {
                console.log('Clear timeout', coursePayment.stateUpdateTimeInterval)
                clearInterval(coursePayment.stateUpdateTimeInterval)
              }
            }
          })
        }, 4000)

        setTimeout(() => {
          console.log('Clear timeout after 300 sec, if interval is pending', coursePayment.stateUpdateTimeInterval)
          if (coursePayment.stateUpdateTimeInterval) {
            pay.statusMessage = 'PAYMENT_FAILED'
            pay.progress = false
            clearInterval(coursePayment.stateUpdateTimeInterval)
          }
        }, 300000)
      }

      pay.close = function () {
        if (pay.statusMessage === 'PAYMENT_SUCCESS') {
          $rootScope.$emit('enrollCourse', { message: 'success', batchId: pay.batchId, courseId: pay.courseId })
        } else {
          $rootScope.$emit('enrollCourse', { message: 'failure' })
        }
        window.history.back()
      }

      pay.checkCoursePayment()
      pay.courseDetail()
    }])
