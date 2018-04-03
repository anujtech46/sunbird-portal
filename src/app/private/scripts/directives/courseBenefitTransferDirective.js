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
    'toasterService', function ($rootScope, $scope, coursePayment, $state, userService, toasterService) {
      var courseBT = this
      courseBT.courseId = $scope.courseid
      courseBT.userId = $rootScope.userId
      courseBT.progress = $rootScope.enrolledCourseIds[courseBT.courseId] &&
        $rootScope.enrolledCourseIds[courseBT.courseId].progress

      courseBT.getCourseDetail = function () {
        var isEnroled = _.find($rootScope.enrolledCourses, { courseId: courseBT.courseId })
        courseBT.batchId = isEnroled && isEnroled.batchId
        courseBT.courseImage = isEnroled.courseLogoUrl
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
        coursePayment.getCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            courseBT.userTransactionDetail = _.find(resp.result.response.content, { userpaid: true })
            courseBT.isShowBTButton = courseBT.userTransactionDetail && courseBT.userTransactionDetail.userpaid &&
              !courseBT.userTransactionDetail.benefittransfer && courseBT.userTransactionDetail.coursecomplete
            if (_.find(resp.result.response.content, { coursecomplete: true })) {
              courseBT.getCourseBadge()
            }
            courseBT.upiId = (courseBT.userTransactionDetail && courseBT.userTransactionDetail.upiid) || ''
          } else {
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      $rootScope.$on('updateCourseComplete', function () {
        console.log('Get updateCourseComplete event')
        if (courseBT.userTransactionDetail && !courseBT.userTransactionDetail.coursecomplete) {
          console.log('update course complete:', courseBT.userTransactionDetail)
          var updatedReq = Object.assign({}, courseBT.userTransactionDetail)
          var request = {
            entityName: 'userpayment',
            indexed: true,
            payload: updatedReq
          }

          request.payload.coursecomplete = true

          coursePayment.updateCoursePayment(request).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              courseBT.isShowBTButton = true
              courseBT.getCourseBadge()
              courseBT.userTransactionDetail = request.payload
            } else {
            }
          }, function (error) {
            console.log('error', error)
          })
        }
      })

      courseBT.getBenefit = function () {
        var req = {
          upiId: courseBT.upiId
        }
        coursePayment.refundPayment(req).then(function (resp) {
          if (resp.status === 'success') {
            courseBT.updatePaymentDetail(resp)
          } else {
            toasterService.error('Payment failed, please try again later')
          }
        }, function () {
          toasterService.error('Payment failed, please try again later')
        })
      }

      courseBT.updatePaymentDetail = function (resp) {
        var updatedReq = Object.assign({}, courseBT.userTransactionDetail)
        updatedReq.benefittransfer = true
        updatedReq.benefittransfertransactionid = resp.transactionId

        var request = {
          entityName: 'userpayment',
          indexed: true,
          payload: updatedReq
        }
        if (!courseBT.userTransactionDetail.coursecomplete) {
          request.payload.coursecomplete = true
        }
        coursePayment.updateCoursePayment(request).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            $('#benefitModal').modal('show')
            courseBT.isShowBTButton = false
            courseBT.userTransactionDetail = request.payload
          } else {
          }
          console.log('resp', resp)
        }, function (error) {
          console.log('error', error)
        })
      }

      courseBT.close = function () {
        $('#benefitModal').modal('hide')
      }

      courseBT.getCourseBadge = function () {
        userService.getUserProfile(courseBT.userId).then(function (resp) {
          if (resp && resp.responseCode === 'OK') {
            var badge = _.find(resp.result.response.badgeAssertions,
              { 'badgeId': $rootScope.course_completion_badge_id })
            if (courseBT.userTransactionDetail) {
              courseBT.userBadges = badge
            } else {
              courseBT.userBadges = {}
            }
          }
        })
      }

      courseBT.getCourseDetail()
    }])
