/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2011 Finnbarr P. Murphy
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * ***** END LICENSE BLOCK ***** */

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *   Greg Parris <greg.parris@gmail.com>
 *   Nils Maier <maierman@web.de>
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const APPMENU_ID    = "html5toggle-appmenuid",
      MENU_ID       = "html5toggle-menuitemid",
      BUTTON_ID     = "html5toggle-buttonid",
      KEY_ID        = "html5toggle-keyid",
      KEYSET_ID     = "html5toggle-keysetid"
      PREF_TOOLBAR  = "toolbar",
      PREF_NEXTITEM = "nextitem";

const PREF_BRANCH_HTML5TOGGLE = Services.prefs.getBranch("extensions.html5toggle.");
const PREF_BRANCH_HTML5       = Services.prefs.getBranch("html5.");

const PREFS = {
   key:       "H",
   modifiers: "control,alt",
   enable:    false,
   nextitem:  "bookmarks-menu-button-container",
   toolbar:   "nav-bar"
};

let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !PREFS[aData]) return;
    runOnWindows(function(win) {
      win.document.getElementById(KEY_ID).setAttribute(aData, getPref(aData));
      addMenuItem(win);
    });
  }
}

let logo16on = "", logo16off = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

function setInitialPrefs() {
   let branch = PREF_BRANCH_HTML5TOGGLE;
   for (let [key, val] in Iterator(PREFS)) {
      switch (typeof val) {
         case "boolean":
            branch.setBoolPref(key, val);
            break;
         case "number":
            branch.setIntPref(key, val);
            break;
         case "string":
            branch.setCharPref(key, val);
            break;
      }
   }

   // save the current value of the html5.enable preference
   let value = PREF_BRANCH_HTML5.getBoolPref("enable");
   PREF_BRANCH_HTML5TOGGLE.setBoolPref('enable', value);
}


function getPref(name) {
   try {
      return PREF_BRANCH_HTML5TOGGLE.getComplexValue(name, Ci.nsISupportsString).data;
   } catch(e){}
   return PREFS[name];
}


function $(node, childId) {
   if (node.getElementById) {
      return node.getElementById(childId);
   } else {
      return node.querySelector("#" + childId);
   }
}


function toggle() {
   let value = PREF_BRANCH_HTML5.getBoolPref("enable");
   PREF_BRANCH_HTML5.setBoolPref("enable", !value); 

   let doc = Services.wm.getMostRecentWindow('navigator:browser').document;

   let menuitem = $(doc, MENU_ID);
   if (menuitem) {
      if (value) {
         menuitem.setAttribute("checked", "true"); 
      } else {
         menuitem.setAttribute("checked", "false"); 
      }
   }

   let toggleButton = $(doc, BUTTON_ID);
   if (toggleButton) { 
      if (value) {
         toggleButton.tooltipText = getLocalizedStr("offString");
         toggleButton.style.listStyleImage = "url('" + logo16off + "')";
      } else {
         toggleButton.tooltipText = getLocalizedStr("onString");
         toggleButton.style.listStyleImage = "url('" + logo16on + "')";
      }
   }

   let appMenu = $(doc, APPMENU_ID);
   if (appMenu) {
      if (value) {
         appMenu.style.listStyleImage = "url('" + logo16off + "')";
      } else {
         appMenu.style.listStyleImage = "url('" + logo16on + "')";
      }
   }

   return true;
}


function addMenuItem(win) {
   let doc = win.document;

   function removeMI() {
      let menuitem = $(doc, MENU_ID);
      menuitem && menuitem.parentNode.removeChild(menuitem);
   }

   removeMI();

   // add the new menuitem to the Tools menu
   let (toggleMI = win.document.createElementNS(NS_XUL, "menuitem")) {
      toggleMI.setAttribute("id", MENU_ID);
      toggleMI.setAttribute("label", getLocalizedStr("label"));
      toggleMI.setAttribute("accesskey", "H");
      toggleMI.setAttribute("key", KEY_ID);
      toggleMI.setAttribute("checked", PREF_BRANCH_HTML5.getBoolPref("enable")); 
      toggleMI.setAttribute("class", "menuitem-iconic");
      toggleMI.addEventListener("command", toggle, true);
      $(doc, "menu_ToolsPopup").insertBefore(toggleMI, $(doc, "javascriptConsole"));
   }

   unload(removeMI, win);
}


