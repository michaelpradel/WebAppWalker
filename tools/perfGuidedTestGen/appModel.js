(function() {

  var commonUtil = require('../commonUtil.js');

  var maxAllowedCost = 50;

  var markerPrefix = "#WAW_NAME_";
  var markerSuffix = "_WAW_NAME#";

  function Model(fsm, perfEffects, id) {
    this.id = id;
    this.fsm = fsm;
    this.perfEffects = perfEffects;
    this.currentStateId = fsm.idOfInitialState;
    this.transId2Evt = {};
    this.evt2TransId = {}; // stringified Event --> transition id
    this.evt2Cost = {}; // stringified Event --> cost of transition
    // create a unique event for each transition and initialize transition cost to 0
    fsm.states().forEach(function(src) {
      src.transitions().forEach(function(transition) {
        var evt = new commonUtil.Event(undefined, undefined, undefined, markerPrefix + transition.id + markerSuffix);
        this.transId2Evt[transition.id] = evt;
        this.evt2TransId[evt.asString] = transition.id;
        this.evt2Cost[evt.asString] = 0;
      }, this);
    }, this);
  }

  Model.prototype = {
    currentState: function() {
      return this.currentStateId;
    },
    availableTransitions: function() {
      var result = [];
      var currentState = this.fsm.id2State[this.currentStateId];
      currentState.transitions().forEach(function(transition) {
        var evt = this.transId2Evt[transition.id];
        result.push(evt);
      }, this);
      return result;
    },
    transition: function(evt) {
      // advance current state
      var src = this.fsm.id2State[this.currentStateId];
      var transId = this.evt2TransId[evt.asString];
      var transition = src.id2Transition[transId];
      this.currentStateId = transition.destId;

      // check if this transition leads to timeout
      if (this.evt2Cost[evt.asString] > maxAllowedCost) {
        return true;
      }

      // apply performance effects
      this.perfEffects.forEach(function(perfEffect) {
        if (perfEffect.transLabel === transition.label) {
          var influencedTransitions = this.fsm.transitionsWithLabel(perfEffect.influencedTransLabel);
          influencedTransitions.forEach(function(influencedTransition) {
            var influencedEvt = this.transId2Evt[influencedTransition.id];
            var influencedEvtStr = influencedEvt.asString;
            var oldCost = this.evt2Cost[influencedEvtStr];
            this.evt2Cost[influencedEvtStr] = oldCost + perfEffect.costDiff;
          }, this);
        }
      }, this);
    },
    destination: function(evt) {
      var currentState = this.fsm.id2State[this.currentStateId];
      var transId = this.evt2TransId[evt.asString];
      var destState = currentState.id2Transition[transId];
      return destState.id;
    },
    toString: function() {
      var result = "";
      this.fsm.states().forEach(function(src) {
        src.transitions().forEach(function(trans) {
          result += src.id + " " + trans.label + " " + trans.destId + "\n";
        });
      });
      result += "---\n";
      this.perfEffects.forEach(function(perfEffect) {
        result += perfEffect.transLabel + " " + perfEffect.influencedTransLabel + " " + perfEffect.costDiff + "\n";
      });
      return result;
    }
  };

  function PerfEffect(transLabel, influencedTransLabel, costDiff) {
    this.transLabel = transLabel;
    this.influencedTransLabel = influencedTransLabel;
    this.costDiff = costDiff;
  }

  PerfEffect.prototype = {
    toString: function() {
      return this.transLabel + " influences " + this.influencedTransLabel + ": " + this.costDiff;
    }
  };

  exports.Model = Model;
  exports.PerfEffect = PerfEffect;


})();

