(function($) {
	function attachFormEvents() {
		// Ajax submit the form so the user gets some feedback
		$('#main_form').on('submit', function(evt) {
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
				dataType: 'text/html',
				processData: false,
				contentType: false,
				success: function(data, textStatus, jqXHR) {
					debugger;
				},
				error: function(jqXHR, textStatus, error) {
					debugger;
				}
			});
			evt.preventDefault();
			evt.stopPropagation();
		});
	}
	$(document).ready(function() {
		return;
		attachFormEvents();
	});
}(jQuery));
