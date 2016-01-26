$(function () {
	
	var doImport = function () {
		$('#Alert').removeClass();
		$("#Alert").addClass('text-success');
		$('#Alert').html('Подождите пару секунду...');
		$('#Alert').show();
		$('#importButton').hide();
		$('#link').attr('disabled', 'true');
		$('#importButton').attr('disabled', 'true');
		$.ajax({
			type: 'post',
			url: '/json/import',
			data: {
				link: $('#link').val()
			},
			success: function (data) {


				if (data.success) {
					console.log(data);
					$('#Alert').html('Текст успешно импортирован!');
					$('#Alert').removeClass();
					$("#Alert").addClass('text-success');
					window.tinymce.activeEditor.setContent('<pre>'+data.text+'</pre>');
					$('#authorOfSing').val(data.artist);
					$('#nameOfSing').val(data.name);
					$('#copylink').val($('#link').val());
					setTimeout( function () {
						$('#link').removeAttr('disabled', 'false');
						$('#importButton').removeAttr('disabled', 'false');
						$('#Alert').hide();
						$('#importButton').show();
					}, 1500);
				}
				if (data.error) {
					$('#message').html('Ошибка импортирования. Обратите внимание: поддерживается только импорт с сайта amdm.ru');					
				}
			}
		});

		return false;	
	}

	//$('#link').on('change', doImport);
	$('#importButton').on('click', doImport);

});