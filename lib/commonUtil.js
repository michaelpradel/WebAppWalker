// commonly used functions that can run in 
//   (i) the add-on context
//  (ii) the page context
// (iii) node.js

(function() {
  // TODO move more code here

  var markerPrefix = "#WAW_NAME_";
  var markerSuffix = "_WAW_NAME#";

  function Event(type /*string*/, src /*string*/,
      elem /*DOM element*/, eventDetails/*string*/) {
    this.xpath = elem ? getElementXPath(elem) : undefined;
    this.type = type;
    this.handlerName = extractHandlerId(src);
    this.eventDetails = eventDetails;
    if (elem) {
      this.elemDetails = extractElemDetails(elem);
      if (elem.id)
        this.id = elem.id;
      if (elem.className)
        var realClass = elem.className.replace(/ WAW_highlight/g, "");
      if (realClass)
        this.class = realClass;
    }
    this.asString = eventToString(this);
  }

  function eventToString(evt) {
    // TODO when using handlerName, must deal w/ generated names, e.g., <top-level>14
//    var props = ["xpath", "type", "handlerName", "eventDetails", "elemDetails", "id", "class"];
// ignoring elemDetails because it contains very large strings for SugarCRM 
    var props = ["xpath", "type", "eventDetails", /*"elemDetails",*/ "id", "class"];
    return JSON.stringify(evt, props);
  }

  function evtToShortString(evt) {
    var result = evt.type;
    if (evt.id)
      result += ", " + evt.id;
    if (evt.elemDetails)
      result += ", " + evt.elemDetails;
    if (evt.eventDetails)
      result += ", " + evt.eventDetails;
    return result;
  }

  function SEvent(state, evt) {
    this.state = state;
    this.evt = evt;
    this.asString = evt.asString + "@@@" + state.toString();
  }

  function SDEvent(src, evt, dest) {
    this.src = src;
    this.evt = evt;
    this.dest = dest;
    this.asString = evt.asString + "@@@" + src.toString() + ">>>" + dest.toString();
  }

  function Transition(sdevt, cost) {
    this.sdevt = sdevt;
    this.cost = cost;
  }

  Transition.prototype = {
    toString: function() {
      return this.sevt.asString + " with cost " + this.cost;
    }
  };

  function sdEvtStrToSEvtStr(sdEvtStr) {
    return sdEvtStr.split(">>>")[0];
  }
  
  function sdEvtStrToDest(sdEvtStr) {
    return sdEvtStr.split(">>>")[1];
  }
  
  function extractHandlerId(src) {
    if (!src) {
      return undefined;
    }
    var start = src.indexOf(markerPrefix);
    if (start === -1) {
      return undefined;
    }
    start = start + markerPrefix.length;
    var end = src.indexOf(markerSuffix);
    if (end === -1) {
      return undefined;
    }
    var id = src.slice(start, end);
    return id;
  }

  function extractElemDetails(elem) {
    if (elem.tagName === "INPUT")
      return "";
    else {
      var t = elem.textContent;
      if (t)
        t = t.slice(0, 30);
      return t;
    }
  }

  /*
   * Gets an XPath for an element which describes its hierarchical location.
   * (MP: Copied from firebug.)
   */
  function getElementXPath(element) {
    if (element && element.id) {
      return '//*[@id="' + element.id + '"]';
    } else {
      return getElementTreeXPath(element);
    }
  }

  // (MP: Copied from firebug.)
  function getElementTreeXPath(element) {
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType === 1; element = element.parentNode) {
      var index = 0;
      for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        // Ignore document type declaration.
        if (sibling.nodeType === 10 /*Node.DOCUMENT_TYPE_NODE*/)
          continue;
        if (sibling.nodeName === element.nodeName)
          ++index;
      }

      var tagName = element.nodeName.toLowerCase();
      var pathIndex = (index ? "[" + (index + 1) + "]" : "");
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
  }

  var random = Math.random;

  function setRandomFct(f) {
    random = f;
  }

  function randInt(excludedMax) { // random int in [0,excludedMax[
    return Math.floor((random() * excludedMax));
  }

  function randElem(array) {
    return array[randInt(array.length)];
  }

  function rand() {
    return random();
  }

  function randString() {
    var length = randInt(20) + 1;
    var result = "";
    for (var i = 0; i < length; i++) {
      var randCharCode = randInt(57) + 65;
      result += String.fromCharCode(randCharCode);
    }
    return result;
  }
  
  function shuffle(array) {
    return array.sort(function(x, y) {
      if (rand() > 0.5)
        return -1;
      else
        return 1;
    });
  }

  function string2hash(str) {
    if (Object.prototype.toString.apply(str) !== "[object String]")
      throw "Should only call for strings, but passed: " + str;
    var hash = 0;
    if (!str)
      return hash;
    for (i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  function hashInto(oldHash, x) {
    var result = ((oldHash << 5) - oldHash) + x;
    result = result & result;
    return result;
  }

  // whether arr1 can be made equal to arr2 by removing some of its elements
  function contains(arr1, arr2) {
    if (arr1.length < arr2.length)
      return false;
    var maxSkips = arr1.length - arr2.length;
    var skips = 0;
    var idx1 = 0;
    var idx2 = 0;
    while (skips <= maxSkips && idx1 < arr1.length && idx2 < arr2.length) {
      if (arr1[idx1] === arr2[idx2]) {
        idx1++;
        idx2++;
        if (idx2 === arr2.length)
          return true;
      } else {
        skips++;
        idx1++;
      }
    }
    if (skips <= maxSkips && idx1 === arr1.length && idx2 === arr2.length) {
      return true;
    } else {
      return false;
    }
  }

  // whether arr1 is the concatenation of arr2+..+arr2
  function repeats(arr1, arr2) {
    if (arr1.length === 0 || arr2.length === 0)
      return false;
    if (arr2.length % arr1.length !== 0)
      return false;
    var idx1 = 0;
    for (var idx2 = 0; idx2 < arr2.length; idx2++) {
      if (arr1[idx1] !== arr2[idx2])
        return false;
      idx1++;
      if (idx1 === arr1.length)
        idx1 = 0;
    }
    return true;
  }

  function removeRepetitions(arr) {
    for (var idx = 1; idx < arr.length; idx++) {
      var repLength = 1;
      while (repLength * 2 <= idx + 1) {
        var potentialOrig = arr.slice(idx - repLength * 2 + 1, idx - repLength + 1);
        var potentialRep = arr.slice(idx - repLength + 1, idx + 1);
        if (same(potentialOrig, potentialRep)) {
          var result = [];
          for (var copyIdx = 0; copyIdx < arr.length; copyIdx++) {
            if (copyIdx < idx - repLength + 1 || copyIdx > idx) {
              result.push(arr[copyIdx]);
            }
          }
          return removeRepetitions(result);
        }
        repLength++;
      }
    }
    return arr;
  }

  function same(arr1, arr2) {
    if (arr1.length !== arr2.length)
      return false;
    for (var idx = 0; idx < arr1.length; idx++) {
      if (arr1[idx] !== arr2[idx])
        return false;
    }
    return true;
  }

  function unwrapObject(object) {
    if (!object)
      return object;
    try {
      if (object.wrappedJSObject) {
        return object.wrappedJSObject;
      }
    } catch (e) {
      console.log("Problem w/ unwrapping: " + e.trace);
    }
    return object;
  }

  function average(numbers) {
    if (numbers.length === 0)
      return undefined;
    var sum = 0;
    numbers.forEach(function(n) {
      sum += n;
    });
    return sum / numbers.length;
  }

  function median(numbers) {
    if (numbers.length === 0)
      return undefined;
    var middle = numbers.length / 2;
    return numbers.sort()[middle];
  }

  function min(numbers) {
    var m = undefined;
    numbers.forEach(function(n) {
      if (m === undefined || n < m)
        m = n;
    });
    return m;
  }

  function max(numbers) {
    var m = undefined;
    numbers.forEach(function(n) {
      if (m === undefined || n > m)
        m = n;
    });
    return m;
  }

  function PriorityItem(item, priority) {
    if (priority !== priority)
      throw new Error("NaN priority");
    this.item = item;
    this.priority = priority;
  }

  function pickRandomWithPriorities(priorityItems) {
    var sumOfPrios = 0;
    priorityItems.forEach(function(pi) {
      sumOfPrios += pi.priority;
    });
    if (sumOfPrios === 0)
      return randElem(priorityItems);
    var rand = randInt(sumOfPrios);
    var sum = 0;
    for (var idx = 0; idx < priorityItems.length; idx++) {
      var nextSum = sum + priorityItems[idx].priority;
      if (rand >= sum && rand < nextSum)
        return priorityItems[idx];
      sum = nextSum;
    }
    throw new Error("Shouldn't get here: " + priorityItems.map(function(pi) {
      return pi.priority;
    }));
  }

  function accumulatedDiff(arr) {
    if (arr.length < 2)
      return 0;
    var sumOfDiffs = 0;
    for (var idx = 1; idx < arr.length; idx++) {
      sumOfDiffs += (arr[idx] - arr[idx - 1]);
    }
    return sumOfDiffs;
  }

  function assert(cond, msg) {
    if (!cond)
      throw new Error(msg);
  }

  var module;
  if (typeof exports !== "undefined") {
    // export to code running in add-on context
    module = exports;
  } else {
    // export to code running in page context
    unwrapObject(window).$WAWCommonUtil = {};
    module = unwrapObject(window).$WAWCommonUtil;
  }
  module.unwrapObject = unwrapObject;
  module.Event = Event;
  module.eventToString = eventToString;
  module.setRandomFct = setRandomFct;
  module.randInt = randInt;
  module.randElem = randElem;
  module.rand = rand;
  module.shuffle = shuffle;
  module.string2hash = string2hash;
  module.hashInto = hashInto;
  module.average = average;
  module.median = median;
  module.max = max;
  module.min = min;
  module.contains = contains;
  module.repeats = repeats;
  module.removeRepetitions = removeRepetitions;
  module.same = same;
  module.PriorityItem = PriorityItem;
  module.pickRandomWithPriorities = pickRandomWithPriorities;
  module.accumulatedDiff = accumulatedDiff;
  module.randString = randString;
  module.evtToShortString = evtToShortString;
  module.assert = assert;
  module.SEvent = SEvent;
  module.SDEvent = SDEvent;
  module.sdEvtStrToSEvtStr = sdEvtStrToSEvtStr;
  module.sdEvtStrToDest = sdEvtStrToDest;
  module.Transition = Transition;

})();
