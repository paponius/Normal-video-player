/* This file can be used as a UserScript by itself. Add ?file.user.js to the URI to install. */

// ==UserScript==
// @name         Remap shortcut keys
// @namespace    https://github.com/paponius/
// @description  Remap shortcut keys
// @author       papo
// @version      1.0.0
// @license      CC BY-NC-SA 4.0

// #match        https://*/*
//
// @match        https://twitter.com/*
// @match        https://x.com/*

// @grant none
// #run-at       document-end
// ==/UserScript==


var sitesMapTable = {
	// on Twitter event `keypress` is used, property `which` is required
	'x.com': {
		d: {key: 'j', which: 74}, /* next post */
		s: {key: 'k', which: 75}  /* prev post */
	}
};

var domainKeys = Object.keys(sitesMapTable).filter(key => window.location.hostname.includes(key));
var mapTable;
// todo: Now this will overwrite any previous with latest matched. change this to per-key. only double defined keys will be overwritten
domainKeys?.forEach(domainKey => {
	mapTable = sitesMapTable[domainKey];
});

if (mapTable) {
	// todo would also need to add the other two to stop propagation on them. copy the code from video_controls.js
	// now using keypress, as it does not matter here and it needs to be stopped for twitter 's'
	// window.addEventListener("keydown", keyOverride, { capture: true });
	window.addEventListener("keypress", keyOverride, { capture: true });
	// document.addEventListener("keyup", keyOverride, { capture: true });
}

function keyOverride(event) {
	const target = event.target;
	if (target.localName === "input" || target.localName === "textarea" || target.isContentEditable) { return; }
	if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) { return; }
	if (event.remapped === true) { return; }
	console.debug(`[remap_shortcut_keys] event: key press detected: ${event.key}`);
	// todo: would take remapping values from storage, calculate keycode, 
	var substituent = event.key;
	var substituted = mapTable[substituent];
	if (substituted) {
		let evt = new KeyboardEvent('keypress', substituted);
		evt.remapped = true;
		document.dispatchEvent(evt);
		event.stopImmediatePropagation();
		console.debug(`[remap_shortcut_keys] override | keypress "${substituted.key}" dispatched`);
	}

}
