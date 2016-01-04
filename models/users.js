var bcrypt = require('bcrypt');
module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		login: String,
		collapseIn: Boolean,
		password: String,
	});
	Schema.pre('save', function (next) {
		var _self = this;
		if (_self.isNew) {
			bcrypt.hash(_self.password, 8, function (err, hash) {
				if (err) next(new Error('Error')); else {
					_self.password = hash;
					next();
				}
			});
		} else {
			next();
		}
	});
	Schema.methods.compare = function (cnd, cb) {
		var _self = this;
		bcrypt.compare(cnd, _self.password, cb);
	}
	var model = mongoose.model('users', Schema);
	return model;
}