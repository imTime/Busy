/*
 * 状态的处理
 */
(function(){
	var _ele;
	im.page.status = {
		init: function(options){
			im.page.status.options = options || {};
			var o = $("#pnlStatus");
			_ele = {
				statusList: $("#statusList>div.details"),
				editList: $("#lsvEditStatus"),
				container: o,
				statusInput: $("#txtStatus"),
				colors: $("#lstStatusColor"),
				//保存/添加状态的按钮
				editButton: $("#btnEditStatus"),
				innerPanel:o.find(">div.inner")
			};

			//点击编辑/保存的按钮
			$.tap(_ele.editButton, function(){
				im.page.status.saveEditor();
			});

			//点击状态列表上的按钮
			$.tap(_ele.innerPanel.find(">footer button"), function(){
				var flag = $(this).attr("flag");
				//保存状态
				if(flag == "save"){
					im.page.status.save();
					return;
				};

				var x = 0, y = 0;
				x = flag == "edit" ? -500 : 0;
				if(flag == "close"){
					y = -200;
					o.fadeOut();
				}else{
					_ele.innerPanel.moveTo({x: x, y: y});
				}
			});

			//实现色带
			im.page.ribbon(_ele.colors, function(color){
				//将选中的颜色写入cache
				o.cache({
					color: color
				});
			});
		},
		//选择某个状态
		selected: function(statusId){
			var obj = _ele.statusList;
			var className = "selected";
			obj.find('>a.' + className).removeClass(className);
			obj.find('>a[statusId="{0}"]'.format(statusId), obj).addClass(className);
		},
		//加载
		load: function(datas){
			var htmlSelector = '', htmlEdit = '';
			//选择器的模板
			var tempSelector = '<a statusId="{0}" color="{1}" {4}><span class="icon" ';
			tempSelector += 'style="background-color: {3}"> </span><label>{2}</label> </a>';
			//编辑中的模板
			var tempEdit = '<a statusId="{0}" color="{1}"><span class="icon" ';
			tempEdit += 'style="background-color: {3}"> </span><label>{2}</label>';
			tempEdit += '<span class="delete"></span></a>';
			datas.forEach(function(item, index){
				htmlEdit += tempEdit.format(item._id, item.color, item.status, item.color, "");
				htmlSelector += tempSelector.format(item._id, item.color, item.status, item.color);
			});

			_ele.editList.html(htmlEdit);

			//要在状态中加入unknown状态
			htmlSelector = tempSelector.format(
				-1, "", "Unknown", "transparent", 'class="unknown"') + htmlSelector;
			_ele.statusList.html(htmlSelector);

			//绑定选择状态的事件
			$.tap(_ele.statusList.find(">a"), function(){
				var obj = $(this);
				var statusId = obj.attr("statusId");
				var color = obj.attr("color");
				//选中某个状态
				$.callEvent(im.page.status.options.onSelected, [statusId, color]);
				//状态状态选择
				_ele.container.fadeOut();
			});	//end tap

			//绑定编辑列表选择状态的事件
			$.tap(_ele.editList.find(">a"), function(){
				var obj = $(this);
				var statusId = obj.attr("statusId");
				var color = obj.attr("color");
				var text = obj.text();

				//选择及反选
				var selected = "selected";
				_ele.editList.find(">a." + selected).removeClass(selected);
				obj.addClass(selected);

				im.page.selectedRibbon(_ele.colors, color);
				im.page.status.edit(statusId, color, text);
			});

			//点击删除
			$.tap(_ele.editList.find(">a>span.DELETE"), function(e){
				e.stopPropagation();
				var statusId = $(this).parent().attr("statusId");
				im.page.status.remove(statusId);
			});
		},
		/*
		 * 删除某个状态
		 */
		remove: function(statusId){
			var options = {
				onSuccess: function(res){
					switch(res.code){
						case im.e.DeleteStatus.ActivityExist:
							alert("共有{0}条活动与此状态相关联，删除失败!");
							return;
							break;
						case im.e.DeleteStatus.StatusNotExist:
							alert("没有找到您要删除的活动，可以已经被删除！");
							return;
							break;
					};

					//删除编辑列表和选择列表的状态
					var expr = '>a[statusId="{0}"]'.format(statusId);
					_ele.editList.find(expr).remove();
					_ele.statusList.find(expr).remove();
					//是否在编辑状态中，如果是，则清空编辑器
					var cache = _ele.container.cache();
					if(cache.statusId == statusId){
						im.page.status.clear();
					};
				}
			};

			im.interface.passed(im.e.module.status, im.e.method.DELETE, options, statusId);
		},
		//清除编辑器
		clear: function(){
			var selected = "selected";
			//取消状态列表的选中状态
			_ele.editList.find(">a." + selected).removeClass(selected);
			//删除状态
			_ele.statusInput.val("");
			//清除cache中的状态id
			_ele.container.cache({
				statusId: null
			});

			this.moveEditButton(false);
		},
		/*
		 * 移动编辑状态的按钮
		 */
		moveEditButton: function(isEdit){
			var y = isEdit ? 180 : 0;
			_ele.editButton.toggleClass("edit", isEdit);

			window.setTimeout(function(){
				_ele.editButton.moveTo({x: 0, y: y});
			}, 200);

			return;
			window.setTimeout(function(){
				_ele.editButton.animate({top: y});
			}, 200);
		},
		/*
		 * 编辑状态
		 */
		edit: function(statusId, color, status){
			this.moveEditButton(true);
			_ele.statusInput.val(status);
			_ele.container.cache({
				statusId: statusId,
				color: color
			});
		},
		/*
		 * 保存编辑器
		 */
		saveEditor: function(){
			var status = _ele.statusInput.val().trim();
			var cache = _ele.container.cache();

			//TODO 此处应该检查状态是否存在，避免过多向服务器请求
			var data = {
				status: status,
				color: cache.color
			};

			im.page.status.save(data, function(res){
				im.page.status.clear();
				//更新状态
				im.page.status.update(data.statusId, data.color, status)
				//提示用户保存成功
			}, cache.statusId);
		},
		/*
		 * 保存状态
		 */
		save: function(data, callback, statusId){
			var options = {
				data: data,
				//修改成功，返回
				onSuccess: function(res){
					$.callEvent(callback);
				}
			};

			var method = im.e.method[statusId ? "PUT" : "POST"];
			im.interface.passed(im.e.module.status, method, options, statusId);
		},
		//更改了状态的颜色
		update: function(statusId, color, status){
			//TODO 更改状态中的颜色，调用Interface的接口更新
			var cp = im.interface.getCompute();
			cp.updateStatus(statusId, color, status);
			this.load(cp.getStatuses());
		},
		/*
		 * 显示状态的面板
		 * @params {String} statusId 要选中的状态id
		 * @params {Number} height 容器的高度，一般和编辑器的高度匹配
		 */
		show: function(statusId, height){
			var o = _ele.container;
			o.height(height).fadeIn();
			this.selected(statusId);
		}
	}
})();
