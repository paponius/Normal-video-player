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
 */

/**
 * TODO:
 ** Facebook anonymous (B)
 * remove click event: clicking on column left of the video (some parts, also "..." (menu)) would pause/resume the video
 *
 * remove dialog: see more - log in
 *
 ** Facebook both anonymous and signed-in:
 * Only first video is tweaked. Two are preloaded, some modding is applied to both two, some just to first. todo: all next videos
 *
 ** Facebook logged-in
 * landscape videos: todo: a button which will show text with dark BG on click
 * 
 * 
 * clicking on video is taken by `video + div [role="presentation"]`. that disallows double click for full screen, but FS icon works.
 * removing the el. helps, then the click goes to <video>, but it does not react that well for some reason
 * 
 ** Facebook logged-in (or maybe both)
 * Some elements are not yet ready when the mod runs. Now the modding runs multiple times. there is no return of success state now, which could indicate whether to schedule more runs later.
 *
 * Maybe it would be possible to add some more wait* directives and run the script just once.
 */

/**
 * Web modding (sites data object)
 * The goal is to have easily maintainable script. Scripts modifying 3rd party web page are sensitive on site's modification.
 * By moving all site-dependent directives to one place, with standard set of directives, there would be no need to walk through the code.
 *
 * Functionality is added per-need. But it is quite possible a new site can be added using just this object.
 *
 * From a page-specific script, functions modPage(), loopPage() are called. modPage() can be called once for the whole page, or within a callback of loopPage(), to apply mods in each iteration.
 *
 */

/**
 *** TODO for Web modding
 *      separate into its file, create functions with call backs
 * observe forever, needed for being able to process additional videos when clicked on next
 * possibility to add page css, not only inline
 *
 ** getCSSProperty
 * The feature to retrieve a value is not developed yet. The idea is,
 * there will be one variable into which any get* actor would store a value.
 * It can later (next indexes in *jobs*) be used with a keyword e.g. STORED_VALUE.
 * For simplicity of this Object, if multiple variables would be needed together, they will be a number suffix to both the getter and the keyword
 * The variable will probably be designed to be valid in all following jobs within one *action*, where it is present until another getter overwrites it.
 *  
 */

