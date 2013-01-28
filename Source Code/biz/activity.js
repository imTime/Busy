/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/2/12
 * Time: 11:10 上午
 * To change this template use File | Settings | File Templates.
 */
var _hummer = require("../hummer/server");
var im = require("../storage").im;
var _calendar = require("./calendar");

//保存活动
function saveActivity(req, res, next){
	var data = {
		type: req.body.type,					//活动类型
		title: req.body.title,
		statusId: req.body.statusId,
		tags: req.body.tags,
		end: req.body.end,
		begin: req.body.begin,
		local: req.body.local,
		allDay: req.body.allDay,
		repeat: req.body.repeat,
		repeatStop: req.body.repeatStop,
		summary: req.body.summary,
		finishedRate: req.body.finishedRate,
		finishedDate: req.body.finishedDate,
		lastUpdate: new Date().getUTC(),
		memberId: _hummer.getMember(req).memberId
};

	//UUID不正确
	if(!_hummer.isUUID(data.statusId, true)){
		return _hummer.responseDataIncorrect(req, res);
	};

	data.statusId = data.statusId || undefined;
	var isUpdate = req.method == im.e.method.PUT;
	var act = im.storage.activity;
	//更新
	if(isUpdate){
		data._id = req.params.id;
		//检查id是否正确
		if(!_hummer.isUUID(data._id)){
			return _hummer.responseDataIncorrect(req, res);
		};

		return act.update(data, function(err, result){
			_hummer.response(req, res, result);
		});
	};

	data._id = _hummer.getObjectId();
	data.calendarId = req.body.calendarId;
	//检查日历id是否正确
	if(!_hummer.isUUID(data.calendarId)){
		//console.log(data.calendarId);
		return _hummer.responseDataIncorrect(req, res);
	};

	//检查用户是否有插入这个日历的权限
	_calendar.checkEditPermission(data.memberId, data.calendarId, function(err, allow){
		if(err) return next(err);
		if(!allow){
			return _hummer.response(req, res, im.e.SaveActivity.CalendarNotExist);
		};

		//插入数据
		act.insert(data, function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
		});			//end update
	});				//end checkEditPermission
};

/*
 * 删除指定活动
 */
function deleteActivity(req, res, next){
	var memberId = _hummer.getMember(req).memberId;
	var activityId = req.params.id;

	//检查id是否正确
	if(!_hummer.isUUID(activityId)){
		return _hummer.response404(res);
	};

	//删除
	im.storage.activity.remove(memberId, activityId,
		function(err, result){
			_hummer.response(req, res, result);
		});
};

exports.storage = im.storage.activity;
//===========================对用户公开的方法================
exports.POST = saveActivity;
exports.PUT = saveActivity;
exports.DELETE = deleteActivity;