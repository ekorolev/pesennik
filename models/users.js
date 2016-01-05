var bcrypt = require('bcrypt');
module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		login: String,
		collapseIn: Boolean,
		password: String,
		firstname: String,
		secondname: String,
		vklink: String,
		bdate: Date,
		regTime: Date,
		admin: Boolean,
		cryptNow: Boolean,
		singCount: { type: Number, default: 0 },
	});
	Schema.pre('save', function (next) {
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
	Schema.methods.compare = function (cnd, cb) {
		var _self = this;
		bcrypt.compare(cnd, _self.password, cb);
	}

	Schema.methods.secureInfo = function () {
		var self = this;
		var d = new Date(self.bdate);
		return {
			login: self.login,
			collapseIn: self.collapseIn,
			firstname: self.firstname,
			secondname: self.secondname,
			vklink: self.vklink,
			bdate: self.bdate,
			formatBdate: self.bdate?d.format('yyyy-mm-dd'):"",
			id: self._id.toString(),
			admin: self.admin,
			singCount: self.singCount
		};
	}
	var model = mongoose.model('users', Schema);
	return model;
}