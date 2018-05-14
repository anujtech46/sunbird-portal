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
