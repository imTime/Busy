/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/2/12
 * Time: 7:50 下午
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/imTime', function (err) {
	if (err) {
		console.error('connect to db error: ', err.message);
		process.exit(1);
	}
});

require("./member");
require("./calendar");
require("./activity");
require("./status");
require("./reminder");
require("./token");

exports.status = mongoose.model("status");
exports.reminder = mongoose.model("reminder");
exports.member = mongoose.model("member");
exports.calendar = mongoose.model("calendar");
exports.activity = mongoose.model("activity");
exports.token = mongoose.model("token");