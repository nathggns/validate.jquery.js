/*!
 * jQuery Validate v0.1.1
 * https://github.com/nathggns/validate.jquery.js
 * Copyright (c) 2013 Nathaniel Higgins; Licensed MIT
 * Built on 2013-07-09 
 */
(function(window, document, $, undefined) {

	// Store object
	var Store = (function() {

		var id = 0;

		var getObjectId = function(obj) {
			if (!obj) obj = this;
			if (this !== obj) return getObjectId.call(obj);

			if (typeof this.__objectId === 'undefined') {
				this.__objectId = id++;
			}

			return '___objectId_' + this.__objectId;
		};

		var getKey = function(object) {
			return typeof object === 'object' || typeof object === 'function' ? getObjectId(object) : object;
		};
		function Store() {
			this.data = {};
		}

		Store.prototype = {
			get: function(key) {
				return this.data[getKey(key)];
			},
			set: function(key, val) {
				this.data[getKey(key)] = val;
			}
		};

		return Store;
	}());

	$.validate = function(opts) {
		return $('*').validate(opts);
	};

	$.validate._defaults = {
		passed: 'passed',
		failed: 'failed',
		success: function(opts) {
			$(this).removeClass(opts.failed).addClass(opts.passed);
		},
		failure: function(opts) {
			$(this).removeClass(opts.passed).addClass(opts.failed);
		},
		cancel: function(opts) {
			alert('Form did not validate');
		},
		checks: [],
		funcs: {
			email: function(email) {
				var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return re.test(email);
			},
			empty: function(text) {
				return !text || text === '';
			},
			numeric: function(text) {
				var re = /^\d*$/;
				return re.test(text);
			}
		},
		mods: {
			not: function(val) {
				return !val;
			}
		},
		preventSubmit: true
	};

	$.validate.defaults = {};

	$.fn.validate = function(opts) {
		var defaults = $.extend(true, $.validate._defaults, $.validate.defaults);
		opts = $.extend(true, defaults, opts);
		var checks = new Store();
		var data = new Store();

		var mods = opts.mods;
		var funcs = opts.funcs;

		var handler = function(e) {
			var check = checks.get(this), val = this.value;
			if (!check) return undefined;
			
			var passed = true;

			$.each(check, function() {
				if (!passed) return false;

				passed = this(val);
			});

			var func = passed ? opts.success : opts.failure;
			func.call(this, opts);

			if (!e) return passed;
		};

		$.each(this, function() {
			var $this = $(this),
				$inputs = $this.find('input');

			$inputs = $inputs.filter(function() {
				var $this = $(this);

				return $this.attr('data-verify') || typeof opts.checks[$this.attr('name')] !== 'undefined';
			});

			$inputs.each(function() {
				
				var $this = $(this);
				var name = $this.attr('name');
				var checkArray = checks.get(this) || [];
				var checksString = typeof opts.checks[name] === 'undefined' ? $this.data('verify') : opts.checks[name];
				if (!checksString) return true;
				var func;

				if (typeof checksString !== 'string') {
					func = checksString;
				} else {
					checksString = checksString.split(' ');

					$.each(checksString, function() {
						var check = this;
						var modifier = false;
						var parts = check.split('_');

						if (parts.length > 1) {
							modifier = parts[0];
							check = parts.slice(1).join('_');
						}

						func = funcs[check];

						if (modifier) {
							modifier = mods[modifier];
							var origFunc = func;

							func = function() {
								return modifier(origFunc.apply(this, arguments));
							};
						}
					});
				}

				checkArray.push(func);
				checks.set(this, checkArray);
			}).on('change keyup blur', function(e) {

				var o = this;

				if (e.which === 9) return true;

				var d = data.get(this) || {};

				d.used = true;
				data.set(this, d);

				$inputs.each(function() {
					var d = data.get(this);

					if (!d || !d.used) {
						return true;
					}

					handler.call(this, e);
				});
			});

			if (opts.preventSubmit) {
				$this.submit(function(e) {
					var passed = true;
					$inputs.each(function() {
						if (!passed) return false;

						passed = handler.call(this);
					});

					if (!passed) {
						e.stopImmediatePropagation();
						e.preventDefault();
						opts.cancel(opts);
						return false;
					}

					return true;
				});
			}
		});
	};

}(window, document, jQuery));