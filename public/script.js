(function($) {
	function _joinObj(obj1, obj2) {
		for(var n in obj2) {
			obj1[n] = obj2[n];
		}
		return obj1;
	}
	function doubleEncodeUrl (url) { return encodeURIComponent(encodeURIComponent(url)); }
	function doubleDecodeUrl (url) { return decodeURIComponent(decodeURIComponent(url)); }
	var reserverdUrls = ['screenshot', 'file'];
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
			var queryObj = makeObjFromQueryString(document.location.search);
			$.each(queryObj, function(key, val) {
				if(key === 'wait_for_load') {
					$('#' + key).prop('checked', (val === 'true'));
				} else {
					$('#' + key).val(val);
				}
			});
			$('#website_address').val(doubleDecodeUrl(encodedUrl));
			return;
		}
		var isCheckScreenshot = urlWithoutFirstSlash.indexOf('check/') === 0;
		if (isCheckScreenshot) {
		}
		// Must be looking at a screenshot, or qa comparions
		var isOnlyScreenshot = urlWithoutFirstSlash.indexOf('screenshot/') === 0;
		var isQaView = urlWithoutFirstSlash.indexOf('qa/') === 0;
		if (!isQaView && !isOnlyScreenshot) {
			stepManager.jumpTo(0, true);
			return;
		}

		var file_prefix = urlWithoutFirstSlash.substring(('qa/').length);
		if (isOnlyScreenshot) {
			file_prefix = urlWithoutFirstSlash.substring(('screenshot/').length);
		}
		var fake_ajax_data_obj = {
			screenshot: {
				url: '/uploads/' + file_prefix + 'screenshot.png'
			}
		};

		if (isQaView) {
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
	function cleanNumber(num) {
		var isEmptyStr = num === '';
		if(isEmptyStr) {
			return undefined;
		}
		var lowerLimit = 250;
		var isNumTooSmall = num < lowerLimit;
		if(isNumTooSmall) {
			return lowerLimit;
		}
		var upperLimit = 2160;
		var isNumTooBig = num > upperLimit
		if(isNumTooBig) {
			return upperLimit;
		}
		return Math.round(num);
	}
	function makeCompareRequest(extraData) {
		var files_list = $('#comparison_image')[0].files;
		var form_data = new FormData();
		$.each(extraData, function(key, val) {
			form_data.append(key, val);
		});
		$.each(files_list, function(key, val) {
			form_data.append('comparison_image', val, val.name);
		});
		form_data.append('website_address', $('#website_address').val());
		var viewport_width = cleanNumber($('#viewport_width').val());
		if(viewport_width) {
			form_data.append('viewport_width', viewport_width);
		}
		var viewport_height = cleanNumber($('#viewport_height').val());
		if(viewport_height) {
			form_data.append('viewport_height', viewport_height);
		}
		var wait_checkbox_checked = $('#wait_for_load').is(':checked') ? 1 : 0;
		form_data.append('wait_for_load', wait_checkbox_checked);
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
			var compareLinkText = 'Compare ' + imgTitle + ' to another url &raquo;';
			$('#download_links_wrap').append('<div><a target="_blank" href="' + url + '?view=download">' + downloadLinkText + '</a></div>');
			if( imgTitle !== 'Diff') {
				$('#compare_links_wrap').append('<div><a href="/check/' + doubleEncodeUrl(url) + '">' + compareLinkText + '</a></div>');
			}
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
	function makeObjFromQueryString(queryStr) {
		var cleanQuery = queryStr.substring(('?').length)
		var queryArr = cleanQuery.split('&');
		return queryArr.reduce(function(accumulator, curr) {
			var keyValArr = curr.split('=');
			var key = keyValArr[0];
			var val = doubleDecodeUrl(keyValArr[1]);
			accumulator[key] = val;
			return accumulator;
		}, {});
	}
	function makeGetURLParamString(obj) {
		var retString = '?';
		var keyValArr = [];
		$.each(obj, function(key, val) {
			if(val !== undefined) {
				keyValArr.push(key + '=' + doubleEncodeUrl(val));
			}
		});
		if(keyValArr.length === 0) {
			return '';
		}
		return retString + keyValArr.join('&');
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
			var fullPath = document.location.pathname
			var isCheckScreenshot = fullPath.indexOf('/check/') === 0;
			if (isCheckScreenshot) {
				stepManager.jumpTo(2, true);
				return;
			}


			var getParamObj = {
				viewport_width: cleanNumber($('#viewport_width').val()),
				viewport_height: cleanNumber($('#viewport_height').val()),
				wait_for_load: $('#wait_for_load').is(':checked')
			};
			history.pushState({}, "Add a File to compare", '/file/' + doubleEncodeUrl($('#website_address').val()) + makeGetURLParamString(getParamObj));
		},
		// Loading Request
		function() {
			var fullPath = document.location.pathname
			var isCheckScreenshot = fullPath.indexOf('/check/') === 0;
			var fakeData = {};
			if (isCheckScreenshot) {
				fakeData['screenshot_url'] = doubleDecodeUrl(fullPath.substring(('/check/').length)).substring(1);
			}
			makeCompareRequest(fakeData);
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
			jumpTo: function(whichIdx, fireOnEnter) {
				if(fireOnEnter === true) {
					onEnterStep[whichIdx]();
				}
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
