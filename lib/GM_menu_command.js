/**
 * An interface to GreaseMonkey command menu.
 * Just a first version
 *
 */

class Option {
	idGMCommandONOFF;
	constructor (opt, label) {
		// or, select storage based on an argument
 		// but localStorage is cleared regularly on many sites
		// var storedValue = localStorage.getItem(opt);
		var storedValue = GM_getValue(opt);
		// I don't care about CASE, as this script is setting the 'true;/'false' and always low caps
		// storedValue is null if it does not exist yet
		// todo probably OK to use _value in 3 cases below
		// localStorage returns String, GM returns Boolean
		// in JS, this would not work for storedValue=true: if (storedValue == 'true') {... https://stackoverflow.com/a/4923684/3273963
		if (storedValue === 'true' || storedValue === true) {
			this._value = true;
		} else if (storedValue === 'false' || storedValue === false) {
			this._value = false;
		// also a wrong value
		} else { this._value = null; }
		this.opt = opt;
		this.label = label;
		this.reRegisterGMMenuCommand();
	}

	get value() {
		return this._value;
	}
	set value(value) {
		this._value = value;
		this.reRegisterGMMenuCommand();
		// localStorage.setItem(this.opt, this._value);
		GM_setValue(this.opt, this._value);
	}
	switchValue() {
		this.value = !this.value; // todo _value or value
		// if (this.value) {
		// 	this.value = false;
		// } else {
		// 	this.value = true;
		// }
	}

	reRegisterGMMenuCommand() {
		// re-add in any case
		if (this.idGMCommandONOFF) {
			GM_unregisterMenuCommand(this.idGMCommandONOFF);
			console.log('step');
		}
		var txtState;
		if (this._value === true) {  // todo _value or value
			txtState = 'ON';
		} else if (this._value === false) { // todo _value or value
			txtState = 'OFF';
		} else { txtState = 'OFF (initial)'; }
		this.idGMCommandONOFF = GM_registerMenuCommand(this.label + ' [' + txtState + ']', event => {
			this.switchValue();
		}, {
			accessKey: "d",
			// autoClose: false, // true as the menu does not appear while the menu is open
			title: 'on-off'
		});
	}
}
