// GreaseMonkey and compatible (GB) JS file for development of a UserScript (US)
//
// This file contains only metadata block, in this block local files are linked: `// @require  file://...PATH/FILE.user.js`.
// Linked local files can be edited in external editor. No need to use build-in editor of the GM or copy/paste code into it each time.
//
// Copy here all @require directives which are in production version of the US (myscript.user.js).
// Change path of those which are to be edited to local filepaths.
// Add the production version of the US itself as the last @require. Metadate block within that file will be ignored by GM.
//
// This debug US only works in Chrome, as Firefox does not allow "file:" access from an Extension (as the GM).
// GreaseMonkey (the original GM) extension does not allow "file:" protocol files. There are guides how it is possible, but not since 2017 when extension changed to WebExtension.
// There is no need to change @version, nor to update version for "file://...FILE.js?v=1.1". It seems, TamperMonkey does not cache them.
//
//
//// Install in the browser
// Allow local access for GM extension in the browser.
// Drag&drop this debug US to browser, GM will offer an install dialog. Or drag&drop dir where this US is located, then click on this file.
// If drag&drop does not work, write the URL: "file:///PATH/", click on this file.
//
// This is v2.0 of this debug US.


// ==UserScript==
// @name           DEBUG - Normal video player
// @author         papo

// ###run-at         document-start
//// document-start ['loading'] -> document-body [<body> exist] -> document-end ['DOMContentLoaded'/'interactive'] -> document-idle (TM default)

// ###noframes


//// REQUIRE directives. Make it identical to production version of the US. Replace with file:// those which will be edited in IDE.

//// FRAMEWORKS
// ###require        https://code.jquery.com/jquery-2.2.0.min.js
// ###require        http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ###require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js

// @require        file:///H:\Projects\JS\UserScripts-papo\lib\GM_menu_command.js
// @require        file://H:\Projects\JS\UserScripts-papo\src\normal_video_player.js

//// Production version of this US
//// Must be the last @require. Metadata block in it is ignored. No need to add if it's without JS code.
//
// @require        file://C:\XXX_PATH\GM\Normal video player.user.js


//// RESOURCE
// ###resource       extension_pages/options.html file://C:\path\to\file


//// Allowing everything in this debug US:
// @match          *://*/*

// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.xmlHttpRequest
// @grant          GM.getResourceUrl
// @grant          GM.deleteValue
// @grant          GM.listValues
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @grant          GM_setClipboard
// @grant          GM_addStyle
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// @grant          GM.openInTab
// @grant          unsafeWindow
// @grant          window.close
// @grant          window.focus
// @grant          window.onurlchange

// @connect        *
// ==/UserScript==
