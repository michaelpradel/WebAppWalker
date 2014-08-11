(function() {
  var chrome = require("chrome");
  var windowUtils = require('sdk/window/utils');
  var util = require('./util.js');

  var commonUtil = require('./commonUtil.js');

  var ignoredEvents = require('./ignoredEvents.js');

  var els = chrome.Cc["@mozilla.org/eventlistenerservice;1"].getService(chrome.Ci.nsIEventListenerService);
  var SHOW_ALL = chrome.Ci.nsIDOMNodeFilter.SHOW_ALL;
  var showNative = false;

  var hasHandlerMarker = "$WAW_hasHandler";

  // reference at https://developer.mozilla.org/en-US/docs/Web/Reference/Events
  // standard events that inherit from UIEvent
  var uiEvents = [
//    "abort",
//    "blur",
    "click"
//    "contextmenu",
//    "dblclick",
//    "focus",
//    "keydown",
//    "keypress",
//    "keyup",
//    "mousedown",
//    "mousenter",
//    "mouseleave",
//    "mousemove",  
//    "mouseout",
//    "mouseover"
//    "mouseup",
//    "resize",
//    "scroll",
//    "select",
//    "show"
  ];
  // ignored for now: DragEvents, TouchEvents, load, unload, error

  function getBoundEventInfos(window, elt) {
    var walker = window.document.createTreeWalker(elt, SHOW_ALL, null, true);

    var node = elt;
    var eventInfos = {};

    function buildEventInfos(elt, info) {
      if (!showNative && info.inSystemEventGroup)
        return;

      var entry = new BoundEventListenerInfo(elt, info);
      if (eventInfos.hasOwnProperty(info.type))
        eventInfos[info.type].push(entry);
      else
        eventInfos[info.type] = [entry]; // one handler of this type
    }

    // Iterate all elements on the page.
    for (; node; node = walker.nextNode()) {
      appendEventInfos(node, buildEventInfos);
    }

    // Iterate all window objects (iframes) on the page.
    var iframes = window.document.getElementsByTagName("iframe");
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      var iframeDocument = iframe.contentWindow.document;
      var iFrameWalker = iframeDocument.createTreeWalker(iframeDocument, SHOW_ALL, null, true);

      var iframeNode = iframeDocument;
      for (; iframeNode; iframeNode = iFrameWalker.nextNode()) {
        appendEventInfos(iframeNode, buildEventInfos);
      }
    }

    return eventInfos;
  }

  function appendEventInfos(elt, fnTakesEltInfo) {
    var infos = els.getListenerInfoFor(elt, {});
    for (var i = 0; i < infos.length; i++) {
      var anInfo = infos[i];
      if (anInfo instanceof chrome.Ci.nsIEventListenerInfo)
        fnTakesEltInfo(elt, anInfo);
    }
  }

  function BoundEventListenerInfo(element, eventInfo) {
    this.element = element;
    this.listener = eventInfo;
  }

  function getAvailableEvents() {
    var result = [];

    var active = windowUtils.getMostRecentBrowserWindow();
    var window = active.content;

    // find all enabled UI events
    var eventInfos = getBoundEventInfos(window, window.document);
    var summaryStr = "Available events:";
    for (var uiEventIdx = 0; uiEventIdx < uiEvents.length; uiEventIdx++) {
      var eventType = uiEvents[uiEventIdx];
      if (eventInfos.hasOwnProperty(eventType)) {
        summaryStr += " " + eventType + "=" + eventInfos[eventType].length;
        for (var evtInfoIdx = 0; evtInfoIdx < eventInfos[eventType].length; evtInfoIdx++) {
          var evtInfo = eventInfos[eventType][evtInfoIdx];
          var elem = util.unwrapObject(evtInfo.element);
          var listenerSrc = evtInfo.listener.toSource();
          if (!ignoredEvents.ignore(elem, eventType, listenerSrc)) {
            var evt = new commonUtil.Event(eventType, listenerSrc, elem);
            result.push(evt);
          }
        }
      }
    }
    console.log(summaryStr);

    return result;
  }

  function markElementsWithHandlers() {
    var active = windowUtils.getMostRecentBrowserWindow();
    var window = active.content;

    // find all enabled UI events
    var eventInfos = getBoundEventInfos(window, window.document);
    for (var uiEventIdx = 0; uiEventIdx < uiEvents.length; uiEventIdx++) {
      var eventType = uiEvents[uiEventIdx];
      if (eventInfos.hasOwnProperty(eventType)) {
        for (var evtInfoIdx = 0; evtInfoIdx < eventInfos[eventType].length; evtInfoIdx++) {
          var evtInfo = eventInfos[eventType][evtInfoIdx];
          var elem = util.unwrapObject(evtInfo.element);
          elem[hasHandlerMarker] = true;
        }
      }
    }
  }

  exports.getAvailableEvents = getAvailableEvents;
  exports.markElementsWithHandlers = markElementsWithHandlers;

})();
