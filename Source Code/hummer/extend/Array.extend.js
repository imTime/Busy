/*
	修改日志:
		2012-08-04 修改了forEach函数，因为ECScript5已经有这个函数，所以要与此函数完全一样，参数的位置作了调整。
*/

//交换数组两个值的位置
Array.prototype.swapPosition = function(from, to){
	var fromValue = this[from];
	var toValue = this[to];
	this[from] = toValue;
	this[to] = fromValue;
};


//判断是否为一个序列数组
Array.prototype.isSerialNumber = function(step){
	if(step === undefined) step = 1;
	var arr = this.sort(), result;		//从小到大排序

	//如果step为0，则判断所有数字是否一样，只需要判断第一个和最后一个是否相等就可以了
	if(step == 0){
		return arr[0] == arr[arr.length - 1];	
	};
	
	for(var i = 0; i < arr.length - 1; i ++){
		result = (arr[i] + step == arr[i + step]);
		if(!result) return false;
	};
	return true;
};

//遍历比较，一至返回-1，大于返回1，小于返回0，必需保存数组全部是number类型
Array.prototype.compare = function(target){
	var aLen = this.length, bLen = target.length;
	if(aLen != aLen) return Number(aLen > bLen);
	
	var fn = function(a, b){return b - a};
	var arr1 = this.sort(fn);
	var arr2 = target.sort(fn);
	
	for(var i = 0; i < arr1.length; i ++){
		if(arr1[i] != arr2[i]){
			return Number(arr1[i] > arr2[i]);
		};
	};
	
	return -1;
};

//对数组进行随机排序
Array.prototype.randomSort = function(){
	return this.sort(function(a, b){
		return Math.random() > 0.5 ? -1 : 1;
	});
};

//对数组进行求和，要求数组中的数据全部是数字
Array.prototype.sum = function(fn){
	var result = 0;
	this.forEach(function(element){
		result += (fn) ? fn(element) : element;
	});
	return result;
}

//获取数组最大值和最小值，要求全部是数字，如果不是数字的话，则要使用回调函数处理
Array.prototype.minMax = function(fn){
	if(this.length == 0) return false;
	var arr = this.slice();
	arr = arr.sort(function(a, b){
		if(fn) return fn;
		return a > b ? 1 : -1;
	});
	return {
		min: arr[0],
		max: arr[arr.length - 1]
	}
};

/*
	迭代数组
	@params {Function} fn， 回调函数，示例
 */
Array.prototype.forEach = function(callback, that){
	for(var i = 0; i < this.length; i ++){
		//fn(i, this[i]);
		if(callback.call(that, this[i], i, this)) break;
	}
}

//查找某个元素
Array.prototype.find = function(target, that){
	var result = -1;
	this.forEach(function(item, index){
		//如果是函数，则回调
		var find = false;
		if(typeof(target) == "function"){
			find = target.call(that, item, index);
		}else{
			find = item == target;
		};

		if(find){
			result = index;
			return true;
		};
	});
	return result;
}
/*
//for each数组
Array.prototype.forEach = function(fn){
	for(var i = 0; i < this.length; i ++){
		//fn(i, this[i]);
		if(fn.call(this[i], i, this[i])) break;
	}
}
*/


//搜索数组中的某个项
Array.prototype.indexOf = function(item, callback){
	for(var i = 0; i < this.length; i ++){
		if(callback){
			if(callback(this[i], item)){
				return i;
				break;
			}
		}else{
			if(item == this[i]){
				return i;
				break;
			}
		}
	}
	return -1;
}

//在数据搜索数组，并将搜索结果回调fn
//fu(是否找到, Array的索引，findArray的索引[没有找回则是-1])
Array.prototype.searchArray = function(findArray, fn){
	var result;
	for(var i = 0; i < this.length; i ++){
		result = findArray.indexOf(this[i]);
		fn(result != -1, i, result);
	};
}

//根据索引删除数组
Array.prototype.removeAt = function(index){
	this.splice(index, 1);
	return this;
	if(index == this.length - 1) return this.pop();
	if(index == 0) return this.shift();	
	
	if (index < this.length && index >= 0) {
		var arr = this.slice(0, index).concat(this.slice(index + 1));
		this.length = 0;
		
		for(var i = 0; i < arr.length; i ++){
			this.push(arr[i]);
		}
	}
	//return this;
}
