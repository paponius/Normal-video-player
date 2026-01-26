/* 
   Keyboard shortcuts for HTML video.
   Videos in a ShadowDOM need to be clicked. (for now)

 */

// ==UserScript==
// @name         Video Controls
// @namespace    https://github.com/paponius/
// @description  Keyboard shortcuts for HTML5 video
// @author       papo
// @version      1.0.0
// @license      CC BY-NC-SA 4.0

// @match        https://*/*
//// YouTube has it's own speed control, but this is better.
// #exclude      https://www.youtube.com/*
//
//// or disable "https://*/*" above and keep just some
// @match        https://twitter.com/*
// @match        https://www.reddit.com/*
// @match        https://x.com/*

// @grant none
// @run-at       document-end
// ==/UserScript==

/* This file can be used as a UserScript by itself. Add ?file.user.js to the URI to install. */

// Simpler version, just speed and skips: https://gist.github.com/paponius/c509d734f0a57a00d2e8b1aeb1346621


// Keymap:
const SLOWER    = ","; // -0.1x
const FASTER    = "."; // +0.1x
const NORMAL    = "n"; //  1.0 (as "n"ormal)
const SHOW      = "'"; //  show speed
const FF5       = 'ArrowRight'; // Forward 5 secs
const RW5       = 'ArrowLeft';  // Reverse 5 secs
const FF10      = 'l'; // Forward 10 secs
const RW10      = 'j'; // Reverse 10 secs
const MUTE      = 'm'; // Mute/Unmute
const PLAYPAUSE = 'k'; // Play/Pause
const FF_FRAME  = '.'; // Forward 1 frame
const RW_FRAME  = ','; // Reverse 1 frame
const TO_START  = 'h'; // To start ("h"ome)
const NEXT      = ';'; // Next video (go to last frame and let the site switch)
// FF_FRAME and FASTER (also RW_FRAME and SLOWER) can use the same key, as one works while paused, the other while playing
// can't use: "/" in Firefox is search shortcut used by browser

/**
 * elVideo              [HTMLElement]    currently playing MediaElement
 * speed                [Number]         to save resources, a call to elVideo.playbackRate. (not huge save)
 * elToast              [HTMLElement]    to reuse toast element
 * timToast             [timer "handle"] to cancel toast message's timer
 * currentlyPressedKeys [Array]          keeps record of currently pressed keys
 * LOG                  [Any]            LOG can be assigned in another UserScript to something true
 */
var elVideo, speed, elToast, timToast, currentlyPressedKeys = [];
var frameTime = 1 / 25; // initially assume 25 fps
var DEBUG, LOG;


if (DEBUG == 2) {
	// Twitter: on video stall: pause, ended, waiting, playing; on seek: waiting, playing; when scrolled away: pause, only sometimes suspend
	document.addEventListener("play", (e) => console.log('[video_speed] event: play', e.target), { capture: true });
	document.addEventListener("playing", (e) => console.log('[video_speed] event: playing', e.target), { capture: true });
	document.addEventListener("pause", (e) => console.log('[video_speed] event: pause', e.target), { capture: true });
	document.addEventListener("stalled", (e) => console.log('[video_speed] event: stalled', e.target), { capture: true });
	document.addEventListener("waiting", (e) => console.log('[video_speed] event: waiting', e.target), { capture: true });
	document.addEventListener("suspend", (e) => console.log('[video_speed] event: suspend', e.target), { capture: true });
	document.addEventListener("ended", (e) => console.log('[video_speed] event: ended', e.target), { capture: true });
}

// if (unsafeWindow.videoSpeedControl === true) { return; } // but now this file is not sandboxed, so the whole Normal video player would exit

// capture: true: playing/pause do not bubble. Need capture to be able to capture the event on any ancestor element.
document.addEventListener("playing", assignVideo, { capture: true });
document.addEventListener("pause", divestVideo, { capture: true });