function main(win) {
   let doc = win.document;
   let value = PREF_BRANCH_HTML5.getBoolPref("enable");

   let toggleKeyset = doc.createElementNS(NS_XUL, "keyset");
   toggleKeyset.setAttribute("id", KEYSET_ID);

   // add hotkey
   let (toggleKey = doc.createElementNS(NS_XUL, "key")) {
      toggleKey.setAttribute("id", KEY_ID);
      toggleKey.setAttribute("key", getPref("key"));
      toggleKey.setAttribute("modifiers", getPref("modifiers"));
      toggleKey.setAttribute("oncommand", "void(0);");
      toggleKey.addEventListener("command", toggle, true);
      $(doc, "mainKeyset").parentNode.appendChild(toggleKeyset).appendChild(toggleKey);
   }

   // add menuitem to Tools menu
   addMenuItem(win);

   // add menuitem to Firefox button options
   if ((appMenu = $(doc, "appmenu_customizeMenu"))) {
      let toggleAMI = $(doc, MENU_ID).cloneNode(false);
      toggleAMI.setAttribute("id", APPMENU_ID);
      toggleAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
      if (value) {
         toggleAMI.style.listStyleImage = "url('" + logo16on + "')";
      } else {
         toggleAMI.style.listStyleImage = "url('" + logo16off + "')";
      }
      toggleAMI.addEventListener("command", toggle, true);
      appMenu.appendChild(toggleAMI);
   }

   // add iconized button
   let (toggleButton = doc.createElementNS(NS_XUL, "toolbarbutton")) {
      toggleButton.setAttribute("id", BUTTON_ID);
      toggleButton.setAttribute("label", getLocalizedStr("label"));
      toggleButton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
      if (value) {
         toggleButton.setAttribute("tooltiptext", getLocalizedStr("onString"));
         toggleButton.style.listStyleImage = "url('" + logo16on + "')";
      } else {
         toggleButton.setAttribute("tooltiptext", getLocalizedStr("offString"));
         toggleButton.style.listStyleImage = "url('" + logo16off + "')";
      }
      toggleButton.addEventListener("command", toggle, true);
      $(doc, "navigator-toolbox").palette.appendChild(toggleButton);
 
      // move to location specified in prefs
      let toolbarId = PREF_BRANCH_HTML5TOGGLE.getCharPref(PREF_TOOLBAR);
      let toolbar = toolbarId && $(doc, toolbarId);
      if (toolbar) {
         let nextItem = $(doc, PREF_BRANCH_HTML5TOGGLE.getCharPref(PREF_NEXTITEM));
         toolbar.insertItem(BUTTON_ID, nextItem &&
            nextItem.parentNode.id == toolbarId && nextItem);
      }

      win.addEventListener("aftercustomization", toggleCustomize, false);
   }

   unload(function() {
      appMenu && appMenu.removeChild(APPMENU_ID);
      toggleKeyset.parentNode.removeChild(toggleKeyset);

      let button = $(doc, BUTTON_ID) || $($(doc,"navigator-toolbox").palette, BUTTON_ID);
      button && button.parentNode.removeChild(button);
 
      win.removeEventListener("aftercustomization", toggleCustomize, false);
   }, win);
}


function toggleCustomize(event) {
   let toolbox = event.target, toolbarId, nextItemId;
   let button = $(toolbox.parentNode, BUTTON_ID);
   if (button) {
      let parent = button.parentNode,
          nextItem = button.nextSibling;
      if (parent && parent.localName == "toolbar") {
          toolbarId = parent.id;
          nextItemId = nextItem && nextItem.id;
      }
   }
   PREF_BRANCH_HTML5TOGGLE.setCharPref(PREF_TOOLBAR,  toolbarId || "");
   PREF_BRANCH_HTML5TOGGLE.setCharPref(PREF_NEXTITEM, nextItemId || "");
}


function install(){
   setInitialPrefs();
}


function uninstall(){
   let value = PREF_BRANCH_HTML5TOGGLE.getBoolPref("enable");
   PREF_BRANCH_HTML5TOGGLE.deleteBranch("");             
   PREF_BRANCH_HTML5.setBoolPref('enable', value);
}


function startup(data) AddonManager.getAddonByID(data.id, function(addon) {
   include(addon.getResourceURI("includes/utils.js").spec);
   include(addon.getResourceURI("includes/locale.js").spec);

   initLocalization(addon, "html5toggle.properties");
   logo16on = addon.getResourceURI("images/HTML5on16N.png").spec;
   logo16off = addon.getResourceURI("images/HTML5off16N.png").spec;

   watchWindows(main);

   let prefs = PREF_BRANCH_HTML5TOGGLE;
   prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
   prefs.addObserver("", PREF_OBSERVER, false);

   unload(function() prefs.removeObserver("", PREF_OBSERVER));
});


function shutdown(data, reason) { if (reason !== APP_SHUTDOWN) unload(); }

