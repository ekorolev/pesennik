module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		name: String,
		user_id: String,
		user: String,
	});

	var model = mongoose.model('authors', Schema);
	return model;
}