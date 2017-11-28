(function($) {
	function makeCompareRequest() {
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
	function attachFormEvents() {
		// Ajax submit the form so the user gets some feedback
		// $('#main_form').on('submit', makeCompareRequest);
	}
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
				next();
			}
		});
		$steps.on('keydown', 'input[type="text"]', function(evt) {
			if(evt.keyCode === 13) {
				next();
				evt.preventDefault();
			}
		});

		function next() {
			$steps.removeClass('current')
			currStep++;
			if(currStep >= $steps.length) {
				currStep = $steps.length - 1;
				finishFn();
				return;
			}
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
			attachFormEvents();
		}
		manageSteps(makeCompareRequest);
	});
}(jQuery));
