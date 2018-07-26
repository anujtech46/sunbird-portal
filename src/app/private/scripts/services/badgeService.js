/**
 * @author: Anuj Gupta
 * @description: This service useful to handle badge data
 */
'use strict'

angular.module('playerApp')
  .service('badgeService', ['restfulLearnerService', 'config', 'permissionsService', 'userService', '$rootScope',
    function (restfulLearnerService, config, permissionsService, userService, $rootScope) {
      var issuerList = []
      /**
             * @method addBadges
             * @desc assign badge to  users .
             * @memberOf Services.adminService
             * @param {Object}  request - Request object
             * @param {string}  request.badgeTypeId - Badge type id
             * @param {string}  request.receiverId - User  id
             * @returns {Promise} Promise object containing response code and message.
             * @instance
             */

      this.addBadges = function (req) {
        var url = config.URL.BADGE.ASSIGN
        return restfulLearnerService.post(url, req)
      }
      /**
                     * @method getBadges
                     * @desc Get badges
                     * @memberOf Services.adminService
                     * @returns {Promise} Promise object containing list of badges.
                     * @instance
                     */
      this.getAllBadgesList = function (data) {
        var url = config.URL.BADGE.BADGE_CLASS_SEARCH
        return restfulLearnerService.post(url, data)
      }

      /**
                     * @method getIssuerList
                     * @desc Get issuer list
                     * @memberOf Services.adminService
                     * @returns {Promise} Promise object containing list of badges.
                     * @instance
                     */
      this.getIssuerList = function (issueid) {
        var url = config.URL.BADGE.GET_ISSUER_LIST
        return restfulLearnerService.get(url)
      }

      this.getIssuerListDetail = function () {
        return issuerList
      }

      this.storeIssuerListDetail = function (data) {
        issuerList = data
      }
    }])
