(function() {

  var commonUtil = unwrapObject(window).$WAWCommonUtil;

  self.port.on("show", function(enabledEvts) {
    emptyContainer();

    var container = document.getElementById("evtContainer");
    enabledEvts.forEach(function(evt) {
      var p = document.createElement("pre");
//      p.textContent = commonUtil.evtToShortString(evt);
      p.textContent = JSON.stringify(evt.elemDetails+" -- "+evt.asString);
      p.onclick = evtSelected.bind(null, evt);
      container.appendChild(p);
    });

  });

  function evtSelected(evt) {
    emptyContainer();

    self.port.emit("evtSelected", evt);
  }

  function emptyContainer() {
    var container = document.getElementById("evtContainer");
    var fc = container.firstChild;
    while (fc) {
      container.removeChild(fc);
      fc = container.firstChild;
    }
  }

  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }

})();

