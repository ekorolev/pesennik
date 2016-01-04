module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		user_id: String,
		user: String,
		sing_id: String,
		text: String,
		addTime: Date
	});

	var model = mongoose.model('comments', Schema);
	return model;
}