'use strict'

angular.module('playerApp')
  .controller('coursePaymentCtrl', ['$rootScope', '$http', '$stateParams', 'courseService', 'toasterService',
    '$timeout', 'contentStateService', '$scope', '$location', 'batchService','sessionService','$state',
    function ($rootScope,  $http, $stateParams, courseService, toasterService, $timeout, contentStateService,
      $scope, $location, batchService, sessionService, $state) {
      var pay = this
      pay.title = $stateParams.courseName;
      pay.upiId = '';
      pay.courseId = $stateParams.courseId;
      pay.batchId = $stateParams.batchId;
      pay.userId = $stateParams.userId;
      pay.submitFormData =function(){
        var url = 'http://localhost:4000/user_payment',
            data = {
                  "userId": pay.userId,
                  "courseId": pay.courseId,
                  "batchId": pay.batchId,
                  "upiId": pay.upiId,
                  "userPaidTransactionId": "transaction_7466796",
                  "userPaid": true
                },
            config = 'application/json; charset=utf-8';
            $http.post(url, data, config).then(function (response) {
            // This function handles success
              console.log(response);
              $('#payModal').modal('show');
            }, function (response) {
            // this function handles error
              console.log(response)
            });
      }


      pay.close = function() {
        var msg = 'success'
        if(msg === 'success'){
          $rootScope.$emit('paymentStatus', { message: msg });
        }else{
          $rootScope.$emit('paymentStatus', { message: 'failure' });
        }
        window.history.back()
      }
  }])
