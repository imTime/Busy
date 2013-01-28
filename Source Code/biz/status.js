/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/2/12
 * Time: 11:11 上午
 * 用户的状态列表
 */
var _hummer = require("../hummer/server");
var im = require("../storage").im;

//获取用户所有状态
function getStatus(req, res, next){
	var options = {
		memberId: _hummer.getMember(req).memberId,
		index: im.storage.fix.fixBoolean(req.query.index)
	};

	//获取用户的状态
	im.storage.status.get(options, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});
};

/*
 * 删除状态
 */
function deleteStatus (req, res, next){
	var statusId = req.params.id;
	//检查id是否正确
	if(!_hummer.isUUID(statusId)){
		return _hummer.response404(res);
	};

	im.storage.status.remove(_hummer.getMember(req).memberId, statusId, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});
};

/*
 * 保存状态
 */
function saveStatus(req, res, next){
	var data = {
		status: req.body.status,
		color: req.body.color,
		memberId: _hummer.getMember(req).memberId,
		lastUpdate: new Date().getUTC()
	};

	var isUpdate = req.method == im.e.method.PUT;
	var sts = im.storage.status;

	if(isUpdate){
		data._id = req.params.id;
		//检查id是否正确
		if(!_hummer.isUUID(data._id)){
			return _hummer.response404(res);
		};
		return sts.update(data, function(err, result){
			if(err) return next(err);
			_hummer.response(req, res, result);
		});
	};

	data._id = _hummer.getObjectId();
	im.storage.status.insert(data, function(err, result){
		if(err) return next(err);
		_hummer.response(req, res, result);
	});
};


//========================对外的基本方法================
exports.POST = saveStatus;
exports.DELETE = deleteStatus;
exports.PUT = saveStatus;
exports.GET = getStatus;