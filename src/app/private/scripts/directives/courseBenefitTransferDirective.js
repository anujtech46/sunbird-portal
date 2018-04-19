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
    'toasterService', 'badgeService', function ($rootScope, $scope, coursePayment, $state, userService,
      toasterService, badgeService) {
      var courseBT = this
      courseBT.courseId = $scope.courseid
      courseBT.userId = $rootScope.userId
      courseBT.progress = $rootScope.enrolledCourseIds[courseBT.courseId] &&
        $rootScope.enrolledCourseIds[courseBT.courseId].progress
      courseBT.currentUser = userService.getCurrentUserProfile()
      courseBT.ccBadgeId = $rootScope.course_completion_badge_id

      courseBT.getCourseDetail = function () {
        var isEnroled = _.find($rootScope.enrolledCourses, { courseId: courseBT.courseId })
        courseBT.batchId = isEnroled && isEnroled.batchId
        courseBT.courseImage = isEnroled.courseLogoUrl
        coursePayment.getPaymentDetail(courseBT.courseId, function (priceDetail) {
          courseBT.courseBenefit = priceDetail && priceDetail.coursebenefit
          courseBT.payment = (priceDetail && priceDetail.payment).toLowerCase()
        })
        courseBT.getCourseBadge()
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
              !courseBT.userTransactionDetail.benefittransfer && courseBT.userTransactionDetail.coursecomplete
            }
            if (courseBT.payment === 'mandatory') {
              courseBT.userTransactionDetail = _.find(resp.result.response.content, { userpaid: true })
              courseBT.isShowBTButton = courseBT.userTransactionDetail && courseBT.userTransactionDetail.userpaid &&
                !courseBT.userTransactionDetail.benefittransfer && courseBT.userTransactionDetail.coursecomplete
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
        var badgeDetail = _.find(courseBT.currentUser.badgeAssertions, { 'badgeId': courseBT.ccBadgeId })
        console.log('Checked badge, if not get from user profile again', badgeDetail)
        if (badgeDetail) {
          courseBT.userBadges = badgeDetail
          if (!courseBT.userBadges.issuerName) {
            courseBT.getIssuerName()
          }
        } else {
          userService.getUserProfile(courseBT.userId).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var badge = _.find(resp.result.response.badgeAssertions,
                { 'badgeId': $rootScope.course_completion_badge_id })
              courseBT.userBadges = badge
              courseBT.getIssuerName()
            }
          })
        }
      }

      courseBT.getIssuerName = function () {
        var issuerList = badgeService.getIssuerListDetail() || []
        var issuer = _.find(issuerList, { 'issuerId': courseBT.userBadges.issuerId })
        if (issuer) {
          courseBT.userBadges.issuerName = issuer.name
        } else {
          badgeService.getIssuerList(courseBT.userBadges.issuerId).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var issuer = _.find(resp.result.issuers,
                { 'issuerId': courseBT.userBadges.issuerId })
              courseBT.userBadges.issuerName = issuer.name
              issuerList.push(issuer)
              badgeService.storeIssuerListDetail(issuerList)
            }
          })
        }
      }

      courseBT.getCourseDetail()
    }])
