'use strict'

angular.module('playerApp')
  .controller('purchaseListCtrl', ['$rootScope', '$scope', 'coursePayment', '$state', 'userService',
    'toasterService', 'badgeService', function ($rootScope, $scope, coursePayment, $state, userService,
      toasterService, badgeService) {
      var purchaseList = this
      purchaseList.userId = $rootScope.userId

      purchaseList.getUserCoursePaymentDetail = function () {
        var request = {
          entityName: 'userpayment',
          filters: {
            userid: purchaseList.userId
          }
        }
        purchaseList.loader = toasterService.loader('', 'We are fetching purchases..')
        coursePayment.searchCoursePayment(request).then(function (resp) {
          purchaseList.loader.showLoader = false
          if (resp && resp.responseCode === 'OK') {
            purchaseList.purchaseList = (resp.result.response && resp.result.response.content) || []
          } else {
            purchaseList.error = showErrorMessage(true,
              $rootScope.messages.stmsg.m0012,
              $rootScope.messages.stmsg.m0008)
          }
        }, function (error) {
          purchaseList.error = showErrorMessage(true,
            $rootScope.messages.stmsg.m0012,
            $rootScope.messages.stmsg.m0008)
          purchaseList.loader.showLoader = false
          console.log('error', error)
        })
      }

      /**
             * This function called when api failed,
             * and its show failed response for 2 sec.
             * @param {String} message
             */
      function showErrorMessage (isClose, message, messageType, messageText) {
        var error = {}
        error.showError = true
        error.isClose = isClose
        error.message = message
        error.messageType = messageType
        if (messageText) {
          error.messageText = messageText
        }
        return error
      }

      purchaseList.getUserCoursePaymentDetail()
    }])
