(function() {

  function isVisible(element) {
    var rects = allRectsOf(element);
    var result = !isStyleInvisible(element) && isInViewPort(element, rects)
        && isNotCovered(element, rects);
    return result;
  }

  function isNotCoveredSlow(element, rects) {
    // checks each pixel = correct but slow
    var elemsDocument = element.ownerDocument || document;
    var thisAndAllChildren = [element];
    addAllChildren(element, thisAndAllChildren);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      for (var x = Math.floor(r.left), x_max = Math.ceil(r.right); x <= x_max; x++) {
        for (var y = Math.floor(r.top), y_max = Math.ceil(r.bottom); y <= y_max; y++) {
          var elemFromPt = unwrapObject(elemsDocument.elementFromPoint(x,
              y));
          if (elemFromPt) {
            for (var childIdx = 0; childIdx < thisAndAllChildren.length; childIdx++) {
              var thisOrChild = thisAndAllChildren[childIdx];
              if (elemFromPt === thisOrChild) {
                return true;
              } else if (elemFromPt.id === element.id
                  && element.id !== "") {
                console
                    .log("WARNING: Elements have same id ("
                        + element.id
                        + ") but are not equal?? Wrapping problem again?");
              }
            }
          }
        }
      }
    }
    return false;
  }

  function isNotCovered(element, rects) { 
    // checks center of each rectangle = unsound but faster
    var elemsDocument = element.ownerDocument || document;
    var thisAndAllChildren = [element];
    addAllChildren(element, thisAndAllChildren);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      var centerX = r.left + (r.right - r.left) / 2;
      var centerY = r.top + (r.bottom - r.top) / 2;
      var elemFromPt = unwrapObject(elemsDocument.elementFromPoint(centerX,
          centerY));
      if (elemFromPt) {
        for (var childIdx = 0; childIdx < thisAndAllChildren.length; childIdx++) {
          var thisOrChild = thisAndAllChildren[childIdx];
          if (elemFromPt === thisOrChild) {
            return true;
          } else if (unwrapObject(thisOrChild).tagName === "AREA"
              && unwrapObject(thisOrChild).parentElement.tagName === "MAP"
              && unwrapObject(elemFromPt).tagName === "IMG"
              && unwrapObject(elemFromPt).useMap === ("#" + unwrapObject(thisOrChild).parentElement.name)) {
            // special case: img covers image map and its areas
            return true;
          } else if (elemFromPt.id === element.id
              && element.id !== "") {
            console
                .log("WARNING: Elements have same id ("
                    + element.id
                    + ") but are not equal?? Wrapping problem again?");
          }
        }
      }
    }
    return false;
  }

  function addAllChildren(element, result) {
    for (var i = 0; i < element.children.length; i++) {
      result.push(element.children[i]);
      addAllChildren(element.children[i], result);
    }
  }

  function isInViewPort(element, rects) {
    var elemsDocument = element.ownerDocument || document;
    var height = elemsDocument.documentElement.clientHeight;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      var inViewport = r.top > 0 ? r.top <= height
          : (r.bottom > 0 && r.bottom <= height);
      if (inViewport)
        return true;
    }
    return false;
  }

  function allRectsOf(element) {
    var allRects = []; // array of ClientRects
    var thisRects = element.getClientRects();
    for (var i = 0; i < thisRects.length; i++) {
      allRects.push(thisRects[i]);
    }
    for (var i = 0; i < element.children.length; i++) {
      var childsRects = allRectsOf(element.children[i]);
      for (var j = 0; j < childsRects.length; j++) {
        allRects.push(childsRects[j]);
      }
    }
    // could optimize by removing rectangles that are completely included in
    // another
    return allRects;
  }

  function isStyleInvisible(element) {
    do { // loop up over parent nodes
      if (element.nodeType === 9)
        break; // stop at document
      var style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden'
          || style.opacity === '0') {
        return true;
      }
    } while (element = element.parentNode);
    return false;
  }

  function unwrapObject(object) {
    if (!object)
      return object;
    if (object.wrappedJSObject) {
      return object.wrappedJSObject;
    }
    return object;
  }

  unwrapObject(window).$WAW_isVisible = isVisible;

})();
