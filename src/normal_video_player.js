(function() {
'use strict';

/**
 * Normal video player
 * Supports Facebook, Instagram, (todo: for Google shorts it will just redirect to classic player)
 * - removes shades and overlays
 *   useful overlay is moved away and expanded (Note on Facebook)
 * - un-mutes the video. (Browser will pause it. That's the deal. Rules.)
 *   If video did indeed stop playing, it will be rewind, so user can click to play from beginning.
 * - Controls are enabled.
 * - Implicitly it's possible now to play video full-screen and change its speed.
 *   (todo: keyboard shortcuts for speed; click-buttons for speed)
 * - Video is made bigger. But since there is full-screen, it's not forced to be biggest as possible.
 * - Masthead can be removed, which is useful only when not logged in.
 *
 * 
 * If something does not work. It's going to be an issue with changed DOM on original site. Use `sites` array to add new selector.
 * Append the selector, do not remove old one, if it does not collude with something, as site might change back later.
 *
 *
 *
 * There is a difference between page StyleSheet and an item in sites adding inline style, where the selector can be relative to a reference element. That was the plan but it's not yet used for any, as the video iterator now iterates <video> and elements that need to be styled are higher up.
 *
 */

/**
 * Data object (sites)
 * The goal of this object is to have easily maintainable script.
 * Scripts modifying 3rd party web page are usually quite sensitive on site's modification.
 * It's not meant to be comprehensive solution for site patching. Functionality is added per-need.
 * But it is quite possible a new site can be added using just this object.
 * The function modPage() is meant to be reusable, not this whole script itself.
 *
 * The feature to retrieve a value is not developed yet. The idea is,
 * there will be one variable into which any get* actor would store a value.
 * It can later (next indexes in *jobs*) be used with a keyword e.g. STORED_VALUE.
 * For simplicity of this Object, if multiple variables would be needed together, they will be a number suffix to both the getter and the keyword
 * The variable is valid only within its *jobs* array item, where it is present until another getter overwrites it.
 *
 * todo: maybe it will be better to use :scope where possible instead of ref, but that will create inconsistencies.
 * which is not good, but there might be need to use ref selectively 
 * e.g. with useReference, cssPath would anyway search whole DOM, unless :scope is specified, but other, relativePos, (tagName too?) would always search from ref.
 */
/// DESCRIPTION:
//	sitemask:                <part of a domain> (e.g. instagram, instagram.com, www.instagram.com; partial or identical,
//	                         two sitemasks targeting the same page are possible)
//		actions:             hidePageOverlays
//			jobs:            (an Array within actions)
//				conditional: ifCssPath, ifPropExists
//					ifPropExists: must be used with useReference
//				complement:  useReference: <'loopItem'|'reference<NUMBER>'>, waitForElOnParentCssPath
//					waitForElOnParentCssPath: now it will observe and run resolve once. (unmute need once) Can add option to run forever.
//				             (loopItem: iterator from `loop` holds an element which will be used instead of the `document` with designators where applicable)
//				designators: cssPath, tagName, relativePos (must also use useReference)
//				             (todo: if needed, possibility to use multiple designators with AND between them)
//				actors:      setCSSProperties, getCSSProperty, click
var sites = {
	instagram: {
		hidePageOverlays: [{
				cssPath: 'main > div:has([href="/accounts/emailsignup/"',
				setCSSProperties: 'display: none;'
			},
			// cookies
			{
				cssPath: '#has-finished-comet-page ~ [style*="--fds-"]',
				setCSSProperties: 'display: none;'
			},
			// "Never miss a post from ..."
			{
				cssPath: 'body > div > #scrollview',
				setCSSProperties: 'display: none;'
			}],
		hideVideoOverlays: [{
			relativePos: 'nextElementSibling',
			setCSSProperties: 'display: none;'
		}]
	},
	// B: player for anonymous, when not signed-in
	facebook: {
		loop: [{
				// loopOverTagName is not used now. <video> tag is hard-coded.
				// plan: loopOver<TagName|...> is used to create an Array to loop over, providing iterator's value with `loopItem`
				loopOverTagName: 'video'
				// getReferenceElementBy<tagName|...>_0 can create additional reference elements. (to loopItem)
				// e.g. There are multiple <video> el., where each has ancestry starting at an el. which will be looped over.
				// <video> itself is used a lot, so it will be stored in a `reference_<NUMBER>`.
				// In cssPath, within a selector, also `REFERENCE_<NUMBER>|LOOPITEM` can be used, different or the same as in useReference.
				// (it makes sense to use the same, where sibling of the reference is needed, as `:scope + div` is not valid selector)
				// getReferenceElementByRelativePos_1: 'nextElementSibling'
				// getReferenceElementBy<tagName|...>_0:
			}],
		hidePageOverlays: [{
				// B
				cssPath: '#scrollview ~ *', // login/register dialog
				setCSSProperties: 'display: none;'
			}],
		hideVideoOverlays: [{
				// B only. must not act on A, ifCssPath value below is present only on B
				ifCssPath: '[data-pagelet="Reels"]',
				useReference: 'loopItem',
				relativePos: 'nextElementSibling',
				setCSSProperties: 'display: none;'
			}],
		// useReference is used for ifPropExists, but also for cssPath to get and unmute only one video
		// TODO: this changed, not anonymous needs new slector (probably)
		unmute: [{
				// A, ? not A, B
				useReference: 'loopItem', // ref for click
				ifPropExists: 'muted',
				waitForElOnParentCssPath: 'REFERENCE_1 ~ div [data-visualcompletion',
				cssPath: 'REFERENCE_1 ~ div [aria-label="Unmute"], ~ div button, [aria-label="Unmute"]',
				click: true
			}],
		moveOverlays: [
			// {
				// warn: this would be wrong on a page with multiple <video>
				//       as in this case this data is processed within a loop foreach video. must get That video, not all
				//       and also set "left" for only that video in next step
				// tagName: '',
				// getCSSProperty: 'width'
			// },
			// B.
			{
				// bottom overlay, top overlay
				cssPath: '[data-pagelet="Reels"] + div > div, [data-pagelet="Reels"] ~ div:last-child',
				// this should be taken from width
				setCSSProperties: 'left: -460px;'
			},
			// B. allow clicking through this moved element, to reach "prev" button, but allow all its smaller children (one below)
			{
				cssPath: '[data-pagelet="Reels"] + div > div',
				setCSSProperties: 'pointer-events: none;'
			},
			// B. see above
			{
				cssPath: '[data-pagelet="Reels"] + div > div > *',
// this should be taken from <video> width
				setCSSProperties: 'pointer-events: all;'
			},
			// B. moved text will not be visible without this; 251228 "Card" changed to "card"
			{
				cssPath: ':is([aria-label="Previous Card"], [aria-label="Previous card"]) + div > div',
				setCSSProperties: 'overflow: visible'
			},
			// B.
			{
				// click on "See more". It's optional. console would print error if not present.
				cssPath: '[data-pagelet="Reels"] + div [role="button"]:not(:has(> *))',
				click: true
			}
		],
		hideMasthead: [
			// B.
			{
				cssPath: '[role="banner"]',
				setCSSProperties: 'display: none;'
			},
			// B.
			{
				cssPath: '[role="banner"] + div > div > div',
				setCSSProperties: 'top: 0; min-height: 100vh;'
			},
			// B.
			{
			// , alt
				cssPath: '[data-video-id], [data-pagelet="Reels"] > div',
				setCSSProperties: 'height: 100vh; width: unset; min-width: 675px;'
			},
			// B.
			{
				cssPath: '[role="main"]',
				setCSSProperties: 'height: 100vh;'
			},
			// B.
			{
				// needed on 3, but set to all <div> between. Seems to not matter, alternatively can set 0 to :root { --header-height: 56px;
				cssPath: '#scrollview div:has([role="main"])',
				setCSSProperties: 'height: 100vh;'
			},
			// B.
			{
				// bottom overlay, top overlay
				cssPath: '[data-pagelet="Reels"] + div > div, [data-pagelet="Reels"] ~ div:last-child',
				setCSSProperties: 'width: 423px;'
			}
		]
	}
};


// should be outside of the isolation function, so DEBUG can be used in functions of script files included before this one.
var DEBUG = ( GM && GM.info.script.name.indexOf('DEBUG') !== -1 ) ? -1 : false;
// optional line
DEBUG = ( GM && GM.info.script.name.split('DEBUG:')[1]?.substring(0,1)) || DEBUG;
var LOG = DEBUG || (GM && GM_info.script.name.includes('LOG'));
if (DEBUG == 's') { debugger; } // stop at beginning

var debugRunCnt = 0;
if (LOG) { console.log('[Normal video player] START'); }

var config = {
	hideMasthead: new Option('hideMasthead','Hide masthead').value
};


// function initLoop() {}

function modPage(domainKeys, type, loopItem) {
	var refData = {};
	domainKeys?.forEach(domainKey => {
		sites[domainKey].loop?.forEach( itm => {
			if (DEBUG == 2) { debugger; }
			for (const par in itm) {
				const arPar = par.split('_');
				if (!arPar[1]) { continue; }
				if (arPar[0] === 'getReferenceElementByRelativePos') {
					switch (itm[par]) {
					  case 'nextElementSibling':
						refData[arPar[1]] = loopItem?.nextElementSibling;
						break;
					  default:
						console.error('[Normal video player] wrong value of designator: ' + itm[par], itm);
						break;
					}
				}
			}
		});
		sites[domainKey][type]?.forEach(job => {
			var arrEl, condition = true, elRef = document;

			if (LOG) { console.log('[Normal video player] job:', job); }
			if (DEBUG == 2) { debugger; }

			/// complement - reference
			if (job.useReference) {
				if (job.useReference === 'loopItem') { elRef = loopItem; }
				if (job.useReference.contains('reference')) { /* todo: get number, use refData  */ }
			}

			/// complement - observer
			if (job.waitForElOnParentCssPath) {
				const arObserved = Array.from(elRef.querySelectorAll(':scope :is(' + job.waitForElOnParentCssPath + ')'));
				if (!arObserved.length) {
					arObserved.forEach( elObserveOn => {
						var observer = new MutationObserver(mutations => {
							if (DEBUG == 2) { debugger; }
							for (const mut of mutations) {
								if (LOG) { console.log('[Normal video player] observer processing mutation out of ' + mutations.length, mut); }
								if (mut.addedNodes.length === 0) { continue; } // looking for added only now, not removed/changed
								for (const node of mut.addedNodes) {
									if (!(node instanceof Element)) { continue; } // Processing a #Text node will error
									if (node instanceof HTMLStyleElement) { continue; }
									if (LOG) { console.log('[Normal video player] observer runs nowOrLater()'); }
									nowOrLater(observer);
									return // observer event
								}
							}
						})
						.observe(elObserveOn, {
							// subtree: true, // now observing just additions on one target
							childList: true
						});
					});
				} else { nowOrLater(); }
			} else { nowOrLater(); }

			function nowOrLater(obs) {
				/// conditional
	// todo: need to add :scope
				if (job.ifCssPath) {
					condition &&= elRef.querySelector(job.ifCssPath);  // jshint ignore:line
					// maybe should just return from here (to next job)
				}
				if (job.ifPropExists) { condition &&= elRef[job.ifPropExists]; }  // jshint ignore:line

				/// designators
	// todo: need to add :scope
				if (job.cssPath) {
					arrEl = Array.from(elRef.querySelectorAll(':scope :is(' + job.cssPath + ')'));
				}
	// todo: need to add :scope?
				if (job.tagName) {
					arrEl = Array.from(elRef.getElementsByTagName(job.tagName));
				}
				if (job.relativePos) {
					switch (job.relativePos) {
					  case 'nextElementSibling':
						arrEl = [elRef.nextElementSibling];
						break;
					  default:
						console.error('[Normal video player] wrong value of designator: ' + job.relativePos, job);
						break;
					}
				}

				/// actors
				// could also `return` here, but not worth it
				if (LOG && !arrEl?.length) { console.error('[Normal video player] wrong selector in ' + domainKey + ', for ' + type, job); }
				if (!condition) { return; } // to next job
				arrEl?.forEach(el => {
					if (job.setCSSProperties) {
						el.style.cssText = el.style.cssText + job.setCSSProperties;
					}
					if (job.click) {
							el.click();
					}
				});
				// or only remove when observer when the target arrEl was found? but when the observed el was found but did not have arrEl,
				// what else is there to wait for?
				// Another point, Maybe there will be an option to not remove the observer, it might be the observed el keeps disappearing and job on arrEl should be repeatedly done.
				// if (arrEl?.length) { obs?.disconnect(); if (LOG) { console.log('[Normal video player] observer disconnected (removed)'); }}
				obs?.disconnect();
			}
		});
	});
}

function action() {
	if (LOG) { console.log('[Normal video player] START action() which run:', debugRunCnt); }
	// when debugging, run just once, 2: after 1sec
	if (DEBUG && ++debugRunCnt !== 2) { return; }
	// if (DEBUG && ++debugRunCnt === 1) { return; } // might be too soon, not good for debug
	// if (DEBUG && debugRunCnt > 2) { return; }
	// if (DEBUG && ++debugRunCnt === 1) { debugger; }
	var fixesDone = 0;
	var isVideoPresent = false;

	// domainKeys: 
	var domainKeys = Object.keys(sites).filter(key => window.location.hostname.includes(key));

	// hideOverlays();
	modPage(domainKeys, 'hidePageOverlays');

	/* -- process all <video> tags -- */
	/* note: for an empty Array, this block will not run */
	Array.from(document.getElementsByTagName('video')).forEach(elVideo => {
		isVideoPresent = true;
		// if (LOG) { console.log('[Normal video player] START forEach() on video: ', elVideo); }
		if (DEBUG) { debugger; }

		// if (LOG) { console.log('[Normal video player] elVideo.getAttribute(\'controls\'): ', elVideo.getAttribute('controls')); }
		// null/""; "" means it's present
		if (elVideo.getAttribute('controls') === null) {
			elVideo.setAttribute('controls','');
			fixesDone++;
			if (LOG) { console.log('[Normal video player] fix: added controls'); }
		}

		// - notOK, video will pause and when PLAY is pressed, the video is muted again
		// elVideo.muted = false;
		// elVideo.setAttribute('muted',false);
		// elVideo.setAttribute('muted','false');

		/// unmute using orig site's click event on mute <button>
		// OLD. instagram specific. todo move to `sites`
		// note, `if (elVideo.getAttribute('muted')) {` would return a value of `muted`, which is `null` if muted is present. Not good.
		if (elVideo.muted) {
			let btnMute = document.querySelector('video ~ div button');
			if (btnMute) {
				btnMute.click();
				fixesDone++;
				if (LOG) { console.log('[Normal video player] the old method | fix: clicked unmute'); }
			} else { console.warn('[Normal video player] the old method | mute button not found'); }
		}
		// new way
		if (elVideo.muted) {
			modPage(domainKeys, 'unmute', elVideo);
		}

		// rewind if it's stopped after unmute and not at beginning
		const isVideoPlaying = elV => !!(elV.currentTime > 0 && !elV.paused && !elV.ended && elV.readyState > 2);
		// const isVideoPlaying_ = (!!(elVideo.currentTime > 0 && !elVideo.paused && !elVideo.ended && elVideo.readyState > 2));
		if (!isVideoPlaying(elVideo) && elVideo.currentTime > 0) {
			elVideo.currentTime = 0;
			fixesDone++;
			if (LOG) { console.log('[Normal video player] fix: rewind'); }
		}

		//// hide video overlays
// todo was for insta 
//elVideo.nextElementSibling.style.display = 'none';
		/* todo if site changes and the above is not enough, to disable all siblings or get another el,
		   - elVideo.parentElement.children.forEach(elCh => {
			   elCh.style.display = 'none';
			 });
		   OR
		   - new querySelectorAll with `video ~ *`
		 */

		modPage(domainKeys, 'hideVideoOverlays', elVideo);
		modPage(domainKeys, 'moveOverlays', elVideo);
	}); // END: loop

	if (config.hideMasthead) {
		modPage(domainKeys, 'hideMasthead');
	}

	if (LOG) { console.log('[Normal video player] isVideoPresent: ', isVideoPresent, 'fixesDone: ', fixesDone); }
	if (isVideoPresent && fixesDone === 0) {
		if (LOG) { console.log('[Normal video player] clearInterval(intTimer): ', intTimer); }
		clearInterval(intTimer);
	}
}

// isIFrame snippet
function isIFrame() {
	if (LOG) { console.debug('[Normal video player] isIFrame() | host: ', window.location.host); }
	if (window.top !== window.self) {
		if (LOG) { console.log('[Normal video player] isIFrame() | Running in an iFrame'); }
		return true;
	}
	if (LOG) { console.log('[Normal video player] isIFrame() | Not running in an iFrame'); }
	return false;
}

// this shouldn't be needed when @noframes meta is used
if (isIFrame()) {
	if (LOG) { console.error('[Normal video player] isIFrame() | Attempted to start in an iFrame'); }
	return;
}


if (LOG) { console.log('[Normal video player] new run: ', document.baseURI); }


/* Does not work with setInterval() now
   https://github.com/Tampermonkey/tampermonkey/issues/2628 */
var intTimer;
/*
if (!intTimer) {
	intTimer = setInterval(action, 2000);
	if (LOG) { console.log('[Normal video player] registering timer: ', intTimer); }
} else { console.log('[Normal video player] timer already exists: ', intTimer); }

setTimeout(() => { console.log('[Normal video player] timeout: ',intTimer); clearInterval(intTimer); }, 15000);
setTimeout(() => { console.log('[Normal video player] timeout2: ',intTimer); clearInterval(intTimer); }, 15000);
setTimeout(() => { console.log('[Normal video player] timeout3: ',intTimer); clearInterval(intTimer); }, 15000);
 */


setTimeout(action, 100);
setTimeout(action, 1000);
setTimeout(action, 5000);
setTimeout(action, 10000);
setTimeout(action, 15000);
})();
