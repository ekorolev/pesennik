// Подготавливаем модель пользователя для работы с нашим модулем.
var bcrypt = require('bcrypt');

module.exports = function (schema, mongoose) {
	schema.add({
		uniqueString: String,
		password: String,
		role: String,
		cryptNow: Boolean
	});

	schema.pre('save', function (next) {
		var _self = this;
		if (_self.isNew || _self.cryptNow) {
			bcrypt.hash(_self.password, 8, function (err, hash) {
				if (err) next(new Error('Error')); else {
					_self.password = hash;
					_self.cryptNow = false;
					next();
				}
			});
		} else {
			next();
		}
	});

	schema.methods.compare = function (cnd, cb) {
		var _self = this;
		bcrypt.compare(cnd, _self.password, cb);
	}

	var model = mongoose.model('users', schema);
	return model;
}