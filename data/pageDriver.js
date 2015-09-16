(function() {

  var hasHandlerMarker = "$WAW_hasHandler";

  var globalCostVarName = "$WAW_cost";
  unwrapObject(window)[globalCostVarName] = 0;

  var globalCostTraceVarName = "$WAW_cost_trace";
  unwrapObject(window)[globalCostTraceVarName] = [];

  console.log("Have initialized " + globalCostVarName + " and " + globalCostTraceVarName + " to 0 and []");

  var commonUtil = unwrapObject(window).$WAWCommonUtil;
  var eventBreakConfigs = unwrapObject(window).$WAWEventBreakConfigs;
  var formHints = unwrapObject(window).$formHints;

  var benchmarkConfig = eventBreakConfigs.getConfig();

  window.addEventListener("beforeunload", storeCosts, false);

  function storeCosts() {
    var cost = unwrapObject(window)[globalCostVarName];
    console.log("Storing cost to add-on context: " + cost);
    self.port.emit("storeCosts", cost, unwrapObject(window)[globalCostTraceVarName]);
  }

  function restoreCosts(costs, costTrace) {
    console.log("Restoring cost from add-on context: " + costs);
    var oldCosts = unwrapObject(window)[globalCostVarName];
    if (oldCosts)
      console.log("Warning: WAW_costs are non-zero (" + oldCosts + ") when restoring them");
    unwrapObject(window)[globalCostVarName] = costs;

    var oldCostTrace = unwrapObject(window)[globalCostTraceVarName];
    if (oldCostTrace && oldCostTrace.length > 0)
      console.log("Warning: WAW_cost_trace is non-empty when restoring it");
    unwrapObject(window)[globalCostTraceVarName] = costTrace;
  }

  function addExtraEvents(knownReferers) {
    console.log("addExtraEvents called");
    if (Object.keys(knownReferers).length === 0) {
      addCurrentURL(knownReferers);  // start URL = possible location to go back to
    }
    addCurrentReferer(knownReferers);
    var pseudoEvents = createPseudoEvents(knownReferers);
    attachEmptyHandlers();
    var cost = unwrapObject(window)[globalCostVarName];
    var costTrace = unwrapObject(window)[globalCostTraceVarName];
    self.port.emit("addExtraEventsReturn", pseudoEvents, knownReferers, cost, costTrace);
  }

  var htmlTags = {
    clickInputTypes: {
      button: true,
      checkbox: true,
      image: true,
      radio: true,
      reset: true,
      submit: true
    },
    textInputTypes: {
      color: true,
      date: true,
      datetime: true,
      "datetime-local": true,
      email: true,
      file: true,
      month: true,
      number: true,
      password: true,
      range: true,
      search: true,
      tel: true,
      text: true,
      time: true,
      url: true,
      week: true
    }
  };

  function addCurrentURL(knownReferers) {
    var url = unwrapObject(document.URL);
    if (url && url !== "") {
      knownReferers[url] = true;
    }
  }

  function addCurrentReferer(knownReferers) {
    var referer = unwrapObject(document.referrer);
    if (referer && referer !== "" && isGoodURL(referer)) {
      knownReferers[referer] = true;
    }
  }

  var id2PseudoHandler = {};
  var maxPseudoHandlerId = 0;
  function createPseudoEvent(type, handler, elem, eventDetails) {
    var evt = new commonUtil.Event(type, handler.toString(), elem, eventDetails);
    evt.handler = handler;
    evt.isPseudoEvent = true;
    evt.handlerId = maxPseudoHandlerId++;
    id2PseudoHandler[evt.handlerId] = handler;
    return evt;
  }

  function createPseudoEvents(knownReferers) {
    var result = [];
    // enter text input into forms
    // 0) forms with a user-defined hint on how to fill them
    applyToTopAndAllFrames("form", function() {
      var formElement = $(this)[0];
      var handler = formHints.fillFormHandler(formElement);
      if (handler) {
        result.push(createPseudoEvent("formWithHint", handler, formElement));
      }
    });
    // 1) fill all input fields of a form at once
    applyToTopAndAllFrames("form", function() {
      var inputFields = $(this).find("input");
      var formElement = $(this)[0];
      var subHandlers = [];
      inputFields.each(function() {
        var type = $(this).attr("type");
        if (type === undefined)
          type = "text"; // to deal w/ buggy pages (e.g. todolist app)
        var inputElement = $(this)[0];
        if (htmlTags.textInputTypes.hasOwnProperty(type)) {
          var handler = function(inputElement) {
            return function() {
              var text = createTextInput(type);
              highlight(inputElement);
              inputElement.value = text;
            };
          }(inputElement);
          subHandlers.push(handler);

        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      console.log("Created pseudo event for form with " + subHandlers.length + " input fields");
      result.push(createPseudoEvent("form", handler, formElement));
    });
    // 2) fill text into a single input field
    applyToTopAndAllFrames("input", function() {
      var type = $(this).attr("type");
      if (type === undefined)
        type = "text"; // to deal w/ buggy pages (e.g. todolist app)
      var inputElement = $(this)[0];
      if (htmlTags.textInputTypes.hasOwnProperty(type)) {
        var handler = function(inputElement) {
          return function() {
            var text = createTextInput(type);
            highlight(inputElement);
            inputElement.value = text;
          };
        }(inputElement);
        result.push(createPseudoEvent("input", handler, inputElement));
      }
    });
    // enter text into textarea
    applyToTopAndAllFrames("textarea", function() {
      var area = $(this)[0];
      var handler = function(area) {
        return function() {
          var text = createTextInput();
          console.log("Setting text of text area " + area + " to " + text);
          highlight(area);
          area.value = text;
        };
      }(area);
      result.push(createPseudoEvent("textarea", handler, area));
    });
    // toggle selection of option element (aka drop down menu entries)
    // re-enable if necessary (disabled because some apps, e.g., Joomla, have so many of them)
//    applyToTopAndAllFrames("option", function() {
//      var option = $(this)[0];
//      var handler = function(option) {
//        return function() {
//          option.selected = !option.selected;
//          highlight(option);
//        };
//      }(option);
//      result.push(createPseudoEvent("option", handler, option));
//    });
    // special event for submit buttons (to make them easily identifiable)
    applyToTopAndAllFrames("input", function() {
      var input = $(this)[0];
      if (input.type === "submit") {
        var handler = function() {
          unwrapObject(input).click();
        };
        result.push(createPseudoEvent("submit", handler, input, input.textContent));
      }
    });
    // go back to a known referer
    Object.keys(knownReferers).forEach(function(referer) {
      var handler = function(referer) {
        return function() {
          console.log("Going back to referer " + referer);
          unwrapObject(window.location).href = referer;
        };
      }(referer);
      result.push(createPseudoEvent("backToReferer", handler, undefined, referer));
    });
    // scrolling
    if (canScroll()) {
      result.push(createPseudoEvent("scroll", scroll, undefined));
    }

    return result;
  }

  function createTextInput(type) {
    if (type === "email") {
      return "aaaa@aaa.com";
    } else {
      return commonUtil.randString();
    }
  }

  function canScroll() {
    return getScrollOptions().length > 0;
  }

  function getScrollOptions() {
    var w = unwrapObject(window);
    var b = unwrapObject(window.document.body);
    var availableScrollOptions = [];
    if (w.pageYOffset !== 0)
      availableScrollOptions.push("scrollUp");
    if (w.pageXOffset !== 0)
      availableScrollOptions.push("scrollLeft");
    if (w.pageYOffset <= w.scrollMaxY)
      availableScrollOptions.push("scrollDown");
    if (w.pageXOffset < w.scrollMaxX)
      availableScrollOptions.push("scrollRight");
    return availableScrollOptions;
  }

  function scroll() {
    var w = unwrapObject(window);
    var options = getScrollOptions();
    var selected = options[randInt(options.length)];
    if (selected === "scrollUp")
      w.scrollBy(0, -w.innerHeight);
    else if (selected === "scrollDown")
      w.scrollBy(0, w.innerHeight);
    else if (selected === "scrollLeft")
      w.scrollBy(-w.innerWidth, 0);
    else if (selected === "scrollRight")
      w.scrollBy(w.innerWidth, 0);
    else
      throw "Unexpected scroll option " + selected;
  }

  var URLprefixes = [  // only access pages with these prefixes
    "http://127.0.0.1/joomla/administrator/",
    //"http://127.0.0.1/joomla/",
    "http://127.0.0.1/wordpress/",
    "http://127.0.0.1/mediawiki/",
    "http://127.0.0.1/cmsmadesimple/",
    "http://127.0.0.1/moodle/",
    "http://127.0.0.1/owncloud/",
    "http://127.0.0.1/sugarcrm/",
    "http://127.0.0.1/testlink/",
    "http://127.0.0.1/dokuwiki/",
    "http://127.0.0.1/phpbb/",
    "http://localhost:8181/tests/tizen/todolist/",
    "http://127.0.0.1:8181/tests/example_app/"
  ];
  function isGoodURL(url) {
    if (url.indexOf("mailto") === 0)
      return false;
    var isGood = false;
    URLprefixes.forEach(function(pre) {
      if (url.indexOf(pre) === 0)
        isGood = true;
    });
    return isGood;
  }

  function isRelativeLink(url) {
    return (url.indexOf("http://") !== 0) && (url.indexOf("https://") !== 0);
  }

  function attachEmptyHandlers() {
    var nbEmptyHandlers = 0;
    // click on links
    applyToTopAndAllFrames("a", function() {
      var href = $(this).attr("href");
      if (href && benchmarkConfig.isOnURLWhitelist(href) && (isRelativeLink(href) || isGoodURL(href))) {
        if (!hasHandler(this)) {
          $(this).on("click", function() {
          });
          nbEmptyHandlers++;
        }
      }
    });
    // input elements to click on (checkboxes, etc.)
    applyToTopAndAllFrames("input", function() {
      var type = $(this).attr("type");
      if (htmlTags.clickInputTypes.hasOwnProperty(type)) {
        if (!hasHandler(this)) {
          $(this).on("click", function() {
            highlight($(this));
          });
          nbEmptyHandlers++;
        }
      }
    });
    // click on buttons
    applyToTopAndAllFrames("button", function() {
      if (!hasHandler(this)) {
        $(this).on("click", function() {
          highlight($(this));
        });
        nbEmptyHandlers++;
      }
    });
  }

  function applyToTopAndAllFrames(type, fct) {
    $(type).each(fct);
    $("iframe").each(function() {
      $(this).contents().find(type).each(fct);
    });
  }

  function hasHandler(elem) {
    return unwrapObject(elem)[hasHandlerMarker] === true;
  }

  function canTrigger(evt) {
    if (evt.isPseudoEvent && evt.xpath === undefined) {
      self.port.emit("canTriggerReturn", true);
    } else {
      var elem = getByXpath(evt.xpath);
      var isVis = false;
      if (elem) {
        isVis = unwrapObject(window).$WAW_isVisible(elem);
      }
      if (!isVis && !elem) {
//        console.log("cannot trigger because element not found with path " + evt.xpath);
      } else if (!isVis && elem) {
//        console.log("cannot trigger because element invisible: " + evt.asString);
      }
      self.port.emit("canTriggerReturn", isVis);
    }
  }

  function trigger(evt, elem) {
    unwrapObject(window).onbeforeunload = null; // to avoid pop-ups

    unwrapObject(window)[globalCostVarName] = 0; // reset accumulated cost
    unwrapObject(window)[globalCostTraceVarName] = []; // reset cost trace

    if (evt.isPseudoEvent) {
      console.log("pageDriver will trigger pseudo event: " + evt.type);
      var handler = id2PseudoHandler[evt.handlerId];
//      console.log(" .. handler id = " + evt.handlerId + "    handler = " + handler);
      handler();
    } else {
      var shortSrc = evt.src ? evt.src.split("\n")[0].slice(0, 10) : "(no src)";
      console.log("pageDriver will trigger real event: " + evt.type + " -- " + shortSrc);
      var elem = getByXpath(evt.xpath);
      if (elem) {
        if (evt.type === "click") {
          elem.click();  // some clickables in Joomla don't react on dispatching MouseEvent; calling click() instead
        } else {
          var domEvt = createDomEvent(evt, elem);
          elem.dispatchEvent(domEvt);
        }
        highlight(elem);
      } else {
        console.log("Warning: Could not trigger event because DOM element is undefined/null: " + evt.asString);
      }
    }
    console.log("Sending triggerReturn");
    self.port.emit("triggerReturn");
    console.log();
  }

  function highlight(elem) {
    elem.className = elem.className + " WAW_highlight";
    setTimeout(function() {
      if (elem) {
        elem.className = elem.className.replace(/ WAW_highlight/g, "");
        if (elem.className === "")
          delete elem.className;
      }
    }, 2000);
  }

  function goToURL(url) {
    console.log("Going to " + url);
    unwrapObject(window.location).href = url;
    self.port.emit("triggerReturn");
  }

  function getByXpath(xpath) {
    var wrappedElem = document.evaluate(xpath, document, null, 9, null).singleNodeValue;
    if (!wrappedElem) {
      // search in iframes
      var iframes = document.getElementsByTagName("iframe");
      for (var i = 0; i < iframes.length && !wrappedElem; i++) {
        var iframe = iframes[i];
        try {
          var iframeDocument = iframe.contentWindow.document;
        } catch (err) {
          // can't access due to same-origin policy
          return undefined;
        }
        wrappedElem = iframeDocument.evaluate(xpath, iframeDocument, null, 9, null).singleNodeValue;
      }
    }
    return unwrapObject(wrappedElem);
  }

  function unwrapObject(object) {
    if (!object)
      return object;
    var wrappedObject = object;
    try {
      // throws an exception in case SecurityManager does not allow access to wrappedJSObject property
      wrappedObject = object.wrappedJSObject;
    }
    finally {
      if (wrappedObject)
        return wrappedObject;
      else
        return object;
    }
  }

  function createDomEvent(evt, elem) {
    if (elem instanceof HTMLCanvasElement && evt.type === 'click') {
      var relX = randInt(elem.width) + 1;
      var relY = randInt(elem.height) + 1;
      var canBox = elem.getBoundingClientRect();
      var absX = relX + canBox.left;
      var absY = relY + canBox.top;
      var domEvt = new MouseEvent('click', {clientX: absX, clientY: absY});
      return domEvt;
    } else if (evt.type === "click") {
      return new MouseEvent(evt.type); // use MouseEvent to make clicking on links work
    } else {
      return new Event(evt.type);
    }
  }

  function randInt(maxPlusOne) { // random int between zero and maxPlusOne
    return Math.floor((Math.random() * maxPlusOne));
  }

  function highlightAvailableEvents(xpath, nb) {
    var elem = getByXpath(xpath);
    if (elem) {
      elem.className = elem.className + " WAW_highlight";
    }
  }

  function sendAndResetCost() {
    var cost = unwrapObject(window)[globalCostVarName];
    unwrapObject(window)[globalCostVarName] = 0;
    var costTrace = unwrapObject(window)[globalCostTraceVarName];
    unwrapObject(window)[globalCostTraceVarName] = [];
    self.port.emit("eventCost", cost, costTrace);
  }

  function sendCost() {
    var cost = unwrapObject(window)[globalCostVarName];
    var costTrace = unwrapObject(window)[globalCostTraceVarName];
    self.port.emit("eventCost", cost, costTrace);
  }

  function resetCost() {
    console.log("Resetting cost to 0");
    unwrapObject(window)[globalCostVarName] = 0;
    unwrapObject(window)[globalCostTraceVarName] = [];
  }

  function attachEventLoggers(allAvailableEvents /*array of Event*/, currentState) {
    unwrapObject(window)[globalCostVarName] = 0;
    unwrapObject(window)[globalCostTraceVarName] = [];
    allAvailableEvents.forEach(function(evt) {
      var elem = getByXpath(evt.xpath);
      if (elem && evt.type) {
        elem.addEventListener(evt.type, function() {
          var sevt = new commonUtil.SEvent(currentState, evt);
          self.port.emit("logSEvent", sevt);
        });
      }
    });
  }

  self.port.on("addExtraEvents", addExtraEvents);
  self.port.on("canTrigger", canTrigger);
  self.port.on("trigger", trigger);
  self.port.on("goToURL", goToURL);
  self.port.on("highlight", highlightAvailableEvents);
  self.port.on("restoreCosts", restoreCosts);
  self.port.on("sendAndResetCost", sendAndResetCost);
  self.port.on("resetCost", resetCost);
  self.port.on("sendCost", sendCost);
  self.port.on("attachEventLoggers", attachEventLoggers);

})();

