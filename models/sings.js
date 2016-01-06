module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		author: String,
		author_id: String,
		name: String,
		user_id: String,
		user: String,
		text: String,
		copylink: String,
	});

	var model = mongoose.model('sings', Schema);
	return model;
}