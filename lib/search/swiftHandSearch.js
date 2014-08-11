(function() {
  var Search = function(wawApi) {
    this.wawApi = wawApi;
    this.st_count = 0;

    this.trace_fsm = new Search.FSM();
    this.sink_node = this.trace_fsm.addState(-1, []);
    this.trace_fsm_cur_state = null;
    this.capture = new TraceCapture(wawApi, this);
  };
  Search.FSM = require("./fsm.js").FSM;

  Search.prototype = {
    doNextEvent: function() {
      this.capture.enterState();
    },
    handleNextEvents: function() {
      this.trace_fsm.displayTraces();
      var fsm2 = this.trace_fsm.deepCopy().learnFSM();
      fsm2.tagStates();
      fsm2.displayTaggedFSM();
      this.fullCurState = fsm2.translate(this.curState);
      this.fullFsm = fsm2;

      this.getFrontierMove();
    },
    /*takeAnEvent: function(events) {  // TODO MP Is this ever called? Remove if not.
     var id = randomInt(events.length);
     this.takeEvent(events[id], id);
     },*/
    takeEvent: function(event, id) {
      this.capture.triggerEvent(event, id);
    },
    gotoStart: function() {
      console.log("\n______RESTART_____\n");
      this.capture.gotoStart();
    },
    addTransitionObj: function(cur, prev, lastTrans) {
      prev.addTransition(cur, lastTrans);
    },
    getState: function(state, events) {
      this.curState = this.trace_fsm.addState(state.id, events);
      return this.curState;
    },
    getFrontierMove: function() {
      var dir = Search.FSM.BFS(this.fullFsm, this.fullCurState);
      if (dir === undefined) {
        if (!this.capture.atStart) {
          this.gotoStart();
        } else {
          console.log("Warning: getFrontierMove does nothing");
        }
      } else {
        this.takeEvent(this.fullCurState.events[dir], dir);
      }
    },
    disableEvent: function(event, id) {
//      console.log(this.curState.taggedRepr());
//      console.log("disabling event: " + event + " " + id);
      this.curState.addTransition(this.sink_node, id);
      this.trace_fsm.tagStates();
      this.trace_fsm.displayTaggedFSM();
//      console.log(this.curState.taggedRepr());
    },
    selectEvent: function() {
      this.handleNextEvents();
    }
  };

  var TraceCapture = function(wawApi, event_obj) {
    this.wawApi = wawApi;
    this.prevState = null;
    this.startUrl = null;
    this.event_obj = event_obj;
    this.atStart = true;
  };
  TraceCapture.prototype = {
    enterState: function() {
      this.curState = this.wawApi.getCurrentState();
      if (this.startUrl === null) {
        this.startUrl = this.curState.url;
      }
      var trace_capture = this;
      this.wawApi.getPotentiallyEnabledEvents(function(events) {
        trace_capture.updateEvents(events);
      });

    },
    updateEvents: function(events) {
//			console.log(events);
//      console.log(this);
      this.curEvents = events;
      this.curState = this.event_obj.getState(this.curState, this.curEvents);
      if (this.prevState !== null) {
        this.event_obj.addTransitionObj(this.curState, this.prevState,
            this.event_id);
      }
      this.event_obj.handleNextEvents();
    },
    triggerEvent: function(event, id) {
      var event_obj = this.event_obj;
      var capture_obj = this;
      function triggerIfPossible(possible) {
        if (!possible) {
          event_obj.disableEvent(event, id);
          event_obj.selectEvent();
        } else {
          capture_obj.realTriggerEvent(event, id);
        }
      }
      this.wawApi.canTrigger(event, triggerIfPossible);
    },
    realTriggerEvent: function(event, id) {
      this.event_id = id;
      this.wawApi.triggerEvent(event);
      this.prevState = this.curState;
      this.atStart = false;
    },
    gotoStart: function() {
      this.atStart = true;
      this.goToUrl(this.startUrl);
    },
    goToUrl: function(url) {
      this.wawApi.goToURL(url);
      this.prevState = null;
    }
  };

  function getName() {
    return "SwiftHand";
  }

  function shuffle(array) {
    return array.sort(function(x, y) {
      if (Math.random() > 0.5)
        return -1;
      else
        return 1;
    });
  }

  var my_search = null;

  exports.init = function(wawapi) {
    my_search = new Search(wawapi);
  };

  exports.doNextEvent = function() {
    my_search.doNextEvent();
  };

  exports.getName = getName;
})();
