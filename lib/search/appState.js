(function() {

    var windowUtils = require('sdk/window/utils');

    var util = require('../util.js');
    var wawApi = require('../wawAPI.js');
    var eventBreakConfigs = require('./eventBreakConfigs.js');

    var benchmarkConfig = eventBreakConfigs.getConfig();

    function currentState() {
        return titleAndUrl();
//    return domHash();
    }

    function titleAndUrl() {
        var active = windowUtils.getMostRecentBrowserWindow();
        var window = active.content;
        var title = window.document.title;
        var url = util.unwrapObject(window).document.URL;
        var titleAndUrl = benchmarkConfig.stateAbstraction(title, url);
        return new wawApi.AppState(titleAndUrl[0], titleAndUrl[1]);

        // for Drupal: filtered URL only
//    return new wawApi.AppState("", filterURL(url));
    }

    function domHash() {
        var active = windowUtils.getMostRecentBrowserWindow();
        var window = active.content;
        var html = util.unwrapObject(window).document.documentElement.innerHTML;
        var htmlHash = util.string2hash(html);
        var url = util.unwrapObject(window).document.URL;
        return new wawApi.AppState(htmlHash, url);
    }

    exports.currentState = currentState;

})();

