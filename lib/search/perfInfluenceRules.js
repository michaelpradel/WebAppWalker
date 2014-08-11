(function() {

  var commonUtil = require('../commonUtil.js');

  // parameters
  var maxHistoryLength = 5000;
  var maxEditDistance = 4; // for removing duplicate rules (higher ==> remove more rules)

  function InfluenceRule(influencingSDEvt, influencedSDEvt, support, confidence, costDiffs) {
    this.influencingSDEvt = influencingSDEvt;
    this.influencedSDEvt = influencedSDEvt;
    this.support = support;
    this.confidence = confidence;
    this.costDiffs = costDiffs;
  }

  InfluenceRule.prototype = {
    toString: function() {
      return this.support + "###" + this.confidence + "###" + this.influencingSDEvt.asString + " influences " + this.influencedSDEvt.asString + "###" + this.costDiffs;
    }
  };

  function Influences() {
    this.costIncreases = []; // sevts that happen in between
    this.costDecreases = []; // sevts that happen in between
    this.costStays = [];     // sevts that happen in between
  }

  Influences.prototype = {
    toString: function() {
      return "  + : " + this.costIncreases + "\n  0 : " + this.costStays + "\n  - : " + this.costDecreases;
    }
  };

  function printStats(sdevt2Costs) {
    var totalCostValues = 0;
    var nbCosts2SDEvts = {}; // Number --> array of SEvts
    for (var sdevt in sdevt2Costs) {
      var costs = sdevt2Costs[sdevt];
      var setOfSDEvts = nbCosts2SDEvts[costs.length] || [];
      setOfSDEvts.push(sdevt);
      nbCosts2SDEvts[costs.length] = setOfSDEvts;
      totalCostValues += costs.length;
    }

    for (var nbCosts in nbCosts2SDEvts) {
      var sdevts = nbCosts2SDEvts[nbCosts];
      console.log(sdevts.length + " events with " + nbCosts + " costs");
    }
    console.log("Total nb of unique events     : " + Object.keys(sdevt2Costs).length);
    console.log("Total nb of events in history : " + totalCostValues);
  }

  function RuleCandidate() {
    this.allPairs = 0;
    this.supportingPairs = 0;
    this.costDiffs = [];
  }

  function computeRules(histories /*array of array of Transitions*/, minSupport, minConfidence) {
    var nbTransitions = 0;
    var sdevtStr2SDEvt = {};
    var sdevtStr2Costs = {};
    console.log("Histories: " + histories.length);
    histories.forEach(function(history) {
      if (nbTransitions < maxHistoryLength) {
        console.log("History of length " + history.length+ ", considering max. "+(maxHistoryLength-nbTransitions));
        history.forEach(function(transition) {
          if (nbTransitions < maxHistoryLength) {
            var costs = sdevtStr2Costs[transition.sdevt.asString] || [];
            costs.push(transition.cost);
            sdevtStr2Costs[transition.sdevt.asString] = costs;
            sdevtStr2SDEvt[transition.sdevt.asString] = transition.sdevt;
            nbTransitions++;
          }
        });
      }
    });

    console.log("Unique events: " + Object.keys(sdevtStr2Costs).length);
    printStats(sdevtStr2Costs);
    
    // create empty rule candidates
    var influenced2Influencing2RuleCandidate = {}; // string --> (string --> RuleCandidate)
    for (var influencedSDEvtStr in sdevtStr2Costs) {
      console.log(influencedSDEvtStr+"\n--> "+sdevtStr2Costs[influencedSDEvtStr]);
      var influencing2RuleCandidate = influenced2Influencing2RuleCandidate[influencedSDEvtStr] || {};
      for (var influencingSDEvtStr in sdevtStr2Costs) {
        influencing2RuleCandidate[influencingSDEvtStr] = new RuleCandidate();
      }
      influenced2Influencing2RuleCandidate[influencedSDEvtStr] = influencing2RuleCandidate;
    }

    // go through histories once per influencedSEvt and update rule candidates
    for (var influencedSDEvtStr in sdevtStr2Costs) {
      var costs = sdevtStr2Costs[influencedSDEvtStr];
      if (costs.length >= minSupport + 1) {
        var lastTransOfInfluenced, costOfFirst;
        var seenBetween = {}; // set of SEvt strings
        histories.forEach(function(history) {
          lastTransOfInfluenced = undefined;
          costOfFirst = undefined;
          history.forEach(function(transition) {
            if (transition.sdevt.asString === influencedSDEvtStr) {  // influenced
              if (lastTransOfInfluenced !== undefined) {
                // close this pair of influencedSEvt
                commonUtil.assert(costOfFirst !== undefined);
                var costIncreased = (costOfFirst < transition.cost);
                var influencing2RuleCandidate = influenced2Influencing2RuleCandidate[influencedSDEvtStr];
                commonUtil.assert(influencing2RuleCandidate !== undefined);
                for (var influencingSDEvtStr in influencing2RuleCandidate) {
                  var ruleCandidate = influencing2RuleCandidate[influencingSDEvtStr];
                  var hasInfluencingBetween = (influencingSDEvtStr in seenBetween);
                  if (costIncreased || hasInfluencingBetween)
                    ruleCandidate.allPairs++;
                  if (costIncreased && hasInfluencingBetween) {
                    ruleCandidate.supportingPairs++;
                    ruleCandidate.costDiffs.push(transition.cost - costOfFirst);
                  }
                }
              }
              // open the next pair of influencedSDEvt
              lastTransOfInfluenced = transition;
              costOfFirst = transition.cost;
              seenBetween = {};
            } else if (lastTransOfInfluenced !== undefined) {
              var influencingSDEvtStr = transition.sdevt.asString;
              seenBetween[influencingSDEvtStr] = true;
            } // else do nothing (have not yet seen first occurrence of influenced)
          });
        });
      }
    }

    // create rules from rule candidates
    var allRules = [];
    for (var influencedSDEvtStr in influenced2Influencing2RuleCandidate) {
      var influencing2RuleCandidate = influenced2Influencing2RuleCandidate[influencedSDEvtStr];
      for (var influencingSDEvtStr in influencing2RuleCandidate) {
        var ruleCandidate = influencing2RuleCandidate[influencingSDEvtStr];
        var confidence = ruleCandidate.allPairs > 0 ? ruleCandidate.supportingPairs / ruleCandidate.allPairs : 0;
        var support = ruleCandidate.supportingPairs;
        if (confidence >= minConfidence && support >= minSupport) {
          var influencedSDEvt = sdevtStr2SDEvt[influencedSDEvtStr];
          var influencingSDEvt = sdevtStr2SDEvt[influencingSDEvtStr];
          var rule = new InfluenceRule(influencingSDEvt, influencedSDEvt, support, confidence, ruleCandidate.costDiffs);
          allRules.push(rule);
        }
      }
    }
    console.log("Rules before duplicate removal: "+allRules.length);
    var rules = removeDuplicates(allRules);
    console.log("Have inferred "+rules.length+" rules.");

    var sortedRules = rules.sort(function(r1, r2) {
      var avgCostDiff1 = commonUtil.average(r1.costDiffs);
      var avgCostDiff2 = commonUtil.average(r2.costDiffs);
      return avgCostDiff2 - avgCostDiff1;
    });

    return sortedRules;
  }

  function removeDuplicates(unsortedRules) {
    // sort first to keep rules with higher support (and higher confidence) when two are similar
    var rules = unsortedRules.sort(function(r1, r2) {
      if (r1.confidence === r2.confidence) {
        return r2.support - r1.support;
      }
      return r2.confidence - r1.confidence;
    });

    var idxsToRemove = {}; // set of numbers
    for (var idx1 = 0; idx1 < rules.length - 1; idx1++) {
      if (!(idx1 in idxsToRemove)) {
        for (var idx2 = idx1 + 1; idx2 < rules.length; idx2++) {
          if (!(idx2 in idxsToRemove)) {
            var rule1 = rules[idx1];
            var rule2 = rules[idx2];
            if (areSimilar(rule1, rule2)) {
              idxsToRemove[idx2] = true;
            }
          }
        }
      }
    }

    var result = [];
    for (var idx = 0; idx < rules.length; idx++) {
      if (!(idx in idxsToRemove))
        result.push(rules[idx]);
    }
    return result;
  }

  function areSimilar(rule1, rule2) {
    var influencing1 = rule1.influencingSDEvt.asString;
    var influencing2 = rule2.influencingSDEvt.asString;
    var influenced1 = rule1.influencedSDEvt.asString;
    var influenced2 = rule2.influencedSDEvt.asString;

    // optimization
    if (Math.abs(influencing1.length - influencing2.length) > maxEditDistance)
      return false;
    if (Math.abs(influenced1.length - influenced2.length) > maxEditDistance)
      return false;

    if (editDistance(influencing1, influencing2) <= maxEditDistance &&
        editDistance(influenced1, influenced2) <= maxEditDistance)
      return true;
    return false;
  }

  // taken from http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
  function editDistance(a, b) {
    if (a.length === 0)
      return b.length;
    if (b.length === 0)
      return a.length;

    var matrix = [];
    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
              Math.min(matrix[i][j - 1] + 1, // insertion
                  matrix[i - 1][j] + 1)); // deletion
        }
      }
    }

    return matrix[b.length][a.length];
  }

  exports.computeRules = computeRules;

})();

