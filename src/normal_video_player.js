(function() {
'use strict';

/**
 * Facebook
 * todo
 * When no signed in, after few videos, login popup shows again. The element is created dynamically. Can't hide it with inline css.
 * Need to create a stylesheet. But then, it would be easier to have all styles there.
 *
 * To make page fixes easier, use this script to create anchors. then in a CSS use those anchors. CSS would survive page style updates, only path to anchors will have to be fixed. one fix vs many.
 *
 */

// key: part of a domain; e.g. instagram, instagram.com, www.instagram.com; partial or identical duplicated are possible
var sites = {
	instagram: {
		hidePageOverlays: [{
				cssPath: 'main > div:has([href="/accounts/emailsignup/"',
				setProperties: 'display: none;'
			},
			// cookies
			{
				cssPath: '#has-finished-comet-page ~ [style*="--fds-"]',
				setProperties: 'display: none;'
			},
			// "Never miss a post from ..."
			{
				cssPath: 'body > div > #scrollview',
				setProperties: 'display: none;'
			}],
		hideVideoOverlays: [{
			relativePos: 'nextSibling',
			setProperties: 'display: none;'
		}]
	},
	facebook: {
		hidePageOverlays: [{
			cssPath: '#scrollview ~ *', // login/register dialog
			setProperties: 'display: none;'
		}],
		hideVideoOverlays: [{
			relativePos: 'nextSibling',
			setProperties: 'display: none;'
		}],
		unmute: [{
			cssPath: '[aria-label="Unmute"]',
			click: true
		}],
		moveOverlays: [
			{
				// warn: this would be wrong on a page with multiple <video>
				//       as in this case this data is processed within a loop foreach video. must get That video, not all
				//       and also set "left" for only that video in next step
				tagName: 'video',
				getProperty: 'width'
			},
			{
				cssPath: '[data-pagelet="Reels"] + div > div, [data-pagelet="Reels"] ~ div:last-child',
// this should be taken from <video> width
				setProperties: 'left: -460px;'
			},
			// allow clicking through this moved element, to reach "prev" button, but allow all its smaller children (one below)
			{
				cssPath: '[data-pagelet="Reels"] + div > div',
				setProperties: 'pointer-events: none;'
			},
			// see above
			{
				cssPath: '[data-pagelet="Reels"] + div > div > *',
// this should be taken from <video> width
				setProperties: 'pointer-events: all;'
			},
			{
				cssPath: '[aria-label="Previous Card"] + div > div',
				setProperties: 'overflow: visible'
			}
		],
		hideMasthead: [
			{
				cssPath: '[role="banner"]',
				setProperties: 'display: none;'
			},
			{
				cssPath: '[role="banner"] + div > div > div',
				setProperties: 'top: 0; min-height: 100vh;'
			},
			{
			// alt
				cssPath: '[data-video-id], [data-pagelet="Reels"] > div',
				setProperties: 'height: 100vh; width: unset; min-width: 675px;'
			},
			{
				cssPath: '[role="main"]',
				setProperties: 'height: 100vh;'
			},
			{
				cssPath: '#scrollview div:has([role="main"])',
				setProperties: 'height: 100vh;'
			}
		]
	}
};

var LOG = (GM_info.script.name.includes('LOG'));
var DEBUG = (GM_info.script.name.includes('DEBUG'));
var debugRunCnt = 0;
if (LOG) { console.log('Normal video player | START'); }

var config = {
	hideMasthead: new Option('hideMasthead','Hide masthead').value
};

// todo: must be selectable by `sites` if elRef or document is used
function modPage(domainKeys, type, elRef = document) {
	domainKeys?.forEach(domainKey => {
		sites[domainKey][type]?.forEach(job => {
			var arrEl;
			if (job.cssPath) {
				arrEl = Array.from(elRef.querySelectorAll(job.cssPath));
			}
			if (job.tagName) {
				arrEl = Array.from(elRef.getElementsByTagName(job.tagName));
			}
			if (job.relativePos) {
				arrEl = [elRef.nextElementSibling];
			}

			if (!arrEl) { console.error('[] wrong selector in ' + domainKey + ', for ' + type); } // could also `return`
			arrEl?.forEach(el => {
				if (job.setProperties) {
					el.style.cssText = el.style.cssText + job.setProperties;
				}
				if (job.click) {
						el.click();
				}
			});
		});
	});
}

function action() {
	if (LOG) { console.log('Normal video player | START action()'); }
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
		// if (LOG) { console.log('Normal video player | START forEach() on video: ', elVideo); }
		// if (DEBUG) { debugger; }
		// if (LOG) { console.log('Normal video player | elVideo.getAttribute(\'controls\'): ', elVideo.getAttribute('controls')); }
		// null/""; "" means it's present
		if (elVideo.getAttribute('controls') === null) {
			elVideo.setAttribute('controls','');
			fixesDone++;
			if (LOG) { console.log('Normal video player | fix: added controls'); }
		}

		// - notOK, video will pause and when PLAY is pressed, the video is muted again
		// elVideo.muted = false;
		// elVideo.setAttribute('muted',false);
		// elVideo.setAttribute('muted','false');

		// unmute using orig site's click event on mute <button>
		// todo: this is instagram specific. will see how many other sites will have something similar. then decide if creating a property in sites for this action, or a property "other actions"
		// note: Doing unmute stops the video, but at least when play again is pressed it is unmuted
		// notok: does not work like this, returns null: if (elVideo.getAttribute('muted')) {
		if (elVideo.muted) {
			let btnMute = document.querySelector('video ~ div button');
			if (btnMute) {
				btnMute.click();
				fixesDone++;
				if (LOG) { console.log('Normal video player | fix: clicked unmute'); }
			} else { console.warn('Normal video player | mute button not found'); }
		}
		// new way
		if (elVideo.muted) {
			modPage(domainKeys, 'unmute');
		}

		// rewind if it's stopped after unmute and not at beginning
		const isVideoPlaying = elV => !!(elV.currentTime > 0 && !elV.paused && !elV.ended && elV.readyState > 2);
		// const isVideoPlaying_ = (!!(elVideo.currentTime > 0 && !elVideo.paused && !elVideo.ended && elVideo.readyState > 2));
		if (!isVideoPlaying(elVideo) && elVideo.currentTime > 0) {
			elVideo.currentTime = 0;
			fixesDone++;
			if (LOG) { console.log('Normal video player | fix: rewind'); }
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
		modPage(domainKeys, 'moveOverlays');
		localStorage.setItem('t2', 'xxxxxxx');
		debugger;
		localStorage.setItem('t3', 'xxxxxxx');
		if (config.hideMasthead) {
			modPage(domainKeys, 'hideMasthead');
		}
		
	});

	if (LOG) { console.log('Normal video player | isVideoPresent, fixesDone: ',isVideoPresent, fixesDone); }
	if (isVideoPresent && fixesDone === 0) {
		if (LOG) { console.log('Normal video player | clearInterval(intTimer): ', intTimer); }
		clearInterval(intTimer);
	}
}

// isIFrame snippet
function isIFrame() {
	if (LOG) { console.debug('Normal video player | isIFrame() | host: ', window.location.host); }
	if (window.top !== window.self) {
		if (LOG) { console.log('Normal video player | isIFrame() | Running in an iFrame'); }
		return true;
	}
	if (LOG) { console.log('Normal video player | isIFrame() | Not running in an iFrame'); }
	return false;
}

// this shouldn't be needed when @noframes meta is used
if (isIFrame()) {
	if (LOG) { console.log('Normal video player | isIFrame() | Attempted to start in an iFrame'); }
	return;
}


if (LOG) { console.log('Normal video player | new run: ', document.baseURI); }


/* Does not work with setInterval() now
   https://github.com/Tampermonkey/tampermonkey/issues/2628 */
var intTimer;
/*
if (!intTimer) {
	intTimer = setInterval(action, 2000);
	if (LOG) { console.log('Normal video player | registering timer: ', intTimer); }
} else { console.log('Normal video player | timer already exists: ', intTimer); }

setTimeout(() => { console.log('Normal video player | timeout: ',intTimer); clearInterval(intTimer); }, 15000);
setTimeout(() => { console.log('Normal video player | timeout2: ',intTimer); clearInterval(intTimer); }, 15000);
setTimeout(() => { console.log('Normal video player | timeout3: ',intTimer); clearInterval(intTimer); }, 15000);
 */


setTimeout(action, 100);
setTimeout(action, 1000);
setTimeout(action, 5000);
setTimeout(action, 10000);
setTimeout(action, 15000);
})();
