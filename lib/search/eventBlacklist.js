(function() {

  function sevtOnBlacklist(sevt) {
    var e = sevt.evt.asString;
    var s = sevt.state.toString();

    // Drupal: upload button causes security exception
    if (s.indexOf("drupal") !== -1 && s.indexOf("article") !== -1 && e.indexOf("edit-field-image-0-upload") !== -1)
      return true;
    
    // Drupal: upload button causes security exception
    if (s.indexOf("drupal") !== -1 && e.indexOf("article-node-form") !== -1)
      return true;

    return false;
  }

  exports.sevtOnBlacklist = sevtOnBlacklist;

})();