function assignVideo(event) {
	if (LOG) { console.log('[video_controls] assignVideo', 'XXXX', event.target === elVideo ? " | ignoring: it's an old one" : " | registering: new video"); }
	// if (LOG) { console.log('[video_speed] assignVideo', event.target, event.target === elVideo ? " | ignoring: it's an old one" : " | registering: new video"); }
	// e.g. tiktok is changing mute state based on its internal state
	if (elVideo) {
		if (LOG) { console.log(`[video_controls] mute: already known video started playing again. It's now ${elVideo.muted ? '' : 'NOT'} muted. Changing to saved state: ${elVideo.dataset.muted ? '' : 'NOT'} muted.`); }
		// it could also be undefined
		if (elVideo.dataset.muted === 'true') { elVideo.muted = true;
		} else if (elVideo.dataset.muted === 'false') { elVideo.muted = false; }
		if (LOG) { console.log(`[video_controls] mute: todo: should probably check if mute state was actually changed before. Saved mute state: ${elVideo.dataset.muted}`); }
	}
	// todo  When it's un-muted here, browser will say no interaction and will pause it. BUT the video will remain muted.
	//       maybe should check twice and un-mute again

	if (event.target === elVideo) { return; } // elVideo could also be undefined/null here
	if (!elVideo) {
		// capture: true: to be able to cancel the event soon as possible. To avoid possible site's listeners.
		document.addEventListener("keydown", handlePressedKey, { capture: true });
		document.addEventListener("keypress", handlePressedKey, { capture: true });
		document.addEventListener("keyup", handlePressedKey, { capture: true });
		// document.addEventListener("keypress", stopProp, { capture: true });
		// document.addEventListener("keyup", stopProp, { capture: true });
	}
	elVideo = event.target;
	speed = Math.round(elVideo.playbackRate * 10) / 10;
}

function divestVideo(event) {
	if (elVideo?.paused && ! elVideo.ended) { return; } // keep listener if video was paused, so it can be started

	if (LOG) { console.log('[video_controls] divestVideo', event.target, event.target === elVideo ?
		" | removing: it's the one which was last active" : " | ignoring, not removing: it's NOT the one which was last active"); }
	// second assignVideo() could have been called, before the first one is paused and elVideo divested (assumption)
	if (event.target !== elVideo) { return; }
	document.removeEventListener("keydown", handlePressedKey);
	document.removeEventListener("keypress", handlePressedKey);
	document.removeEventListener("keyup", handlePressedKey);
	// document.removeEventListener("keypress", stopProp);
	// document.removeEventListener("keyup", stopProp);
	elVideo = null;
}

var cssToast = `
			@keyframes video-control-toast-fadeinout {
				0% {
					opacity:0
				}
				25%,
				75% {
					opacity:1
				}
				100% {
					opacity:0
				}
			}
			.video-control-toast {
				all: revert;
				animation: video-control-toast-fadeinout var(--video-control-toast-timeout, 1500ms) cubic-bezier(.05,0,0,1) 1 normal forwards;
				text-align: center;
				position: absolute;
				left: 0;
				right: 0;
				top: 10%;
				z-index: 19;

				margin: 0;
				padding: 0;
				border: 0;
				background: transparent;
			}
			.video-control-toast > div {
				/* backdrop-filter: blur(16px); */
				background: rgba(0,0,0,.6);

				display: inline-block;
				padding: 10px 20px;
				font-size: 175%;
				pointer-events: none;
				border-radius: 3px;

				font-family: Roboto, Arial, Helvetica, sans-serif;
				font-size: 19.25px;
				color: #eeec;
			}
		`;
var sheetToast = new CSSStyleSheet();
sheetToast.replace(cssToast).catch((err) => { console.error("[video_controls] Failed to replace styles:", err); });

/**
 * Shows a toast - notification message on top of a media for a short period of time, then removes itself.
 *
 * elToast: variable defined in parent scope, but used only within showToast(). elToast holds toast elements which
 *   are created only once, on first use of showToast(). Subsequent use of showToast() will re-use elToast elements
 *   with the same or any other media element. DOM will remove elToast from old parent when it's added to another location.
 *   It also means there can't be two toasts simultaneously. On purpose or by a mistake.
 *   The presence of elToast is also used to indicate if style was already injected to page.
 * Toast style is now injected using *style* element to main *document*, but it's using adoptedStyleSheet for Shadow DOM.
 *   There is no special reason for that, just to test and see which way proves better, if any.
 * timToast: variable defined in parent scope, but used only within showToast(). Variable is used to cancel timer when
 *   new message arrives. As the elToast is reused, old timer would remove the new message prematurely.
 * Removing of the elToast is actually not necessary, as the animation within its CSS will make it opaque within timeout time.
 * But it's better to remove it, so it will not interfere with something.
 *
 * @method showToast
 * @param  {String}  message Text to show in the toast message
 * @param  {Number}  timeout How long will the message stay on screen. With a default value defined.
 * @return {Null}
 */
function showToast(message, timeout = 1500) {
	if (!elToast) {
		const elStyle = document.createElement('STYLE');
		elStyle.textContent = cssToast;
		document.head.appendChild(elStyle); 
		// alt: document.adoptedStyleSheets = [sheetToast];

		const elToastPar = document.createElement('DIV');
		elToast = document.createElement('DIV');
		elToastPar.classList.add('video-control-toast');
		elToastPar.appendChild(elToast);
	} else { clearTimeout(timToast); }

	elToast.textContent = message;
	if (timeout !== 1500) { elToast.parentElement.style.setProperty('--video-control-toast-timeout', timeout + 'ms');
	} else { elToast.parentElement.style.removeProperty('--video-control-toast-timeout'); }
	elVideo.insertAdjacentElement('afterend', elToast.parentElement);
	timToast = setTimeout(() => {
		elToast.parentElement.remove();
	}, timeout);
}

