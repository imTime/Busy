/*
 * 业务逻辑的配置文件
 */

/*
 * 用户客户端的main.js
 */
exports.main = {
	target: "main.js",
	complex: true,
	//要合并的源文件
	source: [
		{
			dir: "hummer/client/",
			files: [
				"core.js",
				"jquery.dropkick.js",
				"datepicker.js"
			]
		},{
			dir: "biz/",
			//从<!--deploy-->节点中提取
			extract: true,
			files: [
				"common.js", "eventGenerator.js"
			]
		},{
			dir: "biz/client/",
			files: [
				"main.js",
				"page/page.js",
				"page/reminder.js",
				"page/activity.js",
				"page/timeline.js",
				"page/todoEditor.js",
				"page/normalEditor.js",
				"page/birthdayEditor.js",
				"page/expressEditor.js",
				"page/calendar.js",
				"page/status.js",
				"page/repeat.js",
				"timeline.js"
			]
		}, {
			dir: "biz/",
			files: [
				"compute.js"
			]
		}
	]				//end source
};