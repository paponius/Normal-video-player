/**
 * An interface to GreaseMonkey command menu.
 * Just a first version
 */

class Option {
	idGMCommandONOFF;
	constructor (opt, label) {
		// change this to GM storage, so it will not be per tab. or, select storage based on an argument
		var storedValue = localStorage.getItem(opt);
		// I don't care about CASE, as this script is setting the 'true;/'false' and always low caps
		// storedValue is null if it does not exist yet
		// todo probably OK to use _value in 3 cases below
		if (storedValue == 'true') {
			this._value = true;
		} else if (storedValue == 'false') {
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
		localStorage.setItem(this.opt, this._value);
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
