/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/12/12
 * Time: 5:35 下午
 * 用户添加提醒
 */

var _hummer = require("../hummer/server"),
	im = require("../storage").im;

/*
 * 保存提醒
 */
function saveReminder(req, res, next){
	var data = {
		reminderBy: req.body.reminderBy,
		activityId: req.body.activityId,
		delay: req.body.delay,
		lastUpdate: new Date().getUTC(),
		memberId: _hummer.getMember(req).memberId
	};

	//检查id是否正确
	if(!_hummer.isUUID(data.activityId)){
		return _hummer.responseDataIncorrect(req, res);
	};

	var isUpdate = req.method == im.e.method.PUT;
	var rmd = im.storage.reminder;
	if(isUpdate){
		data._id = req.params.id;
		//检查id是否正确
		if(!_hummer.isUUID(data._id)){
			return _hummer.responseDataIncorrect(req, res);
		};
		rmd.update(data, function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
		});		//end update
	};

	data._id = _hummer.getObjectId();
	rmd.insert(data, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});		//end insert
};

/*
 * 获取用户某个活动下所有提醒
 */
function getReminder(req, res, next){
	var options = {
		activityId: req.query.activityId,
		memberId: _hummer.getMember(req).memberId,
		reminderBy: req.query.reminderBy,
		index: req.query.index,
		start: req.query.start,
		stop: req.query.stop
	};

	//检查id是否正确
	if(!_hummer.isUUID(options.activityId, true)){
		return _hummer.responseDataIncorrect(req, res);
	};

	//获取活动
	im.storage.reminder.get(options, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});
};

/*
	删除某个提醒
*/
function deleteReminder(req, res, next){
	var memberId = _hummer.getMember(req).memberId;
	var reminderId = req.params.id;

	//检查id是否正确
	if(!_hummer.isUUID(reminderId)){
		return _hummer.response404(res);
	};

	im.storage.reminder.remove(memberId, reminderId, function(err, result){
		if(err) return next(err);
		//删除成功
		if(result.command.result){
			//TODO 先删除Queue中的排队，两者并行，就算Queue没有删除，影响也不到
		};
		_hummer.response(req, res, result);
	});
};

//============================外部调用的公开方法====================
exports.DELETE = deleteReminder;
exports.GET = getReminder;
exports.POST = saveReminder;
exports.PUT = saveReminder;