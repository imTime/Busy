/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/2/12
 * Time: 11:10 上午
 * To change this template use File | Settings | File Templates.
 */

var _calendar = require("../schema").calendar,
	_hummer = require("../hummer/server"),
	im = require("../storage").im;

/*
 * 检查用户是否有编辑某个日历的权限
 * @params {ObjectId} memberId 用户的id
 * @params {ObjectId} calendarId 日历的id
 * @params {Function} callback(err, result{Boolean})
 */
function checkEditPermission(memberId, calendarId, callback){
	var cond = {
		memberId: memberId,
		_id: calendarId
	};

	//检查日历是否为本人所有
	_calendar.count(cond, function(err, count){
		if(err) return callback(err);
		callback(null, count > 0);
	});
};

/*
 * 检查用户是否有浏览某个日历的权限
 */
function checkReadPermission(member_Id, calendar_id, callback){
	//TODO 目前和编辑的权限一致，未来会有共享权限等
	checkEditPermission(member_Id, calendar_id, callback);
};

/*
 * 获取日历
 */
function getCalendar(req, res, next){
	var options = {
		memberId: _hummer.getMember(req).memberId,
		_id: req.params.id,
		index: im.storage.fix.fixBoolean(req.query.index)
	};

	//检查id是否正确
	if(!_hummer.isUUID(options._id, true)){
		return _hummer.responseDataIncorrect(req, res);
	};

	im.storage.calendar.get(options,
		function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
	});
};

/*
 * 删除日历
 */
function deleteCalendar(req, res, next){
	var calendarId = req.params.id,
		memberId = _hummer.getMember(req).memberId;

	//检查id是否正确
	if(!_hummer.isUUID(calendarId)){
		return _hummer.response404(res);
	};
	//删除日历
	im.storage.calendar.remove(memberId, calendarId,
		function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
	});
};

/*
 * 保存日历
 */
function saveCalendar(req, res, next){
	var data = {
		title: req.body.title,					//标题
		color: req.body.color,						//颜色
		tag: req.body.tag,								//标签
		timeZone: req.body.timeZone,		//时区
		summary: req.body.summary,				//摘要
		lastUpdate: new Date().getUTC(),
		memberId: _hummer.getMember(req).memberId
	};

	var cal = im.storage.calendar;
	//put为更新
	var isUpdate = req.method == im.e.method.PUT;
	if(isUpdate){
		data._id = req.params.id;
		//检查id是否正确
		if(!_hummer.isUUID(data._id)){
			return _hummer.responseDataIncorrect(req, res);
		};

		return cal.update(data, function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
		});
	};

	data._id = _hummer.getObjectId();
	cal.insert(data, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});
};

//=======================项目内外部调用的方法============
exports.checkReadPermission = checkReadPermission;
exports.checkEditPermission = checkEditPermission;
//========================对外的基本方法================
exports.POST = saveCalendar;
exports.DELETE = deleteCalendar;
exports.PUT = saveCalendar;
exports.GET = getCalendar;