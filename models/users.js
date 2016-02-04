var bcrypt = require('bcrypt');
module.exports = function (mongoose) {
	var Schema = mongoose.Schema({
		login: String,
		collapseIn: Boolean,
		firstname: String,
		secondname: String,
		vklink: String,
		bdate: Date,
		regTime: Date,
		admin: Boolean,
		singCount: { type: Number, default: 0 },
		lastActivity: Date,
		role: String,
		useOld: Boolean
	});

	Schema.methods.secureInfo = function () {
		var self = this;
		var d = new Date(self.bdate);
		var activity = new Date(self.lastActivity);
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
			singCount: self.singCount,
			lastActivity: self.lastActivity? activity.format('yyyy-mm-dd HH:MM:ss') : 'none',
		};
	}

	return Schema;
}