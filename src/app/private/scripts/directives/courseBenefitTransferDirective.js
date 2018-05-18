'use strict'

angular.module('playerApp')
  .directive('courseBenefitTransfer', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'E',
      controller: 'courseBenefitTransferCtrl',
      controllerAs: 'courseBT',
      scope: {
        courseid: '='
      },
      link: function (scope, element, attrs, batch) {
      },
      templateUrl: 'views/course/payment/courseBenefitTransfer.html'
    }
  }])
  .controller('courseBenefitTransferCtrl', ['$rootScope', '$scope', 'coursePayment', '$state', 'userService',
    'toasterService', 'badgeService', 'sessionService',
    function ($rootScope, $scope, coursePayment, $state, userService, toasterService, badgeService, sessionService) {
      var courseBT = this
      courseBT.courseId = $scope.courseid
      courseBT.userId = $rootScope.userId
      courseBT.currentUser = userService.getCurrentUserProfile()
      courseBT.ccBadgeId = $rootScope.course_completion_badge_id

      courseBT.getCourseDetail = function () {
        var courseBatchIdData = sessionService.getSessionData('COURSE_BATCH_ID')
        if (courseBatchIdData && (courseBatchIdData.courseId === courseBT.courseId)) {
          courseBT.batchId = courseBatchIdData.batchId
        } else {
          return
        }
        var isEnrolled = _.find($rootScope.enrolledCourses, { batchId: courseBT.batchId })
        courseBT.progress = $rootScope.enrolledBatchIds[courseBT.batchId] &&
        $rootScope.enrolledBatchIds[courseBT.batchId].progress
        courseBT.courseImage = isEnrolled.courseLogoUrl
        coursePayment.getPaymentDetail(courseBT.courseId, courseBT.batchId, function (priceDetail) {
          courseBT.courseBenefit = priceDetail && priceDetail.coursebenefit
          courseBT.payment = (priceDetail && priceDetail.payment).toLowerCase()
        })
        courseBT.getUserCoursePaymentDetail()
      }

      courseBT.getUserCoursePaymentDetail = function () {
        var request = {
          entityName: 'userpayment',
          filters: {
            userid: courseBT.userId,
            courseid: courseBT.courseId,
            batchid: courseBT.batchId
          }
        }
        coursePayment.searchCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            if (courseBT.payment === 'optional') {
              courseBT.userTransactionDetail = _.find(resp.result.response.content, { courseid: courseBT.courseId })
              courseBT.isShowBTButton = courseBT.userTransactionDetail &&
              !courseBT.userTransactionDetail.benefittransfer
            }
            if (courseBT.payment === 'mandatory') {
              courseBT.userTransactionDetail = _.find(resp.result.response.content, { userpaid: true })
              courseBT.isShowBTButton = courseBT.userTransactionDetail && courseBT.userTransactionDetail.userpaid &&
                !courseBT.userTransactionDetail.benefittransfer
              if (_.find(resp.result.response.content, { coursecomplete: true })) {
              }
            }
            courseBT.upiId = (courseBT.userTransactionDetail && courseBT.userTransactionDetail.upiid) || ''
          } else {
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      courseBT.getBenefit = function () {
        if (!courseBT.upiId) {
          toasterService.info('UPI ID is missing, Please contact to admin...')
          return
        }
        var req = {
          'amount': courseBT.courseBenefit * 100,
          'instrumentType': 'MOBILE',
          'instrumentReference': courseBT.upiId.replace('@ybl', ''),
          'userPaidTxnId': courseBT.userTransactionDetail.id
        }
        $('#benefitModal').modal({ closable: false }).modal('show')
        coursePayment.refundPayment({request: req}).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            courseBT.updatePaymentDetail(resp)
          } else {
            courseBT.close()
            toasterService.error('Transaction failed, please try again later')
          }
        }, function () {
          courseBT.close()
          toasterService.error('Transaction failed, please try again later')
        })
      }

      courseBT.updatePaymentDetail = function (resp) {
        var updatedReq = Object.assign({}, courseBT.userTransactionDetail)
        updatedReq.benefittransfertransactionid = resp.result.data.transactionId
        updatedReq.coursebenefit = courseBT.courseBenefit

        var request = {
          entityName: 'userpayment',
          indexed: true,
          payload: updatedReq
        }
        if (!courseBT.userTransactionDetail.coursecomplete) {
          request.payload.coursecomplete = true
        }
        coursePayment.updateCoursePayment(request).then(function (resp) {
          courseBT.checkPaymentStatusAfterRequest()
          if (resp && resp.responseCode === 'OK') {
            courseBT.userTransactionDetail = request.payload
          } else {
            courseBT.userTransactionDetail = {}
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      courseBT.checkPaymentStatusAfterRequest = function () {
        console.log('time start', Date.now())
        coursePayment.stateUpdateTimeInterval = setInterval(function () {
          var request = {
            entityName: 'userpayment',
            userid: courseBT.userId,
            courseid: courseBT.courseId,
            batchid: courseBT.userTransactionDetail.batchId,
            id: courseBT.userTransactionDetail.id
          }
          coursePayment.getCoursePayment(request).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var result = resp.result.response[0]
              courseBT.userTransactionDetail = result
              console.log('Payment status: ', result.benefittransferstatus)
              if (result.benefittransferstatus) {
                courseBT.statusMessage = result.benefittransferstatus
                courseBT.progress = false
                console.log('Clear timeout', coursePayment.stateUpdateTimeInterval)
                clearInterval(coursePayment.stateUpdateTimeInterval)
              }
              if (result.benefittransferstatus === 'PAYMENT_SUCCESS') {
                courseBT.isShowBTButton = false
              }
            }
          })
        }, 4000)
        setTimeout(function () {
          console.log('Clear timeout after 300 sec, if interval is pending', coursePayment.stateUpdateTimeInterval)
          if (coursePayment.stateUpdateTimeInterval) {
            courseBT.statusMessage = 'PAYMENT_FAILED'
            courseBT.progress = false
            clearInterval(coursePayment.stateUpdateTimeInterval)
          }
        }, 300000)
      }

      courseBT.close = function () {
        $('#benefitModal').modal('hide')
        $('#benefitModal').modal('hide all')
        $('#benefitModal').modal('hide other')
      }

      courseBT.getCourseDetail()
    }])