/// Description of the sites object
/// References
//    Some conditional and designator directives are run on a reference element. The reference element is the iterator of the loop.
//    It may be changed using *useReference* directive to `document`, or to `reference_<NUMBER>`,
//    which are additional **numbered** references created by `setReferenceElementBy*` directives within loop or ACTION.
//    References created within ACTION should be only used by directives in that ACTION, but for now they will stay valid for the rest
//    of ACTION's iterations and for following ACTIONs until overwritten. (this might change and they'll be cleared after each job)
//    References created within ACTION can be waited upon when directive waitForElOnParentCssPath is used. (not those in loop)
//
//    References can be used, besides for useReference directive, also in selectors of directives. For now they are these:
//    *cssPath*, *ifCssPath* and also in *setReferenceElementByCssPath_#* to set another reference using existing reference.
//    References are added to selectors using keywords in all caps, as if they were a simple selector: REFERENCE_<NUMBER>|LOOPITEM|DOCUMENT
//    LOOPITEM is useful when used in the middle of a complex selector, while on the left is a simple selector checking a state of a parent;
//             when a sibling of a looped item is needed, because query can't start with "~" or "+" (i.e. :scope ~ something is not valid);
//             to reset query back to looped item, when a REFERENCE_# keyword is also used, or useReference changed the reference.
//    DOCUMENT is useful to query a selector on the whole `document`, as normally query would start on looped item.
//    There can be multiple keywords present within one selector. If at least one keyword is used, a query would not start on the reference,
//    but on the `document`. e.g. selector to target <p> which is a child of looped element: `p`,
//    but to target a <p> which is a child of REFERENCE_1, within the looped element: `LOOPITEM REFERENCE_1 p`
//
//  All caps words are to be replaced as needed. camel style names are fixed
var SITES_DOC = {
	SITE_MASK: {       /* <part of a domain> (e.g. instagram, instagram.com, www.instagram.com; partial or identical,	                         two sitemasks targeting the same page are possible) */
		css: ``,       // CSS to add to page using function addCSS()
		loop: [{       /* special optional property. ACTION can be performed on each iteration specified here (e.g. on all <video> elements) */
			id: 0,     /* optional id. useful if there are multiple loops and not all JOBs are to be performed in all loops */
			loopOverTagName: 'video',  // there can be only one loop* property. Others would be ignored.

			setReferenceElementBy___: '', // where "___" is one of those below
				
				// setReferenceElementBy<tagName|...>_0 // not developed for now

			setReferenceElementByRelativeToLoopItem_1: 'nextElementSibling',
			setReferenceElementByCssPath_2: 'CSS PATH' // only first target found by the query is used
														// does not use ref from useReference. Query always starts on `document`
		}],
		ACTION: [      /* a set of actions to be performed. Either once per site, or per certain elements within a loop.
						  executed by `modPage(actions.unmute, elVideo, refData, loopID);` */
			{ /* JOB is an object within ACTION array */
				'#_ARBITRARY_PROPERTY_NAME': 'a comment which is seen in debugger, will not fail in JSON and is not discarded by minifier. "#" is not required, but will make it obvious to reviewer this is a comment',
				debug: true, // to have debugger stop on this item

				setReferenceElementBy___: '', // see description in `loop` job

				//// complement - reference
				useReference: 'reference_1',  // 'document'|'reference_<NUMBER>'; when useReference is not present, looped element is used.
												// Can be used only once in one job and the position within job does not matter.
												// setReferenceElementBy___ will use useReference with value "reference_*", only if that numbered reference was set in loop action block.
												// If used in loop job, it only makes sense to set it to `document`.


				//// complement - wait
				waitForElOnParentCssPath: 'CSS PATH',  // will wait until element is present when searched by: setReferenceElementByCssPath_*, ifPropExists, cssPath
												  // now it will observe and run resolve once. (unmute need once) Can add option to run forever.
												  // now it can not be used in loop action block


				//// conditionals
				//   Optional. If a conditional fails, actors don't act. Some can be waited upon. Search will start on the reference, if reference was not set, on `document`.
				ifCssPath: 'CSS PATH', // can be waited upon
				ifPropExists: 'NAME_OF_ELEMENT_PROPERTY',  // must be used with useReference; todo possibility to implement wait upon
				ifAttr: 'ATTRIBUTE_WITH_EQUAL_SIGN', // todo not tested for attr without value yet, but should work (e.g. 'myattr="something"' or 'myattr')
				ifLoopID: 0, // ignore this job if it's not called from loop with this ID


				//// designators
				//   One and only one designator must be used. Search will start on the reference, if reference was not set, on `document`.
				//   todo: the possibility to use multiple additive designators can be implemented if there is a need for it
				cssPath: '',  // it will select only elements below the reference. With no reference used, the whole `document`.
				tagName: '',
				relativeToRef: 'nextElementSibling',         // must be used with useReference
						  // 'nextElementSibling': next Element Sibling from the reference
						  // 'this':               the element from reference
						  // 'directChildren':     direct Children

				//// actors
				//   At least one actor must be used. Actors always act on elements retrieved by a designator. They never use reference.
				setCSSProperties: 'display: none;',
				getCSSProperty: 'width',
				click: ''           // all elements found by designators are clicked. This might be not desirable
			}
		]
	}
};

