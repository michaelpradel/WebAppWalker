(function() {

  function isPrioritizedSEvt(sevt) {
    var e = sevt.evt.asString;
    var s = sevt.state.toString();
    
    // Drupal: "+Add Content" button
    if (s.indexOf("drupal/admin/content") !== -1 && sevt.evt.xpath === "/html/body/div[2]/main/ul/li/a") 
      return true;
    // Drupal: "+Add custom block", "+Add menu", "+Add category", "+Add content type", etc.
    if (s.indexOf("drupal/admin/structure") !== -1 && sevt.evt.xpath === "/html/body/div[2]/main/ul/li/a") 
      return true;

//    console.log("Not prioritized: "+s+" --- "+e);
    return false;
  }

  function sevtOnWhitelist(sevt) {
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

  var module;
  if (typeof exports !== "undefined") {
    // export to code running in add-on context
    module = exports;
  } else {
    // export to code running in page context
    unwrapObject(window).$WAWEventWhitelist = {};
    module = unwrapObject(window).$WAWEventWhitelist;
  }

  module.sevtOnWhitelist = sevtOnWhitelist;
  module.isPrioritizedSEvt = isPrioritizedSEvt;

})();