// todo maybe remove. was used before listening to all three events code was added to handlePressedKey()
function stopProp(event) {
	if ([SLOWER, FASTER, NORMAL, SHOW, FF5, RW5, FF10, RW10, MUTE].includes(event.key)) {
		if (LOG) { console.debug('%c[video_controls] event: stopProp(event)','color: lightpink;', event.key, event.target, elVideo); }
		event.stopImmediatePropagation();
	}
}

function handlePressedKey(event) {
	// If the pressed key is coming from any input field, do nothing.
	const target = event.target;
	if (target.localName === "input" || target.localName === "textarea" || target.isContentEditable) { return; }
	if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) { return; }
	if (LOG) { console.debug(`%c[video_controls] event: handlePressedKey(event) | key: ${event.key} | type: ${event.type} | event.remapped: ${event.remapped}` ,'color: cyan;', event.target, elVideo, event); }
	if (event.remapped === true) { return; }

	// Watching all three events, also the deprecated keypress. On e.g. TikTok, keydown is blocked for all keys, keypress does not work for arrows, keyup is not optimal, but it's at least something.
	// Act either on down/push or up, not both. Each pressed button is remembered to disable acting on it on the way up.
	if (event.type === 'keydown' || event.type === 'keypress') {
		if (currentlyPressedKeys.includes(event.key)) {
			// This `if` condition (not its body) can be removed to disallow repeating on a key hold. (Maybe allow just some)
			if (event.type === 'keypress') {
				if (LOG) { console.debug('[video_controls] event: handlePressedKey(event) | ignored'); }
				// need to stop other listeners for each type separately
				stopProp(event);
				return;
			}
		} else { currentlyPressedKeys.push(event.key); }
	} else { // 'keyup'
		const idx = currentlyPressedKeys.indexOf(event.key);
		if (idx !== -1) {
			currentlyPressedKeys.splice(idx, 1);
			if (LOG) { console.debug('[video_controls] event: handlePressedKey(event) | ignored'); }
			stopProp(event);
			return;
		}
	}
	// This line should be after saving of key event. Key could be pressed before elVideo is found and needs to be remembered anyway.
	if (!elVideo) { return; }
	if (LOG) { console.debug('[video_controls] event: handlePressedKey(event) | will act if key registered'); }

	switch (event.key) {
	  case SLOWER:
	  case RW_FRAME:
		if (SLOWER !== RW_FRAME && event.key === RW_FRAME && ! elVideo.paused) { elVideo.pause(); }
		if (elVideo.paused) {
			elVideo.currentTime = Math.max(0, elVideo.currentTime - frameTime);
		} else {
			// Math.round(): in JS `num = 7.9; num -= 0.1;` is sometimes 7.800000000000001
			if (speed === 0) { break; }
			speed = Math.round((speed - 0.1) * 10) / 10;
			elVideo.playbackRate = speed;
			showToast(speed.toFixed(2).toString() + "x");
		}
		event.stopImmediatePropagation();
		break;
	  case FASTER:
	  case FF_FRAME:
		if (FASTER !== FF_FRAME && event.key === FF_FRAME && ! elVideo.paused) { elVideo.pause(); }
		if (elVideo.paused) {
			debugger;
			const elCanvas = document.createElement('CANVAS');
			const ctx = elCanvas.getContext("2d");
			let width = canvas.width;
			let height = canvas.height;
			elVideo.addEventListener("seeked", (event) => {
				console.log("Video found the playback position it was looking for.");
				ctx.drawImage(video, 0, 0, width, height);
			});
			// todo if end is reached // todo check if elVideo still present
			// Math.min(elVideo.duration, elVideo.currentTime + frameTime);
			let timeBefore = elVideo.currentTime += 1 / 60;

		} else {
			speed = Math.round((speed + 0.1) * 10) / 10;
			elVideo.playbackRate = speed;
			showToast(speed.toFixed(2).toString() + "x");
		}
		event.stopImmediatePropagation();
		break;
	  case NORMAL:
		speed = elVideo.playbackRate = 1;
		showToast('1x', 250);
		event.stopImmediatePropagation();
		break;
	  case SHOW:
		showToast(speed.toFixed(2).toString() + "x");
		event.stopImmediatePropagation();
		break;

	  case FF5:
		showToast('+ 5 sec');
		elVideo.currentTime = Math.min(elVideo.duration, elVideo.currentTime + 5);
		event.stopImmediatePropagation();
		break;
	  case RW5:
		showToast('- 5 sec');
		elVideo.currentTime = Math.max(0, elVideo.currentTime - 5);
		event.stopImmediatePropagation();
		break;
	  case FF10:
		showToast('+ 10 sec');
		elVideo.currentTime = Math.min(elVideo.duration, elVideo.currentTime + 10);
		event.stopImmediatePropagation();
		break;
	  case RW10:
		showToast('- 10 sec');
		elVideo.currentTime = Math.max(0, elVideo.currentTime - 10);
		event.stopImmediatePropagation();
		break;
	  case TO_START:
		showToast('to start');
		elVideo.currentTime = 0;
		event.stopImmediatePropagation();
		break;
	  case NEXT:
		showToast('next');
		elVideo.currentTime = elVideo.duration - 0.1;
		event.stopImmediatePropagation();
		break;
	  case MUTE:
		// Player on the page sometimes remember its mute state and force it on video when its play button is pushed. (TikTok)
		// This does not always correlate with a site. i.e. When mute icon is pressed after keyboard mute key was used, the next time the state from site is ignored. It can be made to follow it on e.g. Twitter, but not on TikTok.
		if (elVideo.dataset.muted === undefined) { elVideo.dataset.muted = elVideo.muted;
			if (LOG) { console.log('[video_controls] mute: state was not saved yet. Storing detected state: ', elVideo.dataset.muted, 
				' | switching mute state'); }
		}
		if (elVideo.dataset.muted === 'true') { // it's a String, not Boolean
			elVideo.dataset.muted = elVideo.muted = false;
			showToast('Unmute');
		} else {
			elVideo.dataset.muted = elVideo.muted =true;
			showToast('Mute');
		}
		event.stopImmediatePropagation();
		break;
	  case PLAYPAUSE:
		let pausedState = elVideo.paused;
		showToast(pausedState ? 'Play' : 'Pause');
		if (pausedState) { elVideo.play();
		} else { elVideo.pause(); }
		event.stopImmediatePropagation();
		break;
	}
}

