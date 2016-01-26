$(function () {
	
	$('#link').on('change', function () {
		$('#message').html('Подождите пару секунду...');
		$('#message').show();
		$.ajax({
			type: 'post',
			url: '/json/import',
			data: {
				link: $('#link').val()
			},
			success: function (data) {


				if (data.success) {
					console.log(data);
					$('#message').html('Текст успешно импортирован!');
					window.tinymce.activeEditor.setContent('<pre>'+data.text+'</pre>');
					$('#authorOfSing').val(data.artist);
					$('#nameOfSing').val(data.name);
					$('#copylink').val($('#link').val());
				}
				if (data.error) {
					$('#message').html('Ошибка импортирования. Обратите внимание: поддерживается только импорт с сайта amdm.ru');					
				}
			}
		});
	});

});