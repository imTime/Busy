//中文字符
(function(){
	var chineseNumber = {
		basicNumber: '〇一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾',
		extendNumber: '廿卅元正',
		/*
		 * 将基础字符转数字，只转换〇一二三四五六七八九十
		 */
		basicNumberConverter: function(c){
			var index = this.basicNumber.indexOf(c);
			return (index > 10) ? index - 11 : index;
		},
		/*
		 * 转换中文的数字
		 */
		numberConverter: function(text, castOnly){
			if(typeof(text) == "number") return text;
			//本来就全部是数字，不用转换，直接走
			if(text.isNumber()) return parseInt(text);
			var that = this;
			//将一十，二十这类转换
			if(!castOnly){
				var pattern = '([{0}])?([十拾])([{0}])?'.format(this.basicNumber);
				var reg = new RegExp(pattern, "g");
				text = text.replace(reg, function(a, b, c, d){
					var ten = that.basicNumberConverter(b);
					var unit = d ? d : '0';
					if(ten != 0){
						return ten + unit;
					}else{
						return 1 + unit;
					}
				});
			};

			var reg = new RegExp('[\\d{0}{1}]'.format(this.basicNumber, this.extendNumber), "g");
			var matches = text.match(reg);
			var list = [];
			matches.forEach(function(item){
				var number;
				switch(item){
					case "廿":
						number = 20;
						break;
					case "卅":
						number = 30;
						break;
					case "元":
					case "正":
						number = 1;
						break;
					default:
						//本来就是数字，直接
						if(item.isNumber()){
							number = parseInt(item);
						}else{
							number = that.basicNumberConverter(item);
						};
						break;
				};
				list.push(number);
			});

			//console.log(list);
			//仅仅转换为阿拉伯数字
			var result = list.join('');
			if(!castOnly) result = parseInt(result);
			return result;
		}
	};

	//兼容客户端
	if (typeof exports === "object") {
		exports.chineseNumber = chineseNumber;
	}else{
		im.i18n.zh.chineseNumber = chineseNumber;
	};
})();