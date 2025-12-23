(function() {
    'use strict';
    var LOG = (GM_info.script.name.includes('LOG'));
    var DEBUG = (GM_info.script.name.includes('DEBUG'));
    var debugRunCnt = 0;
    if (LOG) { console.log('Normal video player | START'); }

    // key: part of a domain; e.g. instagram, instagram.com, www.instagram.com; partial or identical duplicated are possible
    var sites = {
        instagram: {
            pageOverlays: {
                cssPath: ['main > div:has([href="/accounts/emailsignup/"]']
            }
        },
        facebook: {
            pageOverlays: {
                cssPath: ['#scrollview ~ *'] // login/register dialog
            }
        }
    };
    function hideOverlays() {
        Object.keys(sites).filter(domainKey => window.location.hostname.includes(domainKey)).forEach(domainKey => {
            sites[domainKey].pageOverlays.cssPath.forEach(cssPath => {
                Array.from(document.querySelectorAll(cssPath)).forEach(el => {
                    el.style.display = 'none';
                });
            });
        });
    }

    function action() {
        if (LOG) { console.log('Normal video player | START action()'); }
        if (DEBUG && ++debugRunCnt === 1) { debugger; }
        var fixesDone = 0;
        var isVideoPresent = false;

        // hideOverlays();

        /* -- process all <video> tags -- */
        /* note: for an empty Array, this block will not run */
        Array.from(document.getElementsByTagName('video')).forEach(elVideo => {
            isVideoPresent = true;
            // if (LOG) { console.log('Normal video player | START forEach() on video: ', elVideo); }
            if (DEBUG) { debugger; }
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

            // rewind if it's stopped after unmute and not at beginning
            const isVideoPlaying = elV => !!(elV.currentTime > 0 && !elV.paused && !elV.ended && elV.readyState > 2);
            // const isVideoPlaying_ = (!!(elVideo.currentTime > 0 && !elVideo.paused && !elVideo.ended && elVideo.readyState > 2));
            if (!isVideoPlaying(elVideo) && elVideo.currentTime > 0) {
                elVideo.currentTime = 0;
                fixesDone++;
                if (LOG) { console.log('Normal video player | fix: rewind'); }
            }

            // hide video overlays
            // todo: detto as above
            elVideo.nextElementSibling.style.display = 'none';
            /* todo if site changes and the above is not enough, to disable all siblings or get another el,
               - elVideo.parentElement.children.forEach(elCh => {
                   elCh.style.display = 'none';
                 });
               OR
               - new querySelectorAll with `video ~ *`
             */
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
