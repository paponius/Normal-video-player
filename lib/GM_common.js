/* 
   GM specific setup file. To allow for other files in a project to be used without GM.
   GM scripts are all packed within one function. `'use strict';` is the first directive in it.
   Variables will have scope shared by all other included files.
 */
'use strict';

var LOG, DEBUG;
(function() {
	var prevDebug, prevLog;
	if (typeof unsafeWindow !== 'undefined') { prevDebug = unsafeWindow.DEBUG; prevLog = unsafeWindow.LOG;
	} else { prevDebug = window.DEBUG; prevLog = window.LOG; }

	DEBUG = prevDebug || (GM.info.script.name.indexOf('DEBUG') !== -1 ) ? -1 : false;
	// optional line
	DEBUG = ( GM && GM.info.script.name.split('DEBUG:')[1]?.substring(0,1)) || DEBUG;
	LOG = prevLog || DEBUG || (GM_info.script.name.includes('LOG'));
})();
if (DEBUG == 's') { debugger; } // stop at beginning
