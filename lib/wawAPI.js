(function() {

  var WawAPI = function() {
  };

  WawAPI.prototype = {
    getCurrentState: function() {
      // returns AppState
    },
    getPotentiallyEnabledEvents: function(callback /*callback expects a list of events*/) {
      // returns array of Event
    },
    canTrigger: function(evt, callback /*expects a boolean*/) {
      // returns nothing
    },
    triggerEvent: function(evt) {
      // returns nothing
    },
    goToURL: function(url /*string*/) {
      // returns nothing
    }
  };

  var AppState = function(id, url/*string*/) {
    this.id = id;
    this.url = url;
  };

  AppState.prototype.toString = function() {
    return this.id + " at " + this.url;
  };

  exports.AppState = AppState;

})();
