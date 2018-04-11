'use strict'

angular.module('playerApp')
  .service('phonePePaymentService', ['$http', '$rootScope', '$filter', 'config', 'uuid4',
    function ($http, $rootScope, $filter, config, uuid4) {
      function httpCall (url, data, method, header) {
        var URL = config.URL.BASE_PREFIX + config.URL.PHONE_PE_PREFIX + url
        return $http({
          method: method,
          url: URL,
          data: data
        })
      }

      function handleSuccess (response) {
        return (response.data)
      }

      function handleError (response) {
        if (response.data && response.status === 440) {
          alert('Session expired, please login again...')
          window.document.location.replace('/logout')
        }
        return (response.data)
      }

      this.post = function (url, data, headers) {
        var request = httpCall(url, data, 'POST', headers)
        return (request.then(handleSuccess, handleError))
      }

      this.get = function (url, data, headers) {
        var request = httpCall(url, data, 'GET', headers)
        return (request.then(handleSuccess, handleError))
      }
    }])