var sites = {
	'tiktok.com': {
		css: `
			body > tiktok-cookie-banner {
				display: none;
			}
			#pns-communication-service {
				display: none;
			}
			article[id] > [class*="--DivContentFlexLayout"] {
				position: relative;
				left: 321px;
				left: 266px;
				button {
					opacity: 1;
				}
			}
		`,
		loop: [{
				id: 0,
				loopOverTagName: 'video',
				// top parent of an entry
				useReference: 'document',
				setReferenceElementByCssPath_1: 'article[id]'
			}],
		hidePageOverlays: [
			// in anonymous: solve puzzle
			{
				cssPath: 'body > [data-floating-ui-portal]:has(> .TUXModal-overlay)',
				setCSSProperties: 'display: none;'	
			},
			// cookies, the orig applies the cookies dialog multiple times, this does not help, hiding them in CSS above instead
			// {
			// 	waitForElOnParentCssPath: 'body',
			// 	cssPath: 'body > tiktok-cookie-banner',
			// 	setCSSProperties: 'display: none;'	
			// }
			//// todo: it would be nice to have an Option here, some might want to see stuff tictac wants to say
			{
				// debug: true,
				cssPath: '#pns-communication-service',
				setCSSProperties: 'display: none;'	
			}
		],
		// on tiktok unmuting takes a long time. Because now this whole script runs multiple times, can not just check video.muted.
		// TODO need check if it's muted. now it toggles on off on off		
		unmute_X: [{
				// debug: true,
				ifPropExists: 'muted',
				// waitForElOnParentCssPath: '',
				cssPath: 'REFERENCE_1 [class*="-DivVolumeControlContainer"] button',
				click: true
		}],
		unmute: [{
			// css-1dlb4zs-7937d88b--BasePlayerContainer-7937d88b--DivVideoPlayerContainer e1reenm13
			// [class*="--BasePlayerContainer-"] [class*="--DivVideoPlayerContainer"]
				// debug: true,
				waitForElOnParentCssPath: 'REFERENCE_1 [class*="--DivVideoPlayerContainer"]',
				setReferenceElementByCssPath_2: 'REFERENCE_1 [class*="-DivVolumeControlContainer"] button',
				useReference: 'reference_2',
				ifAttr: 'aria-pressed="false"',
				relativeToRef: 'this',
				click: true
		}],
		moveOverlays: [
			{
				// debug: true,
				useReference: 'reference_1',
				// waiting for the same el as in unmute
				waitForElOnParentCssPath: '[class*="--DivVideoPlayerContainer"]',
				cssPath: '[class*="--DivMediaCardOverlay "] > *, [class$="--DivMediaCardOverlay"] > *',
				setCSSProperties: 'left: -500px; position: relative; pointer-events: all;'
			},
			// remove overlay
			{
				// debug: true,
				useReference: 'reference_1',
				// waiting for the same el as in unmute
				waitForElOnParentCssPath: '[class*="--DivVideoPlayerContainer"]',
				cssPath: '[class*="--DivMediaCardOverlay "], [class$="--DivMediaCardOverlay"]',
				setCSSProperties: 'pointer-events: none;'
			},
			// always visible top bar; this does nothing, one in css above works
			{
				debug: true,
				waitForElOnParentCssPath: 'REFERENCE_1 [class*="--DivVideoPlayerContainer"]',
				setReferenceElementByCssPath_2: 'REFERENCE_1 [class*="-DivVolumeControlContainer"] button',
				useReference: 'reference_2',
				relativeToRef: 'this',
				setCSSProperties: 'opacity: 1;'
			}]
	},
	instagram: {
		loop: [{
				id: 0,
				loopOverTagName: 'video'
			}],
		hidePageOverlays: [
			// in anonymous: sign-in/login-in dialog. redundancy alternative.
			{
				'#': 'Blocking dialog. e.g. "Never miss a post..."',
				debug: true,
				cssPath: 'main > div:has([href="/accounts/emailsignup/"]), main > div:has([role="dialog"])',
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
			// debug: true,
			relativeToRef: 'nextElementSibling',
			setCSSProperties: 'display: none;'
		}]
	},
	// A: player for signed-in user
	// B: player for anonymous, when not signed-in
	facebook: {
		loop: [{
				id: 0, // [String/Number] as there can be multiple loops, actions should have a way to identify which loop is processing

				// loopOverTagName
				// loopOver<TagName|...> is used to create an Array to loop over, providing iterator's value with `loopItem`
				loopOverTagName: 'video',
				setReferenceElementByRelativeToLoopItem_1: 'nextElementSibling'

				// just for DEBUG
				, setReferenceElementByRelativeToLoopItem_22: 'nextElementSibling'
				, setReferenceElementByRelativeToLoopItem_2: 'nextElementSibling'
				, setReferenceElementByRelativeToLoopItem_0: 'nextElementSibling'
				, setReferenceElementByRelativeToLoopItem_02: 'nextElementSibling'
			}],
		// action is not called from loop, ref is `document`
		hidePageOverlays: [{
			// B
				cssPath: '#scrollview ~ *', // login/register dialog
				setCSSProperties: 'display: none;'
			},
			// B. cookies. sometimes is right after <div id="mount_0_0_Iq"> ,sometimes after #has-finished-comet-page
			{
				'#': 'cookies dialog, ADs, possibly other stuff',
				// debug: true,
				cssPath: 'body > div[id] ~ div',
				setCSSProperties: 'display: none;'
			}],

		// just DEBUG the REFERENCE
		// hideVideoOverlays: [{
		// 		debug: 'test1',
		// 		ifCssPath: 'REFERENCE_22 [data-pagelet="Reels"] REFERENCE_2, REFERENCE_0+REFERENCE_02', // is only on B
		// 	},
		// 	{
		// 		debug: 'test2',
		// 		cssPath: 'REFERENCE_22 [data-pagelet="Reels"] REFERENCE_2, REFERENCE_0+REFERENCE_02', // is only on B
		// 	}],

		hideVideoOverlays_: [{
				// B only. must not act on A, ifCssPath value below is present only on B
				ifCssPath: 'DOCUMENT [data-pagelet="Reels"]', // is only on B
				relativeToRef: 'nextElementSibling',
				setCSSProperties: 'display: none;'
			}],
		// useReference is used for ifPropExists, but also for cssPath to get and unmute only one video
		unmute: [{
				// A (LOOPITEM ~ div button not on A, is it B?)
				ifPropExists: 'muted',
				// or also 'LOOPITEM ~ div > div'
				waitForElOnParentCssPath: 'LOOPITEM ~ div [data-visualcompletion]',
				cssPath: 'LOOPITEM ~ div [aria-label="Unmute"][role="button"], LOOPITEM ~ div button',
				click: true
			},

			//// just debug
			// {
			// 	debug: 'test3',
			// 	ifCssPath: 'LOOPITEM [data-pagelet="Reels"]', // is only on B
			// 	cssPath: 'LOOPITEM ~ div [aria-label="Unmute"][role="button"], LOOPITEM ~ div button'
			// },

			{
				// B, but A too. todo does it matter? prop muted is check, should not click if still muted
				ifPropExists: 'muted',
				cssPath: 'DOCUMENT [aria-label="Unmute"]',
				click: true
			}],
			// warn: this would be wrong on a page with multiple <video>
			//       there should be loopItem or some REFERENCE within these selectors or `useReference`` used
			//       also get and set "left" for only that video
		moveOverlays: [
			// {
				// tagName: '',
				// getCSSProperty: 'width'
			// },
			// --- B. (and below) ---
			{
				// bottom overlay, top overlay
				useReference: 'document',
				cssPath: '[data-pagelet="Reels"] + div > div, [data-pagelet="Reels"] ~ div:last-child',
				// this should be taken from width
				setCSSProperties: 'left: -460px;'
			},
			// B. allow clicking through this moved element, to reach "prev" button, but allow all its smaller children (one below)
			{
				useReference: 'document',
				cssPath: '[data-pagelet="Reels"] + div > div',
				setCSSProperties: 'pointer-events: none;'
			},
			// B. see above
			{
				useReference: 'document',
				cssPath: '[data-pagelet="Reels"] + div > div > *',
// this should be taken from <video> width
				setCSSProperties: 'pointer-events: all;'
			},
			// B. moved text will not be visible without this; 251228 "Card" changed to "card"
			{
				useReference: 'document',
				cssPath: ':is([aria-label="Previous Card"], [aria-label="Previous card"]) + div > div',
				setCSSProperties: 'overflow: visible'
			},
			// B.
			// click on "See more". It's not always present
			{
				useReference: 'document',
				ifCssPath: '[data-pagelet="Reels"] + div:not(:has([style*="--x-maxHeight:"]))',
				cssPath: '[data-pagelet="Reels"] + div [role="button"]:not(:has(> *))',
				click: true
			},

			// --- A. (and below) --- todo: limit to A
			{
				// debug: true,
				useReference: 'document',
				// can't use ifCssPath, it would "find" such el. on next video. the selector must contain LOOPITEM to be limited to current
				// ifCssPath: '[data-video-id]:not([style*="width: 1024px"])',
				cssPath: '[data-video-id]:not([style*="width: 1024px"]) LOOPITEM + div > div',
				setCSSProperties: 'left: -450px;'
			},
			{
				useReference: 'document',
				cssPath: '[role="banner"] + div div:has([role="main"]), [data-video-id]',
				setCSSProperties: 'overflow: visible'
			},
			// move JS slider over the HTML5 slider. JS slider does have thumbnail, which is a nice feature to preserve
			{
				// debug: true,
				useReference: 'document',
				waitForElOnParentCssPath: '[data-video-id] + div',
				cssPath: '[role="slider"]',
				setCSSProperties: 'top: -20px;'
			},
			// click on "See more". It's not always present
			{
				waitForElOnParentCssPath: 'LOOPITEM ~ div > [data-visualcompletion]',
				setReferenceElementByCssPath_1: 'LOOPITEM + div div:has(> [role="button"]):not(:has(> [role="button"] > *))',
				useReference: 'reference_1',
				ifTextIncludes: '…',
				// cssPath: 'LOOPITEM + div [role="button"]:not(:has(> *))',
				relativeToRef: 'directChildren',
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


var DEBUG, LOG;
var debugRunCnt = 0;
if (LOG) { console.log('[Normal video player] START'); }


var config = {
	hideMasthead: new Option('hideMasthead','Hide masthead').value
};

function modPage(jobs, loopItem, refData, loopID) {
	if (!jobs?.length) { if (LOG) { console.log('[Normal video player] this action is not defined'); } return false; }
		// sites[domainKey][type]?.forEach(job => {
	jobs.forEach(modJob); // note! if this will be changed to `for...of`, have to change `return` to `continue` inside

	function modJob(job, obsrvs) {
		if (!(obsrvs instanceof Array)) { obsrvs = null; } // remove index (when called from forEach())
		var arrEl;

		// if (LOG) { console.log('[Normal video player] ****** job:', job); }
		if (LOG) { /*console.groupEnd();*/ console.group('[Normal video player] job:', job); }
		if (DEBUG == 2) { debugger; }
		if (DEBUG == 3 && job.waitForElOnParentCssPath) { debugger; }
		// if (DEBUG && job.debug) { debugger; }
		if (DEBUG && DEBUG != 4 && job.debug === true) { debugger; }

		/// complement - reference
		// process useReference and setReferenceElementBy_* entries within a job
		var elRef = processRefs(job, loopItem, refData, obsrvs, modJob);
		// Node: `document` is not Element
		if (!(elRef instanceof Node)) { console.groupEnd(); return; }


		//// conditional
		var condition = true;
		// var waitableMissing = false; // something that can be waited upon by observer
		// TEST replace placeholder like in cssPath, make it a function and call it from here
		if (job.ifCssPath) {
			const {query, elRefOnce} = replaceRef(job.ifCssPath, elRef, loopItem, refData);
			let elPresent = elRefOnce.querySelector(':scope :is(' + query + ')');
			condition &&= elPresent;  // jshint ignore:line
			// if (!elPresent && (obsrvs?.length || !waitForMutation(job, elRef, loopItem, refData))) { return; } // if is there something to wait upon
			if (!elPresent) {
				if (!obsrvs?.length) {
					if (!waitForMutation(job, elRef, loopItem, refData, modJob)) { // has observers which can be set up
						if (LOG) { console.log('[Normal video player] %cifCssPath not present', 'color: orange', job, 'loopItem:',loopItem, 'refData', refData, 'loopID:', loopID); }
					}
				}
				console.groupEnd();
				return;
			}
		}
		if (job.ifPropExists) { condition &&= elRef[job.ifPropExists]; }  // jshint ignore:line
		if (job.ifAttr) {
			let [prop, val] = job.ifAttr.split('=');
			if (val === undefined) { val = ''; } // for attr without value. todo: test
			if ((val[0] === '"' && val[val.length - 1] === '"') || (val[0] === "'" && val[val.length - 1] === "'")) {
				val = val.substring(1, val.length - 1);
			}
			condition &&= elRef.getAttribute(prop) === val; // jshint ignore:line
		}
		
		if (job.ifTextIncludes) { condition &&= elRef.textContent.includes(job.ifTextIncludes); } // jshint ignore:line


		//// designators
		if (job.cssPath) {
			const {query, elRefOnce} = replaceRef(job.cssPath, elRef, loopItem, refData);
			arrEl = Array.from(elRefOnce.querySelectorAll(':scope :is(' + query + ')'));
		}
		if (job.tagName) {
			arrEl = Array.from(elRef.getElementsByTagName(job.tagName));
		}
		if (job.relativeToRef) {
			switch (job.relativeToRef) {
			  case 'this':
				arrEl = [elRef];
				break;
			  case 'nextElementSibling':
				arrEl = [elRef.nextElementSibling];
				break;
			  case 'directChildren':
				arrEl = Array.from(elRef.children);
				break;
			  default:
				console.error('[Normal video player] wrong value of designator: ' + job.relativeToRef, job);
				break;
			}
		}


		//// wait
		// no designators found but a wait complement defined and this is not already run from observer -> observe
		// currently observers are set up even when `condition` above are not met (false), when waited el appear conditions are checked again
		// if ((!arrEl?.length || waitableMissing) && job.waitForElOnParentCssPath && !waitedArrived) {
		// if (!arrEl?.length && job.waitForElOnParentCssPath && !waitedArrived) {
		// why, no, there is nothing useful waitForMutation can return
		// waitForMutation() returns false if it can't find observer points and there is nothing to wait for
		if (!arrEl?.length) {
			if (!obsrvs?.length) {
				if (!waitForMutation(job, elRef, loopItem, refData, modJob)) { // has observers which can be set up

					/// LOG target el not found
					// if LOG: This is not error in production condition, as there could be a job which does not always have work.
					// todo: can not show domain key and type anymore here. try add something more useful to log msg
					if (LOG) { console.log('[Normal video player] %ctarget not found by any designator', 'color:red', job, 'loopItem:',/*loopItem,*/ 'refData', refData, 'loopID:', loopID); } // XXXX loopItem is El. does it matter in this console.log? yes, disabling
				}
			}
			console.groupEnd();
			return;
		}
		// before `if (!condition)` as that's not waited upon. no need to observe anymore
		obsrvs?.forEach(o => o.disconnect());


		//// actors
		if (!condition) { console.groupEnd(); return; } // to next job
		if (!arrEl?.forEach) debugger;
		arrEl?.forEach(el => {
			if (job.setCSSProperties) {
				el.style.cssText = el.style.cssText + job.setCSSProperties;
			}
			if (job.click) {
				// debugger;
				console.log('[Normal video player]cl: click() | aria-pressed before click(): ' + el.getAttribute('aria-pressed') + ` | video muted: ${loopItem.muted}`, performance.now());
				el.click();
		//// debug. tiktok only, found that muted property does not immediately follow svg icon state
				// debugClick();
				function debugClick() {
					console.log('[Normal video player]cl: click() after | aria-pressed before click(): ' + el.getAttribute('aria-pressed') + ` | video muted: ${loopItem.muted}`, performance.now());
					performance.mark('click');
					// debugger;
					new MutationObserver(mutations => {
						mutations.forEach(mut => {
							// debugger;
							if (mut.attributeName === 'aria-pressed') {
								console.log('[Normal video player]cl: aria-pressed(= not muted): ' + el.getAttribute('aria-pressed') + ` | video muted: ${loopItem.muted}`, performance.now());
								performance.mark('aria-pressed', {
								  detail: { pressed: el.getAttribute('aria-pressed') },
								});
							}
						});

					}).observe(el, {
						attributes: true
					});
					new MutationObserver(mutations => {
						mutations.forEach(mut => {
							debugger;
							// aria-pressed="true"
						});

					}).observe(loopItem, {
						attributes: true
					});
					// <svg>
					new MutationObserver(mutations => {
						mutations.forEach(mut => {
							// debugger;
							console.log('[Normal video player]cl: changing SVG | aria-pressed(= not muted): ' + el.getAttribute('aria-pressed') + ` | video muted: ${loopItem.muted}`, performance.now());
						});

					}).observe(el.querySelector('svg').parentNode, {
						childList: true,
					  subtree: true,
					});
					
					setInterval((el) => {
					}, 100);
					setTimeout(() => {
						const loginMeasure = performance.measure(
						'click',
						'aria-pressed',
						);
						console.log(loginMeasure.duration);
					}, 5000);
		////
				}
			}
			if (LOG) { console.log('[Normal video player] actors were executed on element:', 'XXXX', 'job:', job, 'loopItem:','XXXX', 'refData', refData, 'loopID:', loopID); }
			// if (LOG) { console.info('[Normal video player] actors were executed on element:', el, 'job:', job, 'loopItem:',loopItem, 'refData', refData, 'loopID:', loopID); }
		});
		// old comment, when disconnect was here
		// or only remove when observer when the target arrEl was found? but when the observed el was found but did not have arrEl,
		// what else is there to wait for?
		// Another point, Maybe there will be an option to not remove the observer, it might be the observed el keeps disappearing and job on arrEl should be repeatedly done.
		// if (arrEl?.length) { obs?.disconnect(); if (LOG) { console.log('[Normal video player] observer disconnected (removed)'); }}
		console.groupEnd();
	} // modJob
}

// return: all waitFor* must find at least one element or waitForMutation() will return false
function waitForMutation(job, elRef, loopItem, refData, handler) {
	var observers = [];
	for (const par in job) {
		switch (par) {
		  case 'waitForElOnParentCssPath':

			const {query, elRefOnce} = replaceRef(job.waitForElOnParentCssPath, elRef, loopItem, refData);
			const arrToObserve = Array.from(elRefOnce.querySelectorAll(':scope :is(' + query + ')'));
			if (!arrToObserve.length) {
				console.error('[Normal video player] Element to observe not found in job:', job);
				return false;
			}
			arrToObserve.forEach( elObserveOn => {
				var thisObserver = new MutationObserver(mutations => {
					if (DEBUG == 4) { debugger; }
					for (const mut of mutations) {
						if (LOG) { console.log('[Normal video player] observer processing mutation out of ' + mutations.length, mut); }
						if (mut.addedNodes.length === 0) { continue; } // looking for added only now, not removed/changed
						for (const node of mut.addedNodes) {
							if (!(node instanceof Element)) { continue; } // Processing a #Text node will error
							if (node instanceof HTMLStyleElement) { continue; }
							if (LOG) { console.log('[Normal video player] observer runs modJob(job, obsrvs)'); }
							handler(job, observers); // need all observers for this job, so they all can be disconnected
							return; // from observer event
						}
					}
				});
				// can not chain to the `new MutationObserver` as `thisObserver` is needed later and `.observe` does not return it
				thisObserver.observe(elObserveOn, {
					// subtree: true, // now observing just additions on one target
					childList: true
				});
				observers.push(thisObserver);
				if (LOG) { console.debug('[Normal video player] observer set on', 'XXXX', job/*, loopID*/); }
				// if (LOG) { console.debug('[Normal video player] observer set on', elObserveOn, job/*, loopID*/); }
			});
			break;
		} // switch
	} // for (const par in job) {
	if (observers.length) { return observers; // observers from return is not used now, can just return true
	} else { return false; }
}


/**
 * Checks `query` for reference keywords, replaces them with a classname, creates that classname on referenced element (if there is not one already) and sets elRefOnce to `document` in case any reference was replaced.
 * @method replaceRef
 * @param  {String}   query    A CSS query possibly with some keywords
 * @param  {Element}  elRef    Element returned in elRefOnce, if no substitution was done by this function.
 *                             It was obtained from useReference, or set to `document` if useReference was not defined before
 * @param  {Element}  loopItem Element of the current loop used to replace keyword LOOPITEM
 * @param  {Object}   refData  A table with reference names and real Elements they reference
 * @return {Object}            {query: modified query which can be used to find Elements,
 *                              elRefOnce: elRef or `document` if any replacement was done}
 */
function replaceRef(query, elRef, loopItem, refData) {
	var elRefOnce = elRef;
	switch (true) {
	  case query.includes('REFERENCE_'): // REFERENCE_<NUMBER>
		elRefOnce = document;
		// could be multiple times and with multiple different refs
		const rand = Math.floor(Math.random() * 1000000);
		// we know all possible references from refData. but maybe regexp is easier as it will do only used keys and all in one loop
		// refData.keys().forEach(key => query = query.replaceAll('REFERENCE_' + key, (match, p1, offset, string, groups) => {
		query = query.replaceAll(/REFERENCE_(\d+)/g, (match, p1, offset, string, groups) => {
			// find a class starting `reference-${p1}-normal-player-` and use that instead of adding a new one
			let randClass = Array.from(refData[p1].classList).find(cls => cls.startsWith(`reference-${p1}-normal-player-`));
			if (!randClass) {
				randClass = `reference-${p1}-normal-player-${rand}`;
				refData[p1].classList.add(randClass);
			}
			return '.' + randClass;
		});
		break;
	  case query.includes('LOOPITEM'):
		elRefOnce = document;
		let randClass = Array.from(loopItem.classList).find(cls => cls.startsWith('loopitem-normal-player-'));
		if (!randClass) {
			randClass = 'loopitem-normal-player-' + Math.floor(Math.random() * 1000000);
			loopItem.classList.add(randClass);
		}
		query = query.replaceAll('LOOPITEM', '.' + randClass);
		break;
	  case query.includes('DOCUMENT'):
		elRefOnce = document;
		query = query.replaceAll('DOCUMENT', ''); // not trying to remove a possible space at the end
		// this case was never tested
		break;
	}
	return {query, elRefOnce};
}

// process setReferenceElementBy_* entries within a job
// refData: output

/**
 * Finds all directives setReferenceElementBy*_NUMBER in `job` and resolve to a HTMLElement. Adds it to refData under NUMBER as a key.
 * If not called from an observer (obsrvs in null), check if job contains any wait* directives by waitForMutation() (which will also register an observer)
 * @method processRefs
 * @param  {Object}    job            [description]
 * @param  {Element}   currentElement Currently looped HTMLElement
 * @param  {Object}    refData        Object with references of key - HTMLElement associations
 * @param  {Array}     obsrvs         Array of Observers. Only to check if some were already registered.
 * @return {Element|Boolean}          Element from useReference, or `currentElement` if not used. false: failure to find; true: will wait
 */
function processRefs(job, currentElement, refData, obsrvs, handler) {
	var elRef = currentElement;

	// before new references are added by setReferenceElementBy*
	if (job.useReference) {
		// if (job.useReference.toLowerCase() === 'loopitem') { elRef = loopItem; // when document was default
		if (job.useReference.toLowerCase() === 'document') { elRef = document;
		} else if (job.useReference.toLowerCase().startsWith('reference_')) {
			const number = job.useReference.substring(10);
			elRef = refData[number] || elRef;
		}
	}

	for (const param in job) {
		if (!param.startsWith('setReferenceElementBy')) { continue; }
		const arPar = param.split('_');
		if (!arPar[1]) { console.error('[Normal video player] setReferenceElementBy* missing number'); continue; }
		switch (arPar[0]) {
		  case 'setReferenceElementByRelativeToLoopItem':
			switch (job[param]) {
			  case 'nextElementSibling':
				refData[arPar[1]] = currentElement.nextElementSibling;
				break;
			  default:
				console.error('[Normal video player] wrong value of designator: ' + job[param], job);
				break;
			}
			break;
		  case 'setReferenceElementByCssPath':
			const {query, elRefOnce} = replaceRef(job[param], elRef, currentElement, refData);
			// before: setReferenceElementBy* never uses elRef, so elRefOnce is unused too, query starts from `document`
			// const {query} = replaceRef(job[param], currentElement, currentElement, refData);
			// write to `refData[arPar[1]]` even when `null` to overwrite old value
			refData[arPar[1]] = elRefOnce.querySelector(':scope :is(' + query + ')');
			if (!refData[arPar[1]]) {
				if (!obsrvs || !obsrvs.length) {
					if (!waitForMutation(job, document, currentElement, refData, handler)) { // has observers which can be set up
						console.error('[Normal video player] setReferenceElementByCssPath failed to find an Element: ' + job[param], job);
						// if (LOG) { console.log('[Normal video player] %c' + param + ' not present', 'color: red', job, 'currentElement:',currentElement, 'refData', refData/*, 'loopID:', loopID*/); }
						return false;
					}
				}
				// will be waiting
				return true;
			}
			break;
		}
	}

	// after new references are added by setReferenceElementBy*, also rewrite those found before
	if (job.useReference) {
		if (job.useReference.toLowerCase().startsWith('reference_')) {
			const number = job.useReference.substring(10);
			elRef = refData[number];
			if (!elRef) {
				console.error(`[Normal video player] ${job.useReference} not present, in job:`, job);
				return false;
			}
		}
	}

	return elRef;
}

function addCSS(strCss) {
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = strCss;
	document.head.appendChild(style);
}

// id: none, number or Array of numbers
function loop(actions, handler, id) {
	if (!actions.loop?.length) { return null; }
}

function action() {
	if (LOG || DEBUG) { debugRunCnt++; }
	// when debugging, run just once on:
	if (DEBUG && debugRunCnt !== 2) { return; } // debug 2nd run. after 1sec
	// if (DEBUG && debugRunCnt !== 3) { return; }
	// if (DEBUG && debugRunCnt !== 4) { return; }
	// if (DEBUG && debugRunCnt !== 1) { return; } // debug 1st run (might be too soon to debug most of situations)

	if (LOG) { console.log('[Normal video player] START action() run for the ' + debugRunCnt + ' time'); }
	var fixesDone = 0;
	var isVideoPresent = false;

	// domainKeys: array of sites matching the current URL
	var domainKeys = Object.keys(sites).filter(key => window.location.hostname.includes(key));
	domainKeys?.forEach(domainKey => {
		var actions = sites[domainKey];
		addCSS(actions.css);
		modPage(actions.hidePageOverlays, document);

// todo will separate the loop code in its function, so that action() can just call it with some params and callback
// debugger;
// loop(actions, par => {
// }, 0);

		for (const propLoop of actions.loop) { // this makes loop property mandatory now, but it will not be when changed to above function
			let loopItems;
			const loopID = propLoop.id;

			/// loops; first and separate must process "loop over", as the "references" are dependent on iteration of the loop
			// get one of possible loop*, e.g. actions.loop?.loopOverTagName, then iterate that.
			findLoopItems: for (const par in propLoop) {
				switch (par) {
				  case 'loopOverTagName':
					// loopItems = Array.from(document.getElementsByTagName('video'));
					loopItems = Array.from(document.getElementsByTagName(propLoop[par]));
					break findLoopItems;
				}
			}

			/* -- process all <video> tags -- */
			/* note: for an empty Array, this block will not run */
			for (let elVideo of loopItems) {
				let refData = {};

				//// read setReferenceElementBy*_# from loop property, set to refData object
				// this is done again for every iteration of loop, as setReferenceElementBy*_# can use iterated element as reference
				processRefs(propLoop, elVideo, refData, action); 
				// adding action here as handler, will this re-run OK in case wait is in loop? would need some exit from the bad run

				isVideoPresent = true;
				// if (LOG) { console.log('[Normal video player] START forEach() on video: ', elVideo); }
				// if (DEBUG) { debugger; }

				// if (LOG) { console.log('[Normal video player] elVideo.getAttribute(\'controls\'): ', elVideo.getAttribute('controls')); }
				// null/""; "" means it's present
				if (elVideo.getAttribute('controls') === null) {
					elVideo.setAttribute('controls','');
					fixesDone++;
					if (LOG) { console.log('[Normal video player] fix: added "controls" to video element'); }
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
					modPage(actions.unmute, elVideo, refData, loopID);
				}

				// rewind if it's stopped after unmute and not at beginning
				const isVideoPlaying = elV => !!(elV.currentTime > 0 && !elV.paused && !elV.ended && elV.readyState > 2);
				// const isVideoPlaying_ = (!!(elVideo.currentTime > 0 && !elVideo.paused && !elVideo.ended && elVideo.readyState > 2));
				// queueMicrotask: elVideo.paused is not true at this point, even when video is paused. I think I saw it working before.
				queueMicrotask(() => {
					if (!isVideoPlaying(elVideo) && elVideo.currentTime > 0) {
						elVideo.currentTime = 0;
						fixesDone++;
						if (LOG) { console.log('[Normal video player] fix: rewind'); }
					}
				});

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

				modPage(actions.hideVideoOverlays, elVideo, refData, loopID);
				modPage(actions.moveOverlays, elVideo, refData, loopID);
			}; // END: for (elVideo of loopItems) {
		} // for (const propLoop of actions.loop) {

		if (config.hideMasthead) {
			modPage(actions.hideMasthead, document);
		}
	}); // domainKeys?.forEach(domainKey => {


	if (LOG) { console.log('[Normal video player] isVideoPresent: ', isVideoPresent, 'fixesDone: ', fixesDone); }
	if (isVideoPresent && fixesDone === 0) {
		if (LOG) { console.log('[Normal video player] clearInterval(intTimer): ', intTimer); }
		clearInterval(intTimer);
	}
} // function action() {


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
