
module.exports = function (opts) {


	var auth = require('./auth');
	var sings = require('./sings');
	auth(opts);
	sings(opts);
}