'use strict'

angular.module('playerApp')
  .controller('contentPlayerCtrl', ['$state', '$scope', 'contentService', '$timeout', '$stateParams',
    'config', '$rootScope', '$location', '$anchorScroll', 'toasterService', '$window',
    function ($state, $scope, contentService, $timeout, $stateParams, config, $rootScope,
      $location, $anchorScroll, toasterService, $window) {
      $scope.isClose = $scope.isclose
      $scope.isHeader = $scope.isheader
      $scope.showModalInLectureView = true
      $scope.contentProgress = 0
      $scope.telemetryEnv = ($state.current.name === 'Toc') ? 'course' : 'library'
      var count = 0

      $scope.getContentEditorConfig = function (data) {
        var configuration = {}
        configuration.context = config.ekstep_CP_config.context
        configuration.context.contentId = $scope.contentData.identifier
        configuration.context.sid = $rootScope.sessionId
        configuration.context.uid = $rootScope.userId
        configuration.context.channel = org.sunbird.portal.channel
        if (_.isUndefined($stateParams.courseId)) {
          configuration.context.dims = org.sunbird.portal.dims
        } else {
          var cloneDims = _.cloneDeep(org.sunbird.portal.dims) || []
          cloneDims.push($stateParams.courseId)
          if ($rootScope.batchHashTagId) {
            cloneDims.push($rootScope.batchHashTagId)
          }
          configuration.context.dims = cloneDims
        }
        configuration.context.tags = _.concat([], org.sunbird.portal.channel)
        configuration.context.app = [org.sunbird.portal.appid]
        configuration.context.partner = []
        if ($rootScope.isTocPage) {
          configuration.context.cdata = [{
            id: $stateParams.courseId,
            type: 'course'
          }]
        }
        configuration.context.pdata = {
          'id': org.sunbird.portal.appid,
          'ver': '1.0',
          'pid': 'sunbird-portal'
        }
        configuration.config = config.ekstep_CP_config.config
        configuration.config.plugins = config.ekstep_CP_config.config.plugins
        configuration.config.repos = config.ekstep_CP_config.config.repos
        configuration.metadata = $scope.contentData
        configuration.data = $scope.contentData.mimeType !== config.MIME_TYPE.ecml ? {} : data.body
        configuration.config.overlay = config.ekstep_CP_config.config.overlay || {}
        configuration.config.splash = config.ekstep_CP_config.config.splash || {}
        configuration.config.overlay.showUser = false
        return configuration
      }

      $scope.adjustPlayerHeight = function () {
        var playerWidth = $('#contentViewerIframe').width()
        if (playerWidth) {
          var height = playerWidth * (8 / 14)
          $('#contentViewerIframe').css('height', height + 'px')
        }
      }

      function showPlayer (data) {
        $scope.contentData = data
        $scope._instance = {
          id: $scope.contentData.identifier,
          ver: $scope.contentData.pkgVersion
        }
        $scope.showMetaData = $scope.isshowmetaview
        $rootScope.contentId = $scope.contentData.identifier

        $scope.showIFrameContent = true
        var iFrameSrc = config.ekstep_CP_config.baseURL
        $timeout(function () {
          var previewContentIframe = $('#contentViewerIframe')[0]
          previewContentIframe.src = iFrameSrc
          previewContentIframe.onload = function () {
            $scope.adjustPlayerHeight()
            var configuration = $scope.getContentEditorConfig(data)
            previewContentIframe.contentWindow.initializePreview(configuration)
            $scope.gotoBottom()
          }
        }, 0)

        /**
         * @event 'sunbird:portal:telemetryend'
         * Listen for this event to get the telemetry OE_END event
         * from renderer
         * Player controller dispatching the event sunbird
         */
        document.getElementById('contentPlayer').addEventListener('renderer:telemetry:event',function (event, data) { // eslint-disable-line
          org.sunbird.portal.eventManager.dispatchEvent('sunbird:player:telemetry',
            event.detail.telemetryData)
        })
        /* window.onbeforeunload = function (e) { // eslint-disable-line
          playerTelemetryUtilsService.endTelemetry({ progress: $scope.contentProgress })
        } */
      }

      function showLoaderWithMessage (showMetaLoader, message, closeButton, tryAgainButton) {
        var error = {}
        error.showError = true
        error.showMetaLoader = showMetaLoader
        error.messageClass = 'red'
        error.message = message
        error.showCloseButton = closeButton
        error.showTryAgainButton = tryAgainButton
        $scope.errorObject = error
      }

      function getContent (contentId) {
        var req = { contentId: contentId }
        var qs = {
          fields: 'body,editorState,templateId,languageCode,template,' +
                        'gradeLevel,status,concepts,versionKey,name,appIcon,contentType,owner,' +
                        'domain,code,visibility,createdBy,description,language,mediaType,' +
                        'osId,languageCode,createdOn,lastUpdatedOn,audience,ageGroup,' +
                        'attributions,artifactUrl,mimeType,medium,year,publisher'
        }
        contentService.getById(req, qs).then(function (response) {
          if (response && response.responseCode === 'OK') {
            if (response.result.content.status === 'Live' || response.result.content.status === 'Unlisted' ||
             $scope.isworkspace) {
              $scope.errorObject = {}
              showPlayer(response.result.content)
            } else {
              if (!count) {
                count += 1
                toasterService.warning($rootScope.messages.imsg.m0027)
                $window.history.back()
              }
            }
          } else {
            var message = $rootScope.messages.stmsg.m0009
            showLoaderWithMessage(false, message, true, true)
          }
        }).catch(function () {
          var message = $rootScope.messages.stmsg.m0009
          showLoaderWithMessage(false, message, true, true)
        })
      }

      $scope.close = function () {
        if ($scope.closeurl === 'Profile') {
          $state.go($scope.closeurl)
          return
        }
        if ($scope.closeurl) {
          if ($rootScope.search.searchKeyword !== '') {
            $timeout(function () {
              $rootScope.$emit('initSearch', {})
            }, 0)
          } else {
            $state.go($scope.closeurl)
          }
        }
        $scope.errorObject = {}
        if ($scope.id) {
          $scope.id = ''
        }
        if ($scope.body) {
          $scope.body = {}
        }

        $scope.visibility = false
        if (document.getElementById('contentPlayer')) {
          document.getElementById('contentPlayer').removeEventListener('renderer:telemetry:event', function () {
            org.sunbird.portal.eventManager.dispatchEvent('sunbird:player:telemetry',
              event.detail.telemetryData)
          }, false)
        }
      }

      $scope.updateContent = function (scope) {
        if (scope.body) {
          getContent(scope.body.identifier)
        } else if (scope.id) {
          getContent(scope.id)
        }
      }

      $scope.tryAgain = function () {
        $scope.errorObject = {}
        getContent($scope.id)
      }

      $scope.getConceptsNames = function (concepts) {
        var conceptNames = _.map(concepts, 'name').toString()
        if (concepts && conceptNames.length < concepts.length) {
          var filteredConcepts = _.filter($rootScope.concepts, function (p) {
            return _.includes(concepts, p.identifier)
          })
          conceptNames = _.map(filteredConcepts, 'name').toString()
        }
        return conceptNames
      }

      // Restore default values(resume course, view dashboard) onAfterUser leave current state
      $('#courseDropdownValues').dropdown('restore defaults')

      $scope.gotoBottom = function () {
        $('html, body').animate({
          scrollTop: $('#player-auto-scroll').offset().top
        }, 500)
      }

      function comm (url, type, data, success, error) {
        $.ajax({
          url: url,
          type: type,
          contentType: 'application/json',
          data: data,
          success: function (d) { console.log('Success with ' + url); success(d) },
          error: error
        })
      }

      var warnShown = false

      function ping () {
        var s = function (r) {
          console.log('Ping received by server')

          var activeTime = Math.floor(Date.now() / 1000) - r['create_time']
          var timeout = r['timeout']

          if (activeTime > timeout - 60) {
            $('#jupyter-frame').remove()
            clearInterval(notebook.pingId)
            toasterService.error('Your session on notebooks has timed out. Please close notebook tab(s) ' +
            'and relanch the same.')
          } else if (activeTime > timeout - 900 && !warnShown) {
            toasterService.error('You have 15 minutes left on your notebook session. ' +
            'Please save your open notebooks to avoid losing data.')
            warnShown = true
          }
        }

        var f = function () { console.log('Ping failed') }
        comm('/jbox/ping', 'GET', {}, s, f)
      }

      function loadNotebook () {
        var s = function (r) {
          notebook.poll()
        }

        var f = function () { console.log('Failed to load notebook') }

        var data = { }

        comm('/jbox/loadNotebook', 'POST', data, s, f)
      }

      var notebook = {
        num_fail: 0,
        num_pending: 0,
        pingId: -1,

        poll: function () {
          comm('/jbox/nb_status', 'GET', {}, notebook.poll_success, notebook.poll_fail)
        },

        repoll: function () {
          setTimeout(notebook.poll, 5000)
        },

        poll_fail: function () {
          if (notebook.num_fail >= 5) {
            console.log('Notebook status poll failed')
            notebook.show_error()
          } else {
            console.log('Notebook status poll failed, retrying...')
            notebook.num_fail += 1
            notebook.repoll()
          }
        },

        show_error: function () {
          toasterService.error('There was an error creating notebook. Please try after some time.')
        },

        /*
        hide_loading: function () {
            $('#loading-div').css('display', 'none');
        },
    
        show_loading: function () {
            $('#loading-div').css('display', 'block');
        },
        */

        poll_success: function (d) {
          var st = d['status']

          console.log('Notebook poll status: ' + st)
          if (st === 'error') {
            notebook.poll_fail()
          } else if (st === 'ready') {
            var url = '/notebook?X-JuliaRun-notebook=' + d['nburl']
            var startTime = Math.floor(Date.now() / 1000)

            var startNb = function (url) {
              notebook.pingId = setInterval(ping, 60000)
            }

            var renderNotebook = function () {
              var timeout = 60
              var s = function (r) {
                console.log('Jupyter server is up!')
                clearTimeout(notebook.check_timer)
                startNb(url)
              }

              var f = function () {
                console.log('Waiting for jupyter server to load...')
                var spentTime = Math.floor(Date.now() / 1000) - startTime
                if (spentTime > timeout) {
                  clearTimeout(notebook.check_timer)
                  startNb(url)
                } else {
                  notebook.check_timer = setTimeout(renderNotebook, 2000)
                }
              }

              $.ajax(url)
                .done(s)
                .fail(f)
            }

            notebook.check_timer = setTimeout(renderNotebook, 4000)
          } else {
            if (notebook.num_pending >= 100) {
              notebook.show_error()
            } else {
              notebook.num_fail = 0
              notebook.num_pending += 1
              notebook.repoll()
            }
          }
        }
      }

      function loadCourseDetails () {
        var mydata = JSON.parse(sessionStorage.getItem('sbConfig'))
        if (typeof mydata.ENROLLED_COURSES === 'undefined') {
          return ''
        }

        var uid = mydata.ENROLLED_COURSES.uid
        var contentId = mydata.COURSE_PARAMS.contentId
        var courseId = mydata.COURSE_PARAMS.courseId
        var batchId = mydata.COURSE_PARAMS.batchId
        // var course
        // while (course = mydata.ENROLLED_COURSES.courseArr.pop()) { // eslint-disable-line no-cond-assign
        //   if (courseId === course.courseId) {
        //     batchId = course.batchId
        //     break
        //   }
        // }
        var courseDetailsStr = '?courseId=' + courseId + '&contentId=' + contentId +
                                     '&batchId=' + batchId + '&uid=' + uid
        // alert("course_details_str = " + course_details_str);
        return courseDetailsStr
      }

      $window.open_notebook = function (url) {
        // alert("open_notebook called");
        var newUrl = url + loadCourseDetails()
        console.log('Open notebook link:', newUrl)
        $window.open(newUrl)
      }

      $(document).ready(function () {
        loadNotebook()
      })
    }])
