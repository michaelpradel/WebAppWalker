(function() {

  var commonUtil;
  if (typeof exports !== "undefined") {
    // add-on context
    commonUtil = require('../commonUtil.js');
  } else {
    // page context
    commonUtil = unwrapObject(window).$WAWCommonUtil;
  }

  // global state
  var formHints = [];

  function FormHint(formIdentifier /*form --> boolean*/, handlerCreator /*form --> handler fct*/) {
    this.formIdentifier = formIdentifier;
    this.handlerCreator = handlerCreator;
  }

  function initFormHints() {
    var formHint;

    // Drupal: add article
    formHint = new FormHint(function(form) {
      return form.id === "article-node-form";
    }, function(form) {
      var inputFields = $(form).find("input");
      var subHandlers = [];
      inputFields.each(function() {
        var input = $(this)[0];
        if (input.type === "text" && input.id === "edit-title-0-value") {
          subHandlers.push(function() {
            input.value = commonUtil.randString();
          });
        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      return handler;
    });
    formHints.push(formHint);
    
    // Drupal: add content type
    formHint = new FormHint(function(form) {
      return form.id === "node-type-add-form";
    }, function(form) {
      var inputFields = $(form).find("input");
      var subHandlers = [];
      inputFields.each(function() {
        var input = $(this)[0];
        if (input.type === "text" && input.id === "edit-name") {
          subHandlers.push(function() {
            input.value = commonUtil.randString();
          });
        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      return handler;
    });
    formHints.push(formHint);
    
    // Drupal: add custom block
    formHint = new FormHint(function(form) {
      return form.id === "basic-custom-block-form";
    }, function(form) {
      var inputFields = $(form).find("input");
      var subHandlers = [];
      inputFields.each(function() {
        var input = $(this)[0];
        if (input.type === "text" && input.id === "edit-info") {
          subHandlers.push(function() {
            input.value = commonUtil.randString();
          });
        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      return handler;
    });
    formHints.push(formHint);
    
    // Drupal: add menu
    formHint = new FormHint(function(form) {
      return form.id === "menu-add-form";
    }, function(form) {
      var inputFields = $(form).find("input");
      var subHandlers = [];
      inputFields.each(function() {
        var input = $(this)[0];
        if (input.type === "text" && input.id === "edit-label") {
          subHandlers.push(function() {
            input.value = commonUtil.randString();
          });
        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      return handler;
    });
    formHints.push(formHint);
    
    // Drupal: add vocabulary
    formHint = new FormHint(function(form) {
      return form.id === "taxonomy-vocabulary-form";
    }, function(form) {
      var inputFields = $(form).find("input");
      var subHandlers = [];
      inputFields.each(function() {
        var input = $(this)[0];
        if (input.type === "text" && input.id === "edit-name") {
          subHandlers.push(function() {
            input.value = commonUtil.randString();
          });
        }
      });
      var handler = function() {
        for (var i = 0; i < subHandlers.length; i++) {
          subHandlers[i]();
        }
      };
      return handler;
    });
    formHints.push(formHint);
  }

  function fillFormHandler(form) {
    var text = form.textContent.replace(/\s/g, "").slice(0,30);
    console.log("Searching fillFormHandler for form " + text);
    var matchingFormHint;
    formHints.some(function(formHint) {
      if (formHint.formIdentifier(form)) {
        matchingFormHint = formHint;
        return true;
      }
    });

    if (matchingFormHint) {
      console.log(" .. found matching form hint");
      return matchingFormHint.handlerCreator(form);
    }
    console.log(" .. did not find matching form hint");
  }

  initFormHints();


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

  var module;
  if (typeof exports !== "undefined") {
    // export to code running in add-on context
    module = exports;
  } else {
    // export to code running in page context
    unwrapObject(window).$formHints = {};
    module = unwrapObject(window).$formHints;
  }
  module.fillFormHandler = fillFormHandler;

})();