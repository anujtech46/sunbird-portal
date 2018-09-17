org.ekstep.service.extcontent = new (org.ekstep.service.mainService.extend({
    init: function () {
    },
    initialize: function () {
    },
    api: {
        extContentMetaPath: '/v1/url/fetchmeta',
        getExtUrlMetaAPI: function () {
            return this.extContentMetaPath;
        },
    },
    getExtUrlMeta: function (url) {
        var instance = this;
        return new Promise(function (resolve, reject) {
            var headersParam = {};
            data = JSON.stringify({
                "request": {
                    "url": url
                }
            })
            var extContentMetaPath = instance.api.getExtUrlMetaAPI();
            org.ekstep.service.renderer.callApi(extContentMetaPath, 'POST', headersParam, data, function (resp) {
                var result = {};
                if (!resp.error) {
                    resolve(resp);
                } else {
                    console.info("err getExtUrlMeta() : ", resp.error)
                }
            });
        });
    }
}));
org.ekstep.service.exturlrenderer = org.ekstep.service.extcontent;

org.ekstep.pluginframework.pluginManager.registerPlugin({"id":"org.ekstep.extcontentpreview","ver":"1.0","shortId":"org.eskstep.extcontentpreview","author":"Revathi P","description":"","publishedDate":"","renderer":{"main":"renderer/plugin.js","dependencies":[{"type":"js","src":"renderer/exturlservice.js"},{"type":"css","src":"renderer/style.css"}]}},org.ekstep.contentrenderer.baseLauncher.extend({_constants:{mimeType:["text/x-url"],events:{launchEvent:"renderer:launch:extcontent"}},initLauncher:function(){EkstepRendererAPI.addEventListener(this._constants.events.launchEvent,this.start,this)},start:function(){var n=this;this._super(),windowContent=window.content,this.reset(),jQuery(this.manifest.id).remove();var r=document.createElement("div");this.getPreviewFromURL(windowContent.artifactUrl,function(e,t){r.innerHTML=t,jQuery(r).click(function(e){urlArray=window.parent.location.pathname.split("/"),setTimeout(function(){var e;e=window.open(window.location.origin+"/learn/redirect","_blank"),5<urlArray.length&&"learn"===urlArray[1]&&"course"===urlArray[2]?e.redirectUrl=windowContent.artifactUrl+"#&courseId="+urlArray[3]+"#&batchId="+urlArray[4]+"#&contentId="+windowContent.identifier:e.redirectUrl=windowContent.artifactUrl+"#&contentId="+windowContent.identifier,e.timetobethere=500},200)}),EkstepRendererAPI.dispatchEvent("renderer:splash:hide"),n.addToGameArea(r)})},getPreviewFromURL:function(e,t){var n=this;org.ekstep.service.exturlrenderer.getExtUrlMeta(e).then(function(e){e&&e.result?t(null,n.generatePreview(e.result)):t(null,n.generatePreview({}))}).catch(function(e){console.error("Failed: getExtUrlMeta()",e)})},generatePreview:function(e){var t="<div class='no-preview'><p> No Preview available </p></div>";return e&&e["og:title"]&&e["og:description"]&&(image=e["og:image"]?"<img src='"+e["og:image"]+"' />":"",t="<div class='item preview-link-content'><div class='left-content'><h2 class='grey-text'>"+e["og:site_name"]+"</h2><a class='calm'><span class='header'>"+e["og:title"]+"</span></a><p align='left'>"+e["og:description"]+"</p></div><div class='right-content'>"+image+"</div></div>"),t},reset:function(){this.currentIndex=50,this.totalIndex=100}}))