function findMediaInWholeDoc(docRoot) {
	const nodeIterator = document.createNodeIterator(docRoot, NodeFilter.SHOW_ELEMENT, node => 
		node instanceof HTMLMediaElement ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
	);
	var currentNode;
	while ((currentNode = nodeIterator.nextNode())) {
		return currentNode;
	}
}

/* Video inside a ShadowDOM will not trigger *playing* listener outside of it.
   i.e. `document.addEventListener("playing", assignVideo, { capture: true });` will not catch such <video>
   This code block will listen on all clicks and iterate all elements (not only topmost clicked element but also those underneath it) which are on the location where pointer caused the click event. These are usually/always? also all parent elements up to the *document* (or document-fragment in Shadow DOM) (and also any other elements drown on the location of the click event and its parents)?
   Will step in any ShadowDOM encountered on clicked element and also search inside it.
   Found <video> element is returned and a `playing` listener installed on it.
   That means, clicking on a video, even if it's covered by an overlay, will get the video.
 */ 

document.addEventListener("click", (event) => {
	if (DEBUG) console.debug('[video_controls] event click START | elementsFromPoint:',document.elementsFromPoint(event.x, event.y));
	// console.log(event.target.elementsFromPoint(event.x, event.y));
	function findMediaFromPoint(doc) {
		var elFound;
		doc.elementsFromPoint(event.x, event.y).some(elem => {
			// Not needed, as elem is outside of doc, next line will return anyway: if (elem.shadowRoot === doc) { return; }
			if (! doc.contains(elem)) { return; }
			if (elem instanceof HTMLMediaElement) { elFound = elem; return true; } // from *some()*
			if (elem.shadowRoot) {
				if (DEBUG) console.debug('[video_controls] found Shadow DOM:', elem.shadowRoot, elem.shadowRoot.elementsFromPoint(event.x, event.y));
				elem.shadowRoot.addEventListener("playing", assignVideo, { capture: true });
				elem.shadowRoot.addEventListener("pause", divestVideo, { capture: true });
				elem.shadowRoot.adoptedStyleSheets = [sheetToast];
				elFound = findMediaFromPoint(elem.shadowRoot); // finds only those intersecting
				if (elFound) { return true; }
				elFound = findMediaInWholeDoc(elem.shadowRoot);
				if (elFound) { return true; }
			}
		});
		return elFound;
	}
	var elClickedVideo = findMediaFromPoint(document);
	if (elClickedVideo) {
		if (elVideo && elVideo !== elClickedVideo) {
			elVideo.pause();
			divestVideo({target: elVideo});
		}
		assignVideo({target: elClickedVideo});
	}
}, { capture: true });
