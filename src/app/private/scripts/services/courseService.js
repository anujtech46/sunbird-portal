'use strict'

angular.module('playerApp')
  .service('courseService', ['restfulLearnerService', 'config', '$sessionStorage', 'restfulContentService',
    'uuid4',
    function (restfulLearnerService, config, $sessionStorage, restfulContentService, uuid4) {
    /**
     * @class courseService
     * @desc Service to manage courses
     * @memberOf Services
     */
      /**
             * @method search
             * @desc Search courses
             * @memberOf Services.courseService
             * @param {Object}  req - Request Object
             * @return {Promise} Promise object represents list of searched courses.
             * @instance
             */
      this.search = function (req) {
        return restfulContentService.post(config.URL.COURSE.SEARCH, req)
      }
      /**
             * @method courseSchedule
             * @desc Schedule courses
             * @memberOf Services.courseService
             * @param {Object}  req - Request Object
             * @return {Promise} Promise object represents response code and message.
             * @instance
             */
      this.courseSchedule = function (req) {
        var url = config.URL.USER_BASE + config.URL.COURSE.USER_COURSE_SCHEDULE + '/' + $sessionStorage.token
        return restfulLearnerService.get(url, req)
      }
      /**
             * @method courseContentState
             * @desc Post  course content state
             * @memberOf Services.courseService
             * @param {Object}  req - Request Object
             * @return {Promise} Promise object represents response code and message.
             * @instance
             */
      this.courseContentState = function (req) {
        return restfulLearnerService.post(config.URL.COURSE.USER_CONTENT_STATE, req)
      }
      /**
             * @method courseHierarchy
             * @desc Get  course hierarchy
             * @memberOf Services.courseService
             * @param {Object}  req - Request Object
             * @return {Promise} Promise object represents hierarchy of  courses.
             * @instance
             */
      this.courseHierarchy = function (courseId) {
        var url = config.URL.COURSE.HIERARCHY + '/' + courseId
        return restfulContentService.get(url)
      }
      /**
             * @method enrollUserToCourse
             * @desc Enroll user to course
             * @memberOf Services.courseService
             * @param {Object}  req - Request Object
             * @return {Promise} Promise object represents response code and message.
             * @instance
             */
      this.enrollUserToCourse = function (req) {
        return restfulLearnerService.post(config.URL.COURSE.ENROLL_USER_COURSE, req)
      }

      this.getRequestBody = function (req) {
        return {
          'id': uuid4.generate(),
          'ts': new Date(),
          'params': {},
          'request': req
        }
      }

      this.getContentScore = function (req) {
        var url = config.URL.OBJECT.SEARCH
        return restfulLearnerService.post(url, this.getRequestBody(req))
      }
    }])
