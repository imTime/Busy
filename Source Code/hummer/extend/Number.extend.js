
Number.prototype.isInt = function(){
	return Math.round(this) == this;
};

/*
 * 给时间
 */
Number.prototype.dateAdd = function(expr){
	var result = expr.dateExpression();
	var tick = {
		ms: 1,
		s: 1000,
		m: 1000 * 60,
		h: 1000 * 60 * 60,
		d: 24 * 1000 * 60 * 60
	};
	tick.w = tick.d * 7;
	var v = tick[result.interval];
	if(v) return this + result.number * v;
	return this;
};

//是否为合法的日期的数字
Number.prototype.validDate = function(){
	var bound = 100000000 * 86400000;
	return this.inRange(-bound, bound);
};

//将秒转换为具体的时长(多少天多少小时多少分多少秒)
Number.prototype.secondConverter = function(){
	var tick ={
		d: 60 * 60 * 24,
		h: 60 * 60,
		m: 60
	};

	var result = {}, second  = this;
	for(var key in tick){
		result[key] = Math.floor(second / tick[key]);
		second -= result[key] * tick[key];
	};
	result.s = second;
	return result;
};

Number.prototype.to12Hour = function(){
	var h = this;
	if(h.hourIsPM()) h = h - 12;
	return h;
};

Number.prototype.hourIsPM = function(){
	return this > 12;
}

Number.prototype.to24Hour = function(isPM){
	return isPM ? this + 12 : this;
};

//与另一个值相比较，如果等于返回-1，大于返回1，小于返回0
Number.prototype.compare = function(value){
	if(this == value) return -1;
	return Number(this > value);
};

//如果当前值大于最大值，则取最大值，如果小于最小值，则取最小值
Number.prototype.withinRange = function(min, max){
	return Math.max(min, Math.min(this, max));
};

/*
 * expr示例：0,000.00 ,表示分隔数字的位置，
 * .后面的表示小数位，没有点表示没有小数，点后面没有表示自动
 * 整数最后一位或者小数的最一位为1时表示需要四舍五入，为0表示自然截断
 * 如：.00表示整数部分不处理，保留两位小数，自然截断
 * 0,000.1：整数部分千分位用逗号分隔，小数部分保留一位小数，四舍五入
 * 0:取整数自然截断，1：取整数四舍五入
 * 0,000.:整数部分千分位用逗号分隔，小数部分不处理
 * 格式化错误返回false
 */
Number.prototype.format = function(expr){
	var result = this.toString();
	if(!expr) return result;
	var dotIndex = result.indexOf(".");
	//分离表达式
	var arr = expr.split(".");
	var intExpr = arr[0], decExpr = arr[1];
	var len;

	//处理小数部分
	if(decExpr == undefined){
		//四舍五入
		if(result.test(/1$/)){
			result = this.toFixed(0);
		}else{
			result = result.substr(0, dotIndex);
		}
	}else{
		len = decExpr.length;
		if(decExpr.test(/1$/)){
			result = this.toFixed(len);
		}else{
			result = this.toString();
			result = result.substr(0, dotIndex + len + 1);
		}
	}
	result = result.toString();

	//处理整数部分
	if(intExpr){
		//如果表达式最后一位是1则将整数四舍五入
		if(intExpr.test(/([^0-9])(\d+)/)){
			var splitor = RegExp.$1;
			len = RegExp.$2.length;
			var pattern = "(\\d{1," + len + "})(?=(\\d{" + len + "})+(?:$|\\D))";
			result = result.replace(new RegExp(pattern, "g"),"$1" + splitor);
		}
	};
	return result;
};


//截取小数后的N位
Number.prototype.clip = function(digit){
	if(digit == undefined) digit = 2;
	return Math.round(this * Math.pow(10, digit))/Math.pow(10, digit);
};

/*
 * 将数字转换为钱币的形式
 * 所保留的两个参数是为了兼容以前的程序，现在采用字符串的方式
 */
Number.prototype.currency = function(digit, symbol){
	//新的转换方式
	if(typeof(digit) == "string"){
		//提取货币符号
		symbol = digit.replace(/[0-9\.,]/ig, "");
		//提取表达式
		var expr = digit.replace(/[^0-9\.,]/ig, "");
		return symbol + this.format(expr);
	};

	//旧的转换方式 
	var result = this;
	symbol = symbol || "";
	if(digit == undefined) digit = 2;
	result = result.toFixed(digit).toString();
	return symbol + result.replace(/(\d{1,3})(?=(\d{3})+(?:$|\D))/g,"$1,");
}

Number.prototype.inRange = function(min, max){
	return this >= min && this <= max;
}
//将整型转换为日期
Number.prototype.unixtimeToDate = function() {
	var date = new Date(this * 1000);
	return date;
}

//给数字补0，返回字符串，prefix：是否前置
Number.prototype.zeroize = function(digit, prefix) {
	var result = this.toString();
	var len = digit - result.length;
	len = Math.max(0, len);

	var zero = "";
	for (var i = 0; i < len; i++) {
		zero += "0";
	}

	if (prefix) {
		return zero + result;
	} else {
		return result + zero;
	}
}