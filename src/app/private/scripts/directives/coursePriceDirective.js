'use strict'

angular.module('playerApp')
  .directive('coursePrice', ['$rootScope', function ($rootScope) {
    return {
      restrict: 'E',
      controller: 'coursePriceCtrl',
      controllerAs: 'coursePrice',
      scope: {
        courseid: '=',
        viewtype: '=',
        coursedata: '='
      },
      link: function (scope, element, attrs, batch) {
      },
      templateUrl: 'views/course/price/coursePrice.html'
    }
  }])
  .controller('coursePriceCtrl', ['$rootScope', '$scope', 'coursePriceService', '$state', 'userService', '$timeout',
    'toasterService', 'coursePayment', function ($rootScope, $scope, coursePriceService, $state, userService,
      $timeout, toasterService, coursePayment) {
      var coursePrice = this
      coursePrice.viewType = $scope.viewtype
      coursePrice.courseId = $scope.courseid
      coursePrice.course = $scope.coursedata
      coursePrice.userId = $rootScope.userId

      coursePrice.getPriceDetail = function () {
        var request = {
          entityName: 'courseprice',
          id: coursePrice.courseId
        }

        coursePriceService.getPrice(request).then(function (response) {
          if (response && response.responseCode === 'OK') {
            coursePrice.data = response.result.response[0]
            if (coursePrice.viewType === 'CARD') {
              coursePayment.setPaymentDetail(coursePrice.data)
            }
            coursePrice.titleMessage = coursePrice.data && coursePrice.data.id ? 'Update Price' : 'Add Price'
          } else {
            toasterService.error('Unbale to get course price, Please try again later')
          }
        }).catch(function (err) {
          console.log('err', err)
        })
      }

      coursePrice.data = $scope.pricedata ? Object.assign({}, $scope.pricedata) : undefined

      coursePrice.hideCoursePriceModal = function () {
        $timeout(function () {
          $('#coursePriceModal').modal('hide')
          $('#coursePriceModal').modal('hide others')
          $('#coursePriceModal').modal('hide all')
          $('#coursePriceModal').modal('hide dimmer')
        }, 0)
      }

      coursePrice.initializeModal = function () {
        coursePrice.showCoursePriceModal = true
        $timeout(function () {
          $('#courseTypeDD').dropdown()
          $('#coursePriceModal').modal({
            onHide: function () {
              coursePrice.data = coursePrice.viewType === 'CARD' ? coursePrice.data : {}
              coursePrice.showCoursePriceModal = false
            }
          }).modal('show')
        }, 10)
        $timeout(function () {
          $('#copyLinkButton').trigger('click', function () {
            coursePrice.copyLink()
          })
        }, 1000)
      }

      coursePrice.close = function () {
        coursePrice.showCoursePriceModal = false
        coursePrice.hideCoursePriceModal()
      }

      coursePrice.saveMetaData = function (data) {
        if (coursePrice.data && coursePrice.data.id) {
          coursePrice.updatePrice(data)
        } else {
          coursePrice.addPrice(data)
        }
      }

      coursePrice.getRequest = function (data) {
        return {
          entityName: 'courseprice',
          indexed: true,
          payload: {
            id: coursePrice.courseId,
            courseid: coursePrice.courseId,
            payment: data.payment,
            courseprice: data.courseprice,
            coursebenifit: data.coursebenifit,
            createddate: coursePrice.data && coursePrice.data.createddate
              ? coursePrice.data.createddate
              : (new Date()).toISOString(),
            updateddate: (new Date()).toISOString()
          }
        }
      }

      coursePrice.addPrice = function (data) {
        var request = coursePrice.getRequest(data)
        coursePriceService.addPrice(request).then(function (response) {
          if (response && response.responseCode === 'OK') {
            toasterService.success('Price added successfully...')
            coursePrice.data = response.result.data
            coursePrice.hideCoursePriceModal()
          } else {
            toasterService.error('Unable to add price, please try again later')
          }
        }).catch(function (err) {
          console.log('err', err)
          toasterService.error('Unable to add price, please try again later')
        })
      }

      coursePrice.updatePrice = function (data) {
        var request = coursePrice.getRequest(data)

        coursePriceService.editPrice(request).then(function (response) {
          if (response && response.responseCode === 'OK') {
            coursePrice.data = request.payload
            coursePrice.hideCoursePriceModal()
            toasterService.success('Price updated successfully...')
          } else {
            toasterService.error('Unable to update price, please try again later')
          }
        }).catch(function (err) {
          console.log('err', err)
          toasterService.error('Unable to update price, please try again later')
        })
      }
    }])
