(function() {

    var ioFile = require("sdk/io/file");
    var commonUtil = require('../commonUtil.js');
    var evtWhitelist = require("./eventWhitelist.js");
    var evtBlacklist = require("./eventBlacklist.js");
    var config = require('../config.js');
    var perfInfluencingRules = require('./perfInfluenceRules.js');
    var targetedExploration = require('./targetedExploration.js');
    var fsmLearner = require('./fsmLearner');
    var util = require('../util.js');
    var eventBreakConfigs = require('./eventBreakConfigs.js');

    var benchmarkConfig = eventBreakConfigs.getConfig();
    var workingDir = util.getCurrentDir();

    var historyOutFile = workingDir + benchmarkConfig.historyOutFile;
    var historyInFile = benchmarkConfig.historyInFile ? workingDir + benchmarkConfig.historyInFile : "";  // empty string --> don't load history
    var rulesInFile = benchmarkConfig.rulesInFile ? workingDir + benchmarkConfig.rulesInFile : "";
    var candidatePairOutFile = workingDir + benchmarkConfig.candidatePairOutFile;

    // parameters
    var maxTargetSeqLength = 10; // default = 10, used 7 for some OOPSLA experiments
    var minEvtsToSearchCandidates = benchmarkConfig.minEvtsToSearchCandidates;  // very high value --> random only
    var maxHistoryLength = benchmarkConfig.maxHistoryLength;         // very high --> targeted exploration phase
    var allowEventPreselection = false; // enable for random exploration only (not used for OOPSLA experiments)
    var backToRefererProbability = 0.1;
    var historyStoreSampleRate = benchmarkConfig.historyStoreSampleRate;
    var minSupport = 3;
    var minConfidence = 0.8;
    var maxStepsToReachSEvt = 200;
    var takeRandomRefererProbability = 0.02;
    var maxDataPointsPerCandidatePair = 60;
    var fastModeMaxDelay = 100; // ms
    var fastModeMinDelay = 50; // ms
    var slowModeDelay = 500;   // ms

    var prioEvtProbability = 0.8;
    var debug = true;

    // global state
    var history = []; // Transitions
    var sdevt2Costs = {};
    var currentCandidatePair;
    var impossibleSEvtStrings = {}; // set of SEvt strings
    var exploredCandidatePairs = {}; // CandidatePair string --> CandidatePair
    var cachedInfluenceRules;
    var cachedFsmAndState;
    var expectedDest;
    var historyStoreCtr = 0;
    var candidatePairCtr = 0;
    // stats
    var stats = {
        lastPickedIsRandom:false,
        nbRandomEvts:0,
        nbEvtsTowardTarget:0,
        nbConsideredCandPairs:0,
        nbTargetsReached:0
    };

    // reset button
    function reset() {
        if (debug)
            console.log("resetting EventBreak algorithm");
        history = [];
        sdevt2Costs = {};
        currentCandidatePair = undefined;
        impossibleSEvtStrings = {};
        exploredCandidatePairs = {};
        cachedInfluenceRules = undefined;
        cachedFsmAndState = undefined;
        expectedDest = undefined;
    }

    // data structures
    function CandidatePair(influencingSDEvt, influencedSDEvt) {
        this.influencingSDEvt = influencingSDEvt;
        this.influencedSDEvt = influencedSDEvt;
        this.state = CandidatePairState.towardInfluenced;
        this.asString = influencingSDEvt.asString + "==influences==" + influencedSDEvt.asString;
        this.costs = [];
        this.stepsLeft = maxStepsToReachSEvt;

        candidatePairCtr++;
        this.id = candidatePairCtr;
    }

    CandidatePair.prototype = {
        toString:function() {
            return "Candidate pair " + this.id + " with cost vector " + this.costs + ": " + this.influencingSDEvt.asString + " influences " + this.influencedSDEvt.asString;
        },
        nextTargetSDEvt:function() {
            if (this.state === CandidatePairState.towardInfluencing)
                return this.influencingSDEvt;
            else
                return this.influencedSDEvt;
        },
        markTargetReached:function() {
            this.stepsLeft = maxStepsToReachSEvt;
            if (this.state === CandidatePairState.towardInfluencing)
                this.state = CandidatePairState.towardInfluenced;
            else
                this.state = CandidatePairState.towardInfluencing;
        },
        matchesTarget:function(sdevt) {
            if (this.state === CandidatePairState.towardInfluencing)
                return this.influencingSDEvt.asString === sdevt.asString;
            else
                return this.influencedSDEvt.asString === sdevt.asString;
        }
    };

    var CandidatePairState = {
        towardInfluenced:"towardInfluenced",
        towardInfluencing:"towardInfluencing"
    };

    // helper functions

    function setFastMode() {
        if (debug)
            console.log("Entering fast mode");
        config.setMinDelayBetweenEvents(fastModeMinDelay);
        config.setMaxDelayBetweenEvents(fastModeMaxDelay);
    }

    function setSlowMode() {
        if (debug)
            console.log("Entering slow mode");
        config.setMinDelayBetweenEvents(slowModeDelay);
        config.setMaxDelayBetweenEvents(slowModeDelay);
    }

    function isWorthExploring(costs) {
        if (costs.length < 2)
            return false;
        return alwaysIncreases(costs);
    }

    function alwaysIncreases(costs) {
        if (costs.length < 2)
            return false;
        for (var i = 0; i < costs.length; i++) {
            if (i > 0 && costs[i - 1] >= costs[i])
                return false;
        }
        return true;
    }

    function takeRandomBackToReferer(availableSEvents) {
        commonUtil.assert(availableSEvents.length > 0);

        var backToRefererSEvents = availableSEvents.filter(function(sevt) {
            return sevt.evt.type === "backToReferer";
        });
        if (backToRefererSEvents.length > 0) {
            if (debug)
                console.log("selecting random backToReferer event");
            return commonUtil.randElem(backToRefererSEvents);
        }
        return takeRandom(availableSEvents, "no referer among available events -- taking random event");
    }

    function takeRandom(availableSEvents, msg) {
        stats.lastPickedIsRandom = true;

        // if any of the events are prioritized (via hints by user), choose one of them with a fixed probability
        var prioEvents = availableSEvents.filter(function(sevt) {
            return evtWhitelist.isPrioritizedSEvt(sevt);
        });
        if (prioEvents.length > 0 && commonUtil.rand() < prioEvtProbability) {
            var sevt = commonUtil.randElem(prioEvents);
            console.log("Biased random decision for prioritized event: " + sevt.asString);
            return sevt;
        }

        // if there's a backToReferer event, give backToReferer events a fixed total chance (to avoid flooding events when there are many known referers)
        var availableSEventsBackToReferrer = [];
        var availableSEventsOthers = [];
        availableSEvents.forEach(function(sevt) {
            if (sevt.evt.type === "backToReferer")
                availableSEventsBackToReferrer.push(sevt);
            else
                availableSEventsOthers.push(sevt);
        });
        commonUtil.assert(availableSEvents.length === availableSEventsBackToReferrer.length + availableSEventsOthers.length);
        var selectedSEvt;
        if (availableSEventsBackToReferrer.length === 0) {
            selectedSEvt = commonUtil.randElem(availableSEventsOthers);
        } else {
            if (commonUtil.rand() < backToRefererProbability)
                selectedSEvt = commonUtil.randElem(availableSEventsBackToReferrer);
            else
                selectedSEvt = commonUtil.randElem(availableSEventsOthers);
        }
        if (debug)
            console.log("  DDD random decision -- " + msg);
        return selectedSEvt;
    }

    // store and load (parts of) global state
    function storeHistory() {
        var f = ioFile.open(historyOutFile, "w");
        f.write(JSON.stringify(history));
        f.close();
        if (debug)
            console.log("Have stored history to " + historyOutFile);
    }

    function loadHistory(driverSetRefererCallback) {
        if (historyInFile && ioFile.exists(historyInFile)) {
            var historyJSON = ioFile.read(historyInFile, "r");
            history = JSON.parse(historyJSON);
            if (debug)
                console.log("Have loaded history from " + historyOutFile);

            // extract backToReferer links and propagate them to driver
            var knownReferers = {};
            history.forEach(function(transition) {
                var evt = transition.sdevt.evt;
                if (evt.type === "backToReferer") {
                    var ref = evt.eventDetails;
                    commonUtil.assert(ref);
                    knownReferers[ref] = true;
                }
            });
            if (debug)
                console.log("Extracted " + Object.keys(knownReferers).length + " refers from history.");
            driverSetRefererCallback(knownReferers);
        }
    }

    function storeExploredCandidatePairs() {
        if (currentCandidatePair) {
            var s = currentCandidatePair.asString;
            exploredCandidatePairs[s] = currentCandidatePair;
        }

        var f = ioFile.open(candidatePairOutFile, "w");
        f.write(JSON.stringify(exploredCandidatePairs));
        f.close();
        if (debug)
            console.log("Have stored " + Object.keys(exploredCandidatePairs).length + " explored candidate pairs to " + candidatePairOutFile);
    }

    function printStats() {
        console.log("Stats about cyclePerfGuidance:");
        console.log(JSON.stringify(stats, 0, 2));
        console.log("  nb unique SDEvents         =" + Object.keys(sdevt2Costs).length);

        // sevent-cost relationship
        var costsLength2NbSDEvts = {};
        for (var sdevt in sdevt2Costs) {
            var costs = sdevt2Costs[sdevt];
            var oldNbSDEvts = costsLength2NbSDEvts[costs.length] || 0;
            costsLength2NbSDEvts[costs.length] = oldNbSDEvts + 1;
        }
        var costLengthString = "";
        for (var costsLength in costsLength2NbSDEvts) {
            costLengthString += costsLength2NbSDEvts[costsLength] + " events with " + costsLength + " costs; ";
        }
    }

    function getInfluenceRules() {
        if (cachedInfluenceRules === undefined) {
            if (rulesInFile && ioFile.exists(rulesInFile)) {
                var rulesJson = ioFile.read(rulesInFile, "r");
                cachedInfluenceRules = JSON.parse(rulesJson);
                if (debug)
                    console.log("Loaded rules from file: " + cachedInfluenceRules.length);
            } else {
                if (debug)
                    console.log("Inferring influence rules...");
                var rules = perfInfluencingRules.computeRules([history], minSupport, minConfidence);
                cachedInfluenceRules = rules;
                if (debug)
                    console.log("... done inferring influence rules");
            }
        }
        return cachedInfluenceRules;
    }

    function getFsmAndState() {
        if (cachedFsmAndState === undefined) {
            console.log("Inferring FSM...");
            cachedFsmAndState = fsmLearner.learnFSM(history);
            commonUtil.assert(cachedFsmAndState !== undefined);
            commonUtil.assert(cachedFsmAndState[0] !== undefined);
            commonUtil.assert(cachedFsmAndState[1] !== undefined, cachedFsmAndState[0]);
            console.log("... done inferring FSM. Current state = " + cachedFsmAndState[1].tag);
            console.log("-----------------------------------------------------");
        }
        return cachedFsmAndState;
    }

    function updateFsmAndState(sdevt) {
        if (cachedFsmAndState !== undefined) {
            // check if observed sdevt fits the destination expected by the model
            console.log("new state according to model: " + expectedDest); // TODO RAD
            console.log("new observed state          : " + sdevt.dest); // TODO RAD
            if (expectedDest === sdevt.dest) {
                var newState = cachedFsmAndState[1].destStateForEvent(sdevt.asString);
                if (newState !== undefined) {
                    cachedFsmAndState = [cachedFsmAndState[0], newState];
                    if (debug)
                        console.log("Setting new state to " + newState.tag);
                    return;
                }
            }
            // if event doesn't match the model, invalidate FSM (and learn a new one)
            if (debug)
                console.log("Observed transition doesn't match the model; invalidating the model. Expected destination was " + expectedDest + " but reached " + sdevt.dest);
            cachedFsmAndState = undefined;
        }
    }

    function findNewCandidatePair() {
        if (history.length < minEvtsToSearchCandidates)
            return undefined;

        var influenceRules = getInfluenceRules();
        if (debug)
            console.log("Influence rules: " + influenceRules.length + " -- Explored candidate pairs: " + Object.keys(exploredCandidatePairs).length);

        // focus on not yet explored rules, take top-ranked first
        for (var idx = 0; idx < influenceRules.length; idx++) {
            var rule = influenceRules[idx];
            var candidatePair = new CandidatePair(rule.influencingSDEvt, rule.influencedSDEvt);
            if (!(candidatePair.asString in exploredCandidatePairs))
                return candidatePair;
        }
        if (debug)
            console.log("No more unexplored candidate pairs!");
    }

    function markCurrentCandidatePairExplored() {
        currentCandidatePair = undefined;
    }

    // API method
    function addTransition(src, evt, dest, cost) {
        commonUtil.assert(evt, "event shouldn't be falsy");
        commonUtil.assert(src, "event shouldn't be falsy");
        commonUtil.assert(typeof src === "string");
        commonUtil.assert(typeof dest === "string");

        var sdevt = new commonUtil.SDEvent(src, evt, dest);
        history.push(new commonUtil.Transition(sdevt, cost));
        if (debug)
            console.log("addTransition with " + sdevt.asString + " -- cost=" + cost);
        updateFsmAndState(sdevt);

        historyStoreCtr++;
        if (historyStoreCtr % historyStoreSampleRate === 0) {
            storeHistory();
        }

        var costs = sdevt2Costs[sdevt.asString] || [];
        costs.push(cost);
        sdevt2Costs[sdevt.asString] = costs;

        impossibleSEvtStrings = {};

        if (currentCandidatePair !== undefined) {
            if (currentCandidatePair.matchesTarget(sdevt)) {
                if (debug)
                    console.log("Reached target: " + sdevt.asString);
                currentCandidatePair.markTargetReached(); // change target if we just reached the target
                if (debug)
                    console.log("New target: " + currentCandidatePair.nextTargetSDEvt().asString);
                if (currentCandidatePair.state === CandidatePairState.towardInfluencing) { // have just reached influenced event
                    currentCandidatePair.costs.push(cost); // add to cost vector
                    if (debug)
                        console.log(currentCandidatePair.toString());
                    // check if worth exploring further
                    if (currentCandidatePair.costs.length > 1 && !isWorthExploring(currentCandidatePair.costs)) {
                        storeExploredCandidatePairs();
                        markCurrentCandidatePairExplored(currentCandidatePair);
                        if (debug)
                            console.log(" .. not worth exploring further");
                    } else if (currentCandidatePair.costs.length >= maxDataPointsPerCandidatePair) {
                        storeExploredCandidatePairs();
                        markCurrentCandidatePairExplored(currentCandidatePair);
                        if (debug)
                            console.log(" .. have explored candidate pair " + maxDataPointsPerCandidatePair + " times -- stopping now");

                    } else {
                        storeExploredCandidatePairs();
                        if (debug)
                            console.log(" .. seems worth exploring further");
                    }
                }
            }
        }
    }

    // wrapper to gather statistics on states and their explored evts
    function selectNextEventWrapper(currentState, allAvailableEventsUnfiltered) {
        var allAvailableSEvents = [];
        allAvailableEventsUnfiltered.forEach(function(evt) {
            var sevt = new commonUtil.SEvent(currentState, evt);
            if (evtWhitelist.sevtOnWhitelist(sevt) && evtBlacklist.sevtOnBlacklist(sevt) === false)
                allAvailableSEvents.push(sevt);
        });

        if (history.length >= maxHistoryLength) {
            storeHistory();
            return undefined;
        }

        return selectNextEvent(currentState, allAvailableSEvents);
    }

    // API method
    function selectNextEvent(currentState, availableSEvents) {
        expectedDest = undefined;
        if (debug)
            console.log("====================== selectNextEvent ====================");
        if (history.length === 0) {
            commonUtil.assert(currentCandidatePair === undefined, "empty history should imply undefined candidate pair and target sequence");
            return takeRandom(availableSEvents, "no history").evt;
        }
        if (currentCandidatePair === undefined) {
            currentCandidatePair = findNewCandidatePair();
            if (currentCandidatePair === undefined) {
                if (history.length >= minEvtsToSearchCandidates) {
                    if (debug)
                        console.log("EEEE No candidates left. Will stop exploration.");
                    return undefined;
                } else {
                    return takeRandom(availableSEvents, "not enough history to search candidates").evt;
                }
            } else {
                if (debug) {
                    console.log("Picking candidate pair: " + currentCandidatePair + ". Current state: " + currentState);
                    console.log("Next target: " + currentCandidatePair.nextTargetSDEvt().asString);
                }
                setSlowMode();
                return selectNextEvent(currentState, availableSEvents); // recurse into other branch
            }
        } else {
            // try to further explore the current candidate pair
            if (currentCandidatePair.stepsLeft > 0) {
                console.log(currentCandidatePair.stepsLeft + " steps left");
                currentCandidatePair.stepsLeft--;
                // occasionally go back to a random referer (to avoid getting stuck in part of app that has no escape according to model)
                if (commonUtil.rand() < takeRandomRefererProbability) {
                    return takeRandomBackToReferer(availableSEvents).evt;
                }
                // usually, use model to find an event that is likely bring us closer towards target event
                var fsmAndState = getFsmAndState();
                var target = currentCandidatePair.nextTargetSDEvt().asString;
                var nextSDEvtString = targetedExploration.computeNextEvent(fsmAndState[0], fsmAndState[1], target, impossibleSEvtStrings, maxTargetSeqLength, availableSEvents);
                if (debug)
                    console.log("computeNextEvent returns: " + nextSDEvtString + " -- " + typeof nextSDEvtString);
                if (nextSDEvtString === undefined) {
                    if (debug)
                        console.log("Could not find any event that leads toward target -- going back to ranfom referer");
                    return takeRandomBackToReferer(availableSEvents).evt;
                } else {
                    // find selected event among available events
                    console.log("nextSDEvtString=" + nextSDEvtString + " -- " + typeof nextSDEvtString); // TODO RAD
                    var selectedNextSEvtStr = commonUtil.sdEvtStrToSEvtStr(nextSDEvtString);
                    var nextSEvtFromAvailable;
                    availableSEvents.some(function(sevt) {
                        if (selectedNextSEvtStr === sevt.asString) {
                            nextSEvtFromAvailable = sevt;
                            return true;
                        }
                    });
                    if (nextSEvtFromAvailable !== undefined) {
                        if (debug)
                            console.log("DDD Selecting " + nextSEvtFromAvailable.asString + " to move toward target");
                        expectedDest = commonUtil.sdEvtStrToDest(nextSDEvtString);
                        return nextSEvtFromAvailable.evt;
                    } else {
                        if (debug)
                            console.log("Selected event is not among available events");
                        impossibleSEvtStrings[selectedNextSEvtStr] = true;
                        return selectNextEvent(currentState, availableSEvents); // recurse to try another event toward target        
                    }
                }
            } else {
                if (debug)
                    console.log("Too many steps needed to reach target -- giving up:\n" + currentCandidatePair.toString());
                markCurrentCandidatePairExplored();
                currentCandidatePair = undefined;
                return selectNextEvent(currentState, availableSEvents); // recurse to try another event toward target
            }
        }
    }

    // API method
    function evtImpossible(src, evt) {
        var sevt = new commonUtil.SEvent(src, evt);
        impossibleSEvtStrings[sevt.asString] = true;
        console.log("Event marked as impossible: " + sevt.asString);
    }

    // API method
    function init(driverSetReferersCallback) {
//    loadState();

        loadHistory(driverSetReferersCallback);

        setFastMode();
    }

    // API method
    function isEventPreselectionAllowed() {
        return allowEventPreselection;
    }

    exports.addTransition = addTransition;
    exports.selectNextEvent = selectNextEventWrapper;
    exports.printStats = printStats;
    exports.reset = reset;
    exports.init = init;
    exports.evtImpossible = evtImpossible;
    exports.isEventPreselectionAllowed = isEventPreselectionAllowed;

})();
