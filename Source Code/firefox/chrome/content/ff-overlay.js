var busy_for_imtime = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("busy_for_imtime-strings");
  },

  onMenuItemCommand: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    promptService.alert(window, this.strings.getString("helloMessageTitle"),
                                this.strings.getString("helloMessage"));
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
    busy_for_imtime.onMenuItemCommand(e);
  }
};

window.addEventListener("load", function () { busy_for_imtime.onLoad(); }, false);


busy_for_imtime.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e) {
    busy_for_imtime.showFirefoxContextMenu(e);
  }, false);
};

busy_for_imtime.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-busy_for_imtime").hidden = gContextMenu.onImage;
};

window.addEventListener("load", function () { busy_for_imtime.onFirefoxLoad(); }, false);