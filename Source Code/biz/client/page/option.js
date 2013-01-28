
(function(){
	var _ele;
	im.page.option = {
		inited: false,
		/*
		 * 点击按钮
		 */
		clickedMenu: function(event){
			_ele.menu.find(">li").removeClass("active");
			var obj = $(event.target);
			var isSign = obj.attr("flag") == "sign";
			obj.addClass("active");

			var panels = [_ele.panelSign, _ele.panelSetting];
			panels[Number(!isSign)].show();
			panels[Number(isSign)].hide();
		},
		hide: function(){
			im.page.fullscreen.hide();
		},
		/*
		 * 初始化
		 */
		init: function(){
			//避免重复初始化
			if(this.inited) return;
			this.inited = true;

			var o = $("#pnlOption");
			_ele = {
				panelSign: $("#pnlOptSign"),
				panelSetting: $("#pnlOptSetting"),
				container: o,
				chkNotification: $("#chkOptNotification"),
				chkBadge: $("#chkOptBadge"),
				chkAutoHide: $("#chkOptAutoHide"),
				menu: $("#pnlOptionMenu")
			};

			$.tap(_ele.menu.find(">li"), this.clickedMenu);

			_ele.chkBadge.checkbox()
				.bind("onChanged", this.changeCheckbox);
			_ele.chkAutoHide.checkbox()
				.bind("onChanged", this.changeCheckbox);
			_ele.chkNotification.checkbox()
				.bind("onChanged", this.changeCheckbox);

			im.page.sign.toggle(true);
		},
		/*
		 * 更改checkbox的值
		 */
		changeCheckbox: function(event, checked, isClick){
			if(!isClick) return;
			var flag = $(this).attr("flag");
			var setting = im.member.setting || {};
			setting[flag] == checked;
			//保存配置
			im.storage.updateMember();

			//同步到背景页，主要针对Safari
		},
		/*
		 * 显示选项
		 */
		show: function(){
			//var setting = im.desktop.setting;
			var setting = im.member.setting || {};
			//使用setting.notification || false，是因为notification可能会是undefined，
			// 而onCheck中，undefined表示反选，下同
			_ele.chkNotification.trigger("onCheck", setting.notification || false);
			_ele.chkBadge.trigger("onCheck", setting.badge || false);
			_ele.chkAutoHide.trigger("onCheck", setting.autoHide || false);
			$("#txtSignInMail,#txtSignUpMail").val(setting.mail);

			//判断切换到哪个panel
			var flag = "setting";
			if(!im.member.token){
				flag = "sign";
				im.page.sign.toggle(false);
			};

			_ele.menu.find(">li." + flag).click();
			im.page.modal(_ele.container);
		}
	};
})();