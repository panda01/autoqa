(function($) {
	function makeCompareRequest(successFn) {
		var files_list = $('#comparison_image')[0].files;
		var form_data = new FormData();
		$.each(files_list, function(key, val) {
			form_data.append('comparison_image', val, val.name);
		});
		form_data.append('website_address', $('#website_address').val());
		$.ajax({
			url: '/cgi-bin/compare_to_image.py',
			type: 'POST',
			data: form_data,
			cache: false,
			dataType: 'json',
			processData: false,
			contentType: false,
			success: function(data, textStatus, jqXHR) {
				debugger;
			},
			error: function(jqXHR, textStatus, error) {
				debugger;
			}
		});
	}
	function trim(str) {
		while(str[0] === ' ') {
			str = str.substring(1);
		}
		while(str[str.length - 1] === ' ') {
			str = str.substring(0, str.length - 1);
		}
		return str;
	}

	var validation = [
		function(el) {
			var $inputEl = $('#website_address');
			var rawInputVal = $inputEl.val();
			var saferInput = trim(rawInputVal);
			if (saferInput.length === 0) {
				$inputEl
					.attr('data-error-msg', 'Url cannot be epmty')
					.addClass('has_error');
				return false;
			}
			// Up to 3 subdomain url regex
			var urlRegex = /^((https?):\/\/)?(www.)?[a-z0-9]+\.[a-z]+[a-z0-9]+\.[a-z]+[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/;
			var isUrl = urlRegex.test(saferInput);
			if (!isUrl) {
				$inputEl
					.attr('data-error-msg', 'Not a valid URL')
					.addClass('has_error');
				return false;
			}

			return true;
		},
		function(el) {
			return true;
		}
	];
	var onEnterStep = [
		function(nextFn) {
			setTimeout(function() {
				var $urlInput = $('#website_address');
				$urlInput.focus();
			}, 1);
		},
		function(nextFn) {
		},
		function(nextFn) {
			makeCompareRequest();
		}
	];

	function manageSteps(finishFn) {
		var currStep = -1;
		var $steps = $('[data-step]');

		$steps.on('click', '[data-step-action]', function(evt) {
			evt.preventDefault();
			var $btn = $(evt.currentTarget);
			var action = $btn.data('step-action');
			if(action === 'prev') {
				prev();
			} else {
				if(validation[currStep]()) {
					next();
				} else {
				}
			}
		});
		$steps.on('keydown', 'input', function(evt) {
			var keyCode = evt.keyCode;
			if(keyCode !== 13) {
				var $inputEl = $(evt.currentTarget);
				$inputEl.removeClass('has_error');
			}
		});

		function next() {
			$steps.removeClass('current');
			currStep++;
			if(currStep >= $steps.length) {
				currStep = $steps.length - 1;
				currStep = 0;
			}

			// Fire Enter Function
			onEnterStep[currStep]();
			var $curr = $($steps[currStep]);
			$curr.addClass('current');
			$curr.nextAll().addClass('next');
			$curr.prevAll().addClass('prev');
		}
		function prev() {
			$steps.removeClass('current')
			currStep--;
			if(currStep < 0) {
				currStep = 0;
				return;
			}
			var $curr = $($steps[currStep]);
			$curr.addClass('current');
			$curr.nextAll().addClass('next');
			$curr.prevAll().addClass('prev');
		}
		next();

	}
	$(document).ready(function() {
		var doAjaxForm = location.href.indexOf('noajax') === -1;
		if(doAjaxForm) {
			// attachFormEvents();
		}
		manageSteps();
	});
}(jQuery));
