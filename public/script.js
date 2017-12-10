(function($) {
	function _joinObj(obj1, obj2) {
		for(var n in obj2) {
			obj1[n] = obj2[n];
		}
		return obj1;
	}
	function loadSubURL(url) {
		var whole_path = document.location.pathname;
		var isFirstStep = whole_path === '/';
		if(isFirstStep) {
			stepManager.jumpTo(0);
			return;
		}
		var urlWithoutFirstSlash = whole_path.substring(1);
		var isAddFileStep = urlWithoutFirstSlash.indexOf('file/') === 0;
		if (isAddFileStep) {
			stepManager.jumpTo(1);
			var encodedUrl = urlWithoutFirstSlash.substring(('file/').length);
			$('#website_address').val(decodeURIComponent(decodeURIComponent(encodedUrl)));
			return;
		}
		var isOnlyScreenshot = urlWithoutFirstSlash.indexOf('screenshot/') === 0;
		var file_prefix = whole_path.substring(4);
		if (isOnlyScreenshot) {
			file_prefix = urlWithoutFirstSlash.substring(('screenshot/').length);
		}
		var fake_ajax_data_obj = {
			screenshot: {
				url: '/uploads/' + file_prefix + 'screenshot.png'
			}
		};
		if (!isOnlyScreenshot) {
			var restOfFakeObj = {
				uploaded_file: {
					'status': 'Success',
					'url': '/uploads/' + file_prefix + 'upload.png'
				},
				comparisons: {
					url: '/comparisons/' + file_prefix,
					suffixes: ['diff_img.png', 'threshold_img.png', 'contours_img.png']
				}
			}
			fake_ajax_data_obj = _joinObj(fake_ajax_data_obj, restOfFakeObj);
		}
		console.log(fake_ajax_data_obj);

		// Jump to the step and load the images
		stepManager.jumpTo(3);
		initComparisonPage(fake_ajax_data_obj);
	}
	// While on the page be sure to capture changes in the url
	window.onpopstate = function() {
		loadSubURL(document.location.href);
	}
	function initComparisonPage(data) {
		// Load the images for the user to see
		addImageToView(data.screenshot.url, 'Screenshot', 'flex-first');
		if( data.comparisons ) {
			$('#title').html('Auto QA:');
			addImageToView(data.comparisons.url + data.comparisons.suffixes[2], 'Diff');
			addImageToView(data.uploaded_file.url, 'Uploaded File', 'flex-last');
		} else {
			$('#title').html('Screenshots:');
			$('#now_viewing').html('Download the image and save for a later QA');
		}
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
				var onlyScreenshot = data.comparisons === undefined;
				if(onlyScreenshot) {
					history.pushState(data, "Check your website", '/screenshot/' + data.hash);
				} else {
					history.pushState(data, "Check your website", '/qa/' + data.hash);
				}
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
			var urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/;
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
	function addImageToView(url, imgTitle, additionalClasses) {
		var imgObjToAdd = new Image();
		imgObjToAdd.onload = function() {
			$('#img_wrap').append(this);
			var downloadLinkText = 'Download ' + imgTitle;
			$('#download_links_wrap').append('<div><a target="_blank" href="' + url + '?view=download">' + downloadLinkText + '</a></div>');
		};
		imgObjToAdd.onerror = function(a, b, c) {
			alert('image couldn\'t be found, maybe just start over again?');
		};
		imgObjToAdd.src = url;
		if(additionalClasses === undefined) {
			additionalClasses = '';
		}
		imgObjToAdd.className = 'col-md-4 ' + additionalClasses;
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
		function() {
			history.pushState({}, "Add a File to compare", '/file/' + encodeURIComponent(encodeURIComponent($('#website_address').val())));
		},
		// Loading Request
		function() {
			makeCompareRequest();
		},
		// Show the result
		initComparisonPage
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
		loadSubURL(document.location.pathname);
	});
}(jQuery));
