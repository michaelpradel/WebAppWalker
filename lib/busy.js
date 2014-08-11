(function() {
//  var chrome = require("chrome"); 

  var windowUtils = require('sdk/window/utils');
  var tabsUtils = require("sdk/tabs/utils");

//chrome.Cu.import("resource://gre/modules/Services.jsm");

// register observers of HTTP requests
//var observerService = chrome.Cc["@mozilla.org/observer-service;1"].getService(chrome.Ci.nsIObserverService);
// thread manager service
//var threadService = Services.tm;

// track open HTTP requests w/ observers for start and end of HTTP requests
//var openHTTPRequests = 0;
//var httpStartObserver = { observe : function(subject, topic, data) {
//  openHTTPRequests++;
//}}
//var httpEndObserver = { observe : function(subject, topic, data) {
//  openHTTPRequests--;
//}}
//observerService.addObserver(httpStartObserver, "http-on-modify-request", false);
//observerService.addObserver(httpEndObserver, "http-on-examine-response", false);
//observerService.addObserver(httpEndObserver, "http-on-examine-cached-response", false);
//observerService.addObserver(httpEndObserver, "http-on-examine-merged-response", false);

  var activeStartEvents = 0;
  function attachToMostRecentWindow() {
    // track state of web progress (= 'loading' state seen by the user)
    activeStartEvents = 0;
    var active = windowUtils.getMostRecentBrowserWindow();
    var tabBrowser = tabsUtils.getTabBrowser(active);
    var progressListener = {
      onStateChange: function(webProgress, request, stateFlags, stat) {
        if (stateFlags & 0x00000001 && stateFlags & 0x00080000) {
          activeStartEvents++;
        } else if (stateFlags & 0x00000010 && stateFlags & 0x00080000) {
          if (activeStartEvents > 0)
            activeStartEvents--;
        }
      }
    };
    tabBrowser.addProgressListener(progressListener);
  }

//function hasPendingEvents() {
//  return threadService.currentThread.hasPendingEvents();
//}

//function hasPendingHTTPRequests() {
//  return (openHTTPRequests !== 0);
//}

  function windowLoading() {
    return activeStartEvents !== 0;
  }

  function isBusy() {
    // debugging
//  if (hasPendingEvents()) console.log("hasPendingEvents");
//  if (windowLoading()) console.log("windowLoading");

    return /*hasPendingEvents() || hasPendingHTTPRequests() ||*/ windowLoading();
  }

  exports.isBusy = isBusy;
  exports.attachToMostRecentWindow = attachToMostRecentWindow;

})();