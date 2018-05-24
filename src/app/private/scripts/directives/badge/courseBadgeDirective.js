/*
 * Filename: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src/app/private/scripts/directives/badge/courseBadgeDirective.js
 * Path: /home/anujkumar/Desktop/public-sunbird/sunbird-portal/src
 * Created Date: Tuesday, May 15th 2018, 12:11:48 pm
 * Author: Anuj Gupta
 */

'use strict'

angular.module('playerApp')
  .directive('courseBadge', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'E',
      controller: 'courseBadgeCtrl',
      controllerAs: 'courseBadge',
      scope: {
        courseid: '=',
        coursedata: '=',
        batchdata: '='
      },
      link: function (scope, element, attrs, courseBadge) {
        $rootScope.$on('currentCourseBatchCompleted', function (e, data) {
          console.log('currentCourseBatchCompleted')
          courseBadge.getCourseBadge()
        })
      },
      templateUrl: 'views/course/courseBadge.html'
    }
  }])
  .controller('courseBadgeCtrl', ['$rootScope', '$scope', '$state', 'userService',
    'toasterService', 'badgeService', 'sessionService', 'restfulPlayerService', 'config',
    function ($rootScope, $scope, $state, userService, toasterService, badgeService, sessionService,
      restfulPlayerService, config) {
      var courseBadge = this
      courseBadge.courseId = $scope.courseid
      courseBadge.userId = $rootScope.userId
      courseBadge.batchData = $scope.batchdata
      courseBadge.currentUser = userService.getCurrentUserProfile()
      courseBadge.ccBadgeId = $rootScope.course_completion_badge_id
      courseBadge.courseData = $scope.coursedata

      courseBadge.getCourseDetail = function () {
        var courseBatchIdData = sessionService.getSessionData('COURSE_BATCH_ID')
        if (courseBatchIdData && (courseBatchIdData.courseId === courseBadge.courseId)) {
          courseBadge.batchId = courseBatchIdData.batchId
        } else {
          return
        }
        var isEnrolled = _.find($rootScope.enrolledCourses, { batchId: courseBadge.batchId })
        courseBadge.progress = $rootScope.enrolledBatchIds[courseBadge.batchId] &&
        $rootScope.enrolledBatchIds[courseBadge.batchId].progress
        courseBadge.courseImage = isEnrolled.courseLogoUrl
        courseBadge.getCourseBadge()
      }

      courseBadge.loadDigiLockerScript = function () {
        courseBadge.addToDigiLockerId = String(Date.now())
        var digiLockerScript = document.createElement('script')
        var timeStamp = Date.now()
        var appId = $('#addToDigiLockerAppID').attr('value')
        var hash = CryptoJS.SHA256(appId + $('#addToDigiLockerAppKey').attr('value') + timeStamp).toString()
        digiLockerScript.setAttribute('type', 'text/javascript')
        digiLockerScript.setAttribute('src', $('#addToDigiLockerUrl').attr('value'))
        digiLockerScript.setAttribute('id', 'dlshare')
        digiLockerScript.setAttribute('data-app-id', appId)
        digiLockerScript.setAttribute('data-app-hash', hash)
        digiLockerScript.setAttribute('time-stamp', timeStamp)
        document.head.appendChild(digiLockerScript)
      }

      courseBadge.close = function () {
        $('#addToDigiLocker').modal('hide')
        $('#addToDigiLocker').modal('hide all')
        $('#addToDigiLocker').modal('hide other')
      }

      courseBadge.getCourseBadge = function () {
        var badgeDetail = _.find(courseBadge.currentUser.badgeAssertions, { 'badgeId': courseBadge.ccBadgeId })
        console.log('Checked badge, if not get from user profile again', badgeDetail)
        if (badgeDetail) {
          courseBadge.userBadges = badgeDetail
          if (!courseBadge.userBadges.issuerName) {
            courseBadge.getIssuerName()
          }
        } else {
          userService.getUserProfile(courseBadge.userId).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var badge = _.find(resp.result.response.badgeAssertions,
                { 'badgeId': $rootScope.course_completion_badge_id })
              courseBadge.userBadges = badge
              courseBadge.getIssuerName()
            }
          })
        }
      }

      courseBadge.getIssuerName = function () {
        var issuerList = badgeService.getIssuerListDetail() || []
        var issuer = _.find(issuerList, { 'issuerId': courseBadge.userBadges.issuerId })
        if (issuer) {
          courseBadge.userBadges.issuerName = issuer.name
        } else {
          badgeService.getIssuerList(courseBadge.userBadges.issuerId).then(function (resp) {
            if (resp && resp.responseCode === 'OK') {
              var issuer = _.find(resp.result.issuers,
                { 'issuerId': courseBadge.userBadges.issuerId })
              courseBadge.userBadges.issuerName = issuer.name
              issuerList.push(issuer)
              badgeService.storeIssuerListDetail(issuerList)
            }
          })
        }
      }

      function getUserTitle (gender) {
        if (gender) {
          gender = gender.toLowerCase()
          return gender === 'male' ? 'Mr.' : gender === 'female' ? 'Mrs.' : ''
        } else {
          return ''
        }
      }

      function firstLetterUpperCase (string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
      }

      function getUserFullName (userData) {
        if (userData) {
          return firstLetterUpperCase(courseBadge.currentUser.firstName) + ' ' +
              firstLetterUpperCase(courseBadge.currentUser.lastName)
        } else {
          return ''
        }
      }

      courseBadge.download = function () {
        var request = {
          title: getUserTitle(courseBadge.currentUser && courseBadge.currentUser.gender),
          name: getUserFullName(courseBadge.currentUser),
          courseName: courseBadge.courseData.name,
          userId: courseBadge.userId,
          courseId: courseBadge.courseData && courseBadge.courseData.identifier,
          createdDate: new Date()
        }

        restfulPlayerService.post(config.URL.CERTIFICATE.COURSE, {request: request}).then(function (response) {
          if (response && response.responseCode === 'OK') {
            courseBadge.fileUrl = response.result && response.result.fileUrl
          } else {
            toasterService.error('Unable to download file, Please try again later...')
          }
        }).catch(function () {
          toasterService.error('Unable to download file, Please try again later...')
        })
      }
      courseBadge.getCourseDetail()
    }])
