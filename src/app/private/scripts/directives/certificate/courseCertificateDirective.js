'use strict'

angular.module('playerApp')
  .directive('courseCertificate', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'E',
      controller: 'courseCertificateCtrl',
      controllerAs: 'certificate',
      scope: {
        coursedata: '=',
        batchdata: '='
      },
      link: function (scope, element, attrs, batch) {
      },
      templateUrl: 'views/course/certificate/courseCertificate.html'
    }
  }])
  .controller('courseCertificateCtrl', ['$rootScope', '$scope', 'restfulPlayerService', '$state', 'userService',
    'toasterService', 'config', '$window', function ($rootScope, $scope, restfulPlayerService, $state, userService,
      toasterService, config, $window) {
      var certificate = this
      certificate.courseData = $scope.coursedata
      certificate.batchData = $scope.batchdata
      certificate.userData = userService.getCurrentUserProfile()
      certificate.userId = $rootScope.userId

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
          return firstLetterUpperCase(certificate.userData.firstName) + ' ' +
              firstLetterUpperCase(certificate.userData.lastName)
        } else {
          return ''
        }
      }

      certificate.download = function () {
        var request = {
          title: getUserTitle(certificate.userData && certificate.userData.gender),
          name: getUserFullName(certificate.userData),
          courseName: certificate.courseData.name,
          userId: certificate.userId,
          courseId: certificate.courseData && certificate.courseData.identifier,
          createdDate: new Date()
        }

        restfulPlayerService.post(config.URL.CERTIFICATE.COURSE, {request: request}).then(function (response) {
          if (response && response.responseCode === 'OK') {
            var fileUrl = response.result && response.result.fileUrl
            console.log('fileUrl', fileUrl)
            $window.open(fileUrl, '_blank')
          } else {
            toasterService.error('Unable to download file, Please try again later...')
          }
        }).catch(function () {
          toasterService.error('Unable to download file, Please try again later...')
        })
      }
    }])
