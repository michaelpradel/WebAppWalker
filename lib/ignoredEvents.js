(function() {
  
  function ignore(elem, type, src) {
    // ignore debugging features of joomla
    if (elem.toString().indexOf("#dbg-query") !== -1) return true;
    if (elem.toString().indexOf("#dbg-profile") !== -1) return true;
    if (elem.toString().indexOf("#dbg_query") !== -1) return true;
    
    // ignore file upload features of joomla (raises SecurityException)
    if (elem.id === "upload-file") return true;
    
    return false;
  }
  
  exports.ignore = ignore;
  
})();

