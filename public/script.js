(function($) {
	function loadSubURL() {
		var whole_path = document.location.pathname;
		var isSubUrl = whole_path.length > 1;
		if (!isSubUrl) {
			return;
		}
		var file_prefix = whole_path.substring(4);
		var fake_ajax_data_obj = {
			uploaded_file: {
				'status': 'Success',
				'url': '/uploads/' + file_prefix + 'upload.png'
			},
			screenshot: {
				url: '/uploads/' + file_prefix + 'screenshot.png'
			},
			comparisons: {
				url: '/comparisons/' + file_prefix,
				suffixes: ['diff_img.png', 'threshold_img.png', 'contours_img.png']
			}
		};
		console.log(fake_ajax_data_obj);

		// Jump to the step and load the images
		stepManager.jumpTo(3);
		enterLastStep(fake_ajax_data_obj);
	}
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
				history.pushState(data, "Check your website", 'qa/' + data.hash);
				stepManager.next(data);
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
		}
	];
	function enterLastStep(data) {
		// Load the images for the user to see
		$('#screenshot_img').attr('src', data.screenshot.url);
		$('#uploaded_img').attr('src', data.uploaded_file.url);
		$('#diff_img').attr('src', data.comparisons.url + data.comparisons.suffixes[0]);
		$('#threshold_img').attr('src', data.comparisons.url + data.comparisons.suffixes[1]);
		$('#contours_img').attr('src', data.comparisons.url + data.comparisons.suffixes[2]);
		var options = {
			title: false,
			tooltip: false
		};
		var ImagesViewer = new window.Viewer(document.getElementById('img_wrap'), options);
	}
	var onEnterStep = [
		// Get the URL
		function() {
			// Give the input box focus
			setTimeout(function() {
				var $urlInput = $('#website_address');
				$urlInput.focus();
			}, 1);
		},
		// Get the comparison Image
		function() {},
		// Loading Request
		function() {
			makeCompareRequest();
		},
		// Show the result
		enterLastStep
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
				protectedNext();
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
			currStep++;
			if(currStep >= $steps.length) {
				currStep = $steps.length - 1;
				currStep = 0;
			}

			// Fire Enter Function
			var enterFn = onEnterStep[currStep];
			var enterFnIsDefined = enterFn !== undefined;
			if(enterFnIsDefined) {
				enterFn.apply(this, arguments);
			}
			_loadCurrStep();
		}
		function prev() {
			currStep--;
			if(currStep < 0) {
				currStep = 0;
				return;
			}
			_loadCurrStep();
		}
		function _loadCurrStep(idx) {
			var loadParamIdx = idx !== undefined;
			if(loadParamIdx) {
				currStep = idx;
			}
			$steps.removeClass('current');
			var $curr = $($steps[currStep]);
			$curr.addClass('current');
			$curr.nextAll().addClass('next');
			$curr.prevAll().addClass('prev');
		}
		next();
		function protectedNext(data) {
			var validationFn = validation[currStep];
			var validationFnIsDefined = validationFn !== undefined;
			if(validationFnIsDefined && !validationFn()) {
				return false;
			}
			next(data);
			return true;
		}

		return {
			next: protectedNext,
			prev: prev,
			jumpTo: function(whichIdx) {
				var safeIdx = whichIdx % $steps.length;
				_loadCurrStep(safeIdx);
			}
		};
	}

	var stepManager;
	$(document).ready(function() {
		stepManager = manageSteps();
		loadSubURL();
	});
}(jQuery));
