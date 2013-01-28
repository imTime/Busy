/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:22 下午
 * To change this template use File | Settings | File Templates.
 */


//校验数据
(function($){
//对表单数据进行校验
	/*
	 参数说明：
	 expr：要校验的表达式
	 exitWhenFalid：当失败的时候，是否退出校验
	 callback：失败的校验函数

	 要求input包含如下属性：
	 1.empty 1表示不能为空
	 2.valid-type 校验内容(mailQueue/length/equal/range/intRange)
	 3.valid-value 与valid-type对应的值，只有在valid-type需要的情况下才需要赋值，例如长度校验，就需要指定长度
	 4.condition 只有$(condition)=true的情况，才进行校验
	 可以校验内容：
	 1.length：长度校验，validValue为int型，要求匹配value为指定长度
	 2.email：要求value匹配email格式
	 3.int：要求匹配为正整数
	 4.number：要求匹配为正整数或者小数
	 5.date：要求匹配为日期
	 6.time：要求匹配为时间
	 7.regexp: 要求匹配为正则
	 8.notEqual：要求不能等于validValue
	 9.minMax： 要求值要在一个区间
	 如果isEmpty为0，则当没有值的时候，不作校验
	 */
	$.fn.validator = function(exitWhenFalid, onValid) {
		//检查value是否在minMax之间，minMax用|进行分隔
		var valueIsBewtten = function(value, minMax) {
			value = parseFloat(value);
			if (isNaN(value)) return false;
			var arrVal = minMax.split("|");
			//校验是否大于等于最小值
			if (arrVal[0] != "" && value < parseFloat(arrVal[0])) return false;
			//校验是否小于等于最大值
			if (arrVal.length == 2 && arrVal[1] != "" && value > parseFloat(arrVal[1])) return false;
			return true;
		};

		var result = true;
		var objList = $(this);
		for(var i = 0; i < objList.length; i ++){
			var obj = $(objList[i]);
			var valid = true;
			//不是input不校验，直接跳过，并调用onValid函数s
			if(!obj.is("input")){
				$.callEvent(onValid, [obj, -1]);
				continue;
			};
			var curResult = true;
			var empty = obj.attr("empty") == "1";
			var validType = obj.attr("valid-type");
			var validValue = obj.attr("valid-value");
			var condition = obj.attr("condition");
			var value = obj.val().trim();
			//检查是否设置了校验条件
			if (condition) valid = $(condition);
			//值为空，则允许为空，则不作校验
			if (!empty && value == "") valid = false;
			if (valid) {
				if (value == "")
					curResult = false;
				else {
					//alert(validType);
					switch (validType) {
						case "mailQueue":				//校验E-mailQueue
							var pattern = /^[_a-zA-Z0-9\-]+(\.[_a-zA-Z0-9\-]*)*@[a-zA-Z0-9\-]+([\.][a-zA-Z0-9\-]+)+$/;
							curResult = RegExp(pattern).test(value);
							break;
						case "equal":		//必需和某个值相等
							curResult = value == $(validValue).val();
							break;
						case "length":   //不能少于指定长度
							curResult = valueIsBewtten(value.length, validValue);
							break;
						case "intRange":
						case "range":
							//校验为int型，则不允许包括.
							if (validType == "minMaxInt" && !value.isInt())
								curResult = false;
							else {
								curResult = valueIsBewtten(value, validValue);
							}
							/*
							 var arrVal = validValue.split("|");
							 value = parseFloat(value);
							 //前面的校验通过，则校验是否为非数字
							 if (curResult && isNaN(value)) curResult = false;
							 //校验是否大于等于最小值
							 if (curResult && arrVal[0] != "") curResult = value >= parseFloat(arrVal[0]);
							 //校验是否小于等于最大值
							 if (curResult && arrVal.length == 2 && arrVal[1] != "") curResult = value <= parseFloat(arrVal[1]);
							 */
							break;
					}
				}
			}
			$.callEvent(onValid, [obj, curResult, validType, validValue]);
			//只要有任何一个校验通不过，则result为false
			if (!curResult) result = false;
			//校验抵账，且exitWhenFalid为true，则退出each
			if (!curResult && exitWhenFalid) break;
		};
		return result;
	}
})(MF);


