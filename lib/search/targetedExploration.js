(function() {

  var commonUtil = require('../commonUtil.js');

  var searchLongerProbability = 0.33333;
  var maxPaths = 10;
  var maxWorklistSize = 10000;

  function computeNextEvent(fsm, currentState, target /*String*/, impossibleAtStart /*set of Strings*/, maxLength, availableSEvts) {
    commonUtil.assert(currentState !== undefined, fsm.toString());
    commonUtil.assert(maxLength > 0);
    console.log("Target: " + target + " -- " + typeof target);

//    console.log("Available events: ");
//    availableSEvts.forEach(function(sevt) {
//      console.log("   > " + sevt.asString);
//    });

    var shortPaths = findShortPathsToTargetBFS(fsm, target, currentState, impossibleAtStart, maxLength, availableSEvts);
    console.log("Nb of short paths: " + shortPaths.length);
    var firstStepsOfShortPaths = {};
    shortPaths.forEach(function(shortPath) {
      firstStepsOfShortPaths[shortPath[0]] = true;
//      console.log("Found path: "+shortPath);
    });
//    console.log(shortPaths.length + " short paths with " + Object.keys(firstStepsOfShortPaths).length + " first steps:");
//    Object.keys(firstStepsOfShortPaths).forEach(function(sevtStr) {
//      console.log("  > "+sevtStr);
//    });
    return commonUtil.randElem(Object.keys(firstStepsOfShortPaths));
  }

  function computeEventSequence(fsm, currentState, target /*String*/, impossibleAtStart /*set of Strings*/, maxLength) {
    commonUtil.assert(currentState !== undefined, fsm.toString());
    commonUtil.assert(maxLength > 0);
    console.log("Target: " + target + " -- " + typeof target);

    // short cut for backToReferer (no need to search FSM)
    if (target.indexOf("backToReferer") !== -1 && (!(target in impossibleAtStart))) { // potential pb: string matching is imprecise...
      return [target];
    }

    var shortPaths = findShortPathsToTargetBFS(fsm, target, currentState, impossibleAtStart, maxLength);
    console.log("Nb of short paths: " + shortPaths.length);
    shortPaths.forEach(function(p) {
      console.log(" .. path of length " + p.length);
    });
    return commonUtil.randElem(shortPaths);
  }

  var itemCtr = 0;
  function WorklistItem(currentState, currentPath, visitedStateTags) {
    this.currentState = currentState;
    this.currentPath = currentPath;
    this.visitedStateTags = visitedStateTags;
    itemCtr++;
  }

  function addToWorklist(worklist, item) {
    var items = worklist[item.currentPath.length] || [];
    items.push(item);
    worklist[item.currentPath.length] = items;
//    console.log("  Adding to worklist, which now has " + sizeString(worklist));
  }

  function hasItems(worklist) {
    for (var idx = 0; idx < worklist.length; idx++) {
      if (worklist[idx] && worklist[idx].length > 0)
        return true;
    }
    return false;
  }

  function takeNext(worklist) {
    // pick randomly from items with smallest available path length
    for (var idx = 0; idx < worklist.length; idx++) {
      if (worklist[idx]) {
        var shuffled = commonUtil.shuffle(worklist[idx]);
        var item = shuffled.pop();
        var newItems = shuffled.length > 0 ? shuffled : undefined;
        worklist[idx] = newItems;
//        console.log("  Taking from worklist, which now has " + sizeString(worklist));
        return item;
      }
    }
    throw new Exception("should not call takeNext() on empty worklist");
  }

  function size(worklist) {
    var nbItems = 0;
    worklist.forEach(function(items) {
      if (items)
        nbItems += items.length;
    });
    return nbItems;
  }

  function sizeString(worklist) {
    var nbItems = 0;
    worklist.forEach(function(items) {
      if (items)
        nbItems += items.length;
    });
    return nbItems + " items up to length " + worklist.length;
  }

  function findShortPathsToTargetBFS(fsm, target, startState, impossibleAtStart /* set of String */, maxLength, availableSEvts) {
    var worklist = []; // length of currentPath --> array of worklist items
    addToWorklist(worklist, new WorklistItem(startState, [], {} /* do not add start state here because of impossibleAtStart transitions */));
    var result = [];
    var lengthOfShortest = Number.MAX_VALUE;

    while (hasItems(worklist)) {
      var item = takeNext(worklist);

      if (item.currentPath.length < maxLength) {
        for (var outgoingId in item.currentState.edges) {
          var outgoing = item.currentState.events[outgoingId];
          var outgoingSEvtStr = commonUtil.sdEvtStrToSEvtStr(outgoing);
          // check if outgoing certainly impossible
          var outgoingImpossible = (item.currentPath.length === 0) && (outgoingSEvtStr in impossibleAtStart);
          if (!outgoingImpossible) {
            // check if outgoing may be possible
            var outgoingMayBePossible = true;
            if (item.currentPath.length === 0) {
              outgoingMayBePossible = false;
              availableSEvts.some(function(sevt) {
                if (sevt.asString === outgoingSEvtStr) {
                  outgoingMayBePossible = true;
                  return true;
                }
              });
            }
            if (outgoingMayBePossible) {
              var newSeq = item.currentPath.slice(0);
              newSeq.push(outgoing);
              if (outgoing === target) {
                if (newSeq.length < lengthOfShortest)
                  lengthOfShortest = newSeq.length;
                result.push(newSeq);
                if (result.length >= maxPaths)
                  return result; // have found enough paths
              }
              // explore further, unless dest already visited or event impossible or we have already a shortest path and random decision stops us
              var destState = item.currentState.edges[outgoingId];
              if (!(destState.tag in item.visitedStateTags)) {
                var newVisitedStateTags = {}; // add destination state to visited states
                for (var vst in item.visitedStateTags)
                  newVisitedStateTags[vst] = true;
                newVisitedStateTags[destState.tag] = true;

                if (newSeq.length < lengthOfShortest) {
                  addToWorklist(worklist, new WorklistItem(destState, newSeq, newVisitedStateTags));
                  if (size(worklist) > maxWorklistSize)
                    return result;
                } else if (commonUtil.rand() < searchLongerProbability) {
                  // if we won't find a shorter path, continue only sometimes (to avoid search many long paths)
                  addToWorklist(worklist, new WorklistItem(destState, newSeq, newVisitedStateTags));
                  if (size(worklist) > maxWorklistSize)
                    return result;
                }
              }
            }
          }
        }
      }
    }

    return result;
  }

  function findShortestPathToTargetBFS(fsm, target, startState, impossibleAtStart /* set of String */, maxLength) {
    var worklist = [];
    worklist.push(new WorklistItem(startState, [], {} /* do not add start state here because of impossibleAtStart transitions */));

    var exploredItemCtr = 0;
    while (worklist.length > 0) {
      var item = worklist.shift(); // take first
      exploredItemCtr++;
//      console.log("Item with state " + item.currentState.tag + " and currentPath: " + item.currentPath + " of length " + item.currentPath.length);

      if (item.currentPath.length < maxLength) {
        for (var outgoingId in item.currentState.edges) {
          var outgoing = item.currentState.events[outgoingId];
          var outgoingImpossible = (item.currentPath.length === 0) && (outgoing in impossibleAtStart);
          if (!outgoingImpossible) {
            var newSeq = item.currentPath.slice(0);
            newSeq.push(outgoing);
            if (outgoing === target) {
//              console.log(">> Returning path (after exploring/creating " + exploredItemCtr + "/" + itemCtr + " items):\n" + newPath);
              return newSeq; // found path to target -- done
            }
            // not yet at target (or found an already explored path) -- explore further, unless dest already visited or event impossible
            var destState = item.currentState.edges[outgoingId];
            if (!(destState.tag in item.visitedStateTags)) {
              var newVisitedStateTags = {}; // add destination state to visited states
              for (var vst in item.visitedStateTags)
                newVisitedStateTags[vst] = true;
              newVisitedStateTags[destState.tag] = true;

              worklist.push(new WorklistItem(destState, newSeq, newVisitedStateTags));
            }
          }
        }
      }
    }
  }

  function containsSeq(seqs, newS) {
    commonUtil.assert(seqs !== undefined && newS !== undefined);
    commonUtil.assert(seqs.length !== undefined && newS.length !== undefined);
    for (var idx = 0; idx < seqs.length; idx++) {
      var s = seqs[idx];
      if (s.length === newS.length) {
        var allSEvtsSame = true;
        for (var idx2 = 0; idx2 < s.length; idx2++) {
          if (s[idx2] !== newS[idx2]) {
            allSEvtsSame = false;
          }
        }
        if (allSEvtsSame) {
          return true;
        }
      }
    }
    return false;
  }

  exports.computeEventSequence = computeEventSequence;
  exports.computeNextEvent = computeNextEvent;

})();

