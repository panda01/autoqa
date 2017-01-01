<?php
	// From https://secure.php.net/manual/en/features.file-upload.php


	try {
		header('Content-Type: text/plain; charset=utf-8');
		if (
			!isset($_FILES['comparison_image']['error']) ||
			is_array($_FILES['comparison_image']['error'])
		) {
			throw new RuntimeException('Invalid Parameters');
		}


		switch ($_FILES['comparison_image']['error']) {
		case UPLOAD_ERR_OK:
			break;
		case UPLOAD_ERR_NO_FILE:
			throw new RuntimeException('No File Sent');
			break;
		case UPLOAD_ERR_INI_SIZE:
		case UPLOAD_ERR_FORM_SIZE:
			throw new RuntimeException('Exceeded File Size Limit');
		default:
			throw new RuntimeException('Unknown Errors.');
		}


		if($_FILES['comparison_image']['size'] > (1024 * 1024 * 128)) {
			throw new RuntimeException('Exceeded File Size Limit');
		}


		$finfo = new finfo(FILEINFO_MIME_TYPE);
		$ext = array_search( $finfo->file($_FILES['comparison_image']['tmp_name']), array (
			'jpg' => 'image/jpeg',
			'png' => 'image/png'
		));
		if ($ext === false) {
			throw new RuntimeException('Invalid File Format');
		}
		$uploaded_filepath = sprintf('./uploads/%s.%s', sha1_file($_FILES['comparison_image']['tmp_name']), $ext);
		$file_moved_successfully = move_uploaded_file($_FILES['comparison_image']['tmp_name'], $uploaded_filepath);

		if (!$file_moved_successfully) {
			throw new RuntimeException('Error Moving the File');
		}

		echo 'File uploaded succesfully';
	} catch(RuntimeException $e) {
		echo $e->getMessage();
	}

	$command = sprintf('python autoqa.py --site %s --file %s', $_POST['website_address'], $uploaded_filepath);
	echo $command . "\n";
	$command = 'ls -la';
	$output = shell_exec(escapeshellcmd($command));
	echo $output;
?>
