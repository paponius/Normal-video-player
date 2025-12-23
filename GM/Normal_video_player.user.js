// This is a GreaseMonkey User Script file.
// It contains only the Metadata Block.
// All JavaScript code is in separate files, to make development more portable and easier.
//
// Safety
// Greasy Fork (greasyfork.org) requires that the whole code is in this file, so that user can review what they are installing.
// I do that for simple scripts up to 100 lines long. But I argue that it's not practical for longer scripts.
// And on the contrary, when a program is split into multiple files based on semantic, it's much easier to inspect and understood.
// If someone really want to inspect such longer script, they'll probably do so in DevTools.
// And in GM, external scripts are concatenated together with this file anyway.
//
// Performance
// External JS files (which are included using require Key in metadata) are cached. They are downloaded only once per version change.
//
// Advantage of external files in development
// External JS files can be edited in external IDE. (Code in this file can not) This makes development much easier.
// One file can be Grease Monkey specific, while the rest can be generic. That same files can than be used within a WebExtension.
// v2.0


// TEMPLATE
// This text block is to be removed from scripts. It's only meant to describe this template.
//

// XXX_PATH: path to the script
// YYY: Optional, but usually sensible to edit
// ###: as needed


// ==UserScript==
// @name           Normal video player
// @namespace      https://github.com/paponius/
// @description    Add standard video toolbar, speed buttons and shortcuts "<" and ">" (Shift-, and Shift-.)
// @author         papo
// @version        0.9.0
// @license        GPLv2
// ###icon           https://www.google.com/s2/favicons?sz=64&domain=yyy.yy

// @match          https://www.instagram.com/reel/*
// @match          https://www.facebook.com/reel/*
// YYY match          *://*.yyy.com/yyy/yyy*/*

// @require        https://github.com/paponius/UserScripts-papo/raw/master/src/normal_video_player.js?v0.9

// ==/UserScript==
