/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:09 下午
 * To change this template use File | Settings | File Templates.
 */
/*
 * 对DOM的操作
*/


//对纯DOM操作的扩展


//节点的类型
nodeType: {
	text: 3,
		element: 1,
		comments: 8
},
//交换两个元素
swap: function(from, to){
	//to的下一个节点
	var next = to.nextSibling;
	var toParent = to.parentNode;
	var fromParent = from.parentNode;
	//把from插到to之前
	fromParent.insertBefore(to, from);
	//有下一个节点，则在下一个节点前插入
	if(next){
		toParent.insertBefore(from, next);
	}else{
		toParent.appendChild(from);
	}
},
//是否为文本节点
isTextNode: function(node){
	return node.nodeType == this.nodeType.text;
},
css: function(obj, attrib, value){
	if (typeof attrib == 'string' && value === undefined) {
		if(obj.style && obj.style[attrib]){
			return obj.style[attrib];
		}else{
			return window.getComputedStyle(obj, null).getPropertyValue(attrib);
		};
	}

	if (typeof attrib != 'object') {
		var tmp = attrib;
		attrib = {};
		attrib[tmp] = value;
	}

	//设置每一个的样式
	for (var i in attrib) {
		value = attrib[i];
		if(value == null){
			obj.style.removeProperty(i);
			continue;
		}
		//如果值是数字，都给加上px的单位，这点要注意，和jquery不一样，没有再去做各种匹配了
		if((/^(width|height|top|left)$/ig.test(i) || /margin|padding/ig.test(i))
			&& typeof(value) == "number"){
			value = value + "px";
		};
		obj.style[i] = value;
	}
},
//获取节点的的属性
attr: function(node, key, value){
	if(value === undefined){
		var attr = node.attributes[key];
		return attr ? attr.value : "";
	}
	if(value == null) node.removeAttribute(key);		//删除属性
	node.setAttribute(key, value);								//设置属性
},
//检查某个节点在父节点的索引
index: function(node){
	var index = 0, children = node.parentNode.childNodes;
	for(var i = 0; i < children.length; i ++){
		if(node == children[i]) return i;
	}
	return index;
},
toggleStyle: function(node, key, value){
	//样式存在
	if(node.style[key] == value){
		node.style[key] = "";
	}else{
		node.style[key] = value;
	}
},
//获取element，如果是text节点，则返回上级节点
getElement: function(node){
	if(node.nodeType == this.nodeType.text){
		node = node.parentNode;
	};
	return node;
},
//替换节点的tag
replaceTag: function(target, tag, cloneStyle){
	var node = this.insertNode(tag, target, true);
	//文本节点
	if(target.nodeType == this.nodeType.text){
		node.appendChild(target);
	}else{
		while(target.firstChild){
			node.appendChild(target.firstChild);
		};

		//克隆样式
		if(cloneStyle) this.cloneStyle(target, node);
		target.parentNode.replaceChild(node, target);
	};
	return node;
},
//根据条件，查找父级节点
findParent: function(target, condition){
	if(target == condition.root) return condition.root;
	var parent = target.parentNode;
	while(parent && parent != document.body){
		if(this.isNode(parent, condition) || parent == condition.root) return parent;
		parent = parent.parentNode;
	};
	return false;
},
//查找一个节点在父节点的索引索引位置
indexOf: function(node){
	var children = node.parentNode.childNodes;
	var count = children.length;
	if(count == 0) return 0;

	for(var i = 0; i < count; i ++){
		if(children[i].isEqualNode(node)) return i;
	};

	return -1;
},
//添加一个孩子节点
addChild: function(parent, tag, cloneStyle){
	tag = tag || parent.nodeName;
	var node = document.createElement(tag);
	parent.appendChild(node);
	if(cloneStyle) this.cloneStyle(parent, node);
	return node;
},
//添加一个兄弟节点, 如果tag为空，则添加一个同类型的节点, cloneStyle: 是否复制源的style样式
addSibling: function(target, tag, cloneStyle){
	tag = tag || target.nodeName;
	return this.addChild(target.parentNode, tag, cloneStyle);
},
//删除所有孩子节点
removeChildren: function(target){
	target.innerHTML = "";
},
//删除自身节点
removeSelf: function(target){
	target.parentNode.removeChild(target);
},
/*
 * 删除文本节点指定长度的内容
 * 完成删除，返回0或以下，否则返回未删除的长度
 * 节点不是文本节点，返回false
 */
deleteTextNode: function(target, start, length, removeEmpty){
	if(target.nodeType != this.nodeType.text) return false;
	var textLen = this.nodeTextLength(target);
	var result = length - (textLen - start);
	target.deleteData(start, length);

	//如果文本节点已经被清空，则删除这个节点
	if(removeEmpty && start == 0 && length >= textLen){
		this.removeSelf(target);
	};
	return result;
},
//获取一个节点文本的长度
nodeTextLength: function(target){
	var text;
	if(target.nodeType == this.nodeType.text){
		text = target.wholeText;
	}else{
		text = target.innerText;
	};
	text = text || "";
	return text.decodeHtml().length;
},
//在一个节点的前面或者后面插入一个节点
insertNode: function(newNode, existing, before){
	var node = newNode, parent = existing.parentNode;
	//newNode只是一个标签
	if(typeof(newNode) == "string") node = document.createElement(newNode);
	if(before){
		parent.insertBefore(node, existing);
	}else{
		//在最后一个添加
		if(parent.lastChild == existing){
			parent.appendChild(node);
		}else{
			parent.insertBefore(node, existing.nextSibling);
		}
	};
	return node;
},
/*
 分隔一个节点
 parent: 父节点
 node，要分隔的节点，这个节点一定要是一个文本节点
 location：文本节点分隔的位置
 */
nodeSplitor: function(parent, node, location){
	//先克隆一个对象，然后递归查找，找到node之后
	var range = this.getRange(node, location, parent);
	//range.setStart(node, location);
	//range.setEnd(parent, parent.childNodes.length);
	var wraper = parent.cloneNode(false);
	wraper.appendChild(range.extractContents());
	this.insertNode(wraper, parent);
	range.detach();
},
//用新的Node，替换掉原来的Node
replaceNode: function(newNode, existing){
	var node = this.insertNode(newNode, existing);
	this.removeSelf(existing);
	return node;
},
/*
 获取节点内文本的长度，如果节点本身是p或者li，则要加上换行的长度
 如果节点本身是文本节点，且父级节点只能一个子节点，则要判断是否为p或者li
 空白的p和li忽略
 节点不能包含注释，否则计算不准
 */
getTextLength: function(target){
	var type = target.nodeType;
	var tag = false, text = "", length = 0, offset = 0;

	switch(type){
		case this.nodeType.element:
			text = target.innerText;
			//如果不是空白节点，则需要统计tag是否为p和li
			tag = target.nodeName;
			if(this.isTag(tag, /^br$/ig)){
				length = 1;
			}else if(target.childNodes.length == 0){
				tag = false;
			}
			break;
		case this.nodeType.text:
			text = target.wholeText;
			var parent = target.parentNode;
			if(parent.childNodes.length == 1){
				tag = parent.nodeName;
			};
			break;
		default:
			return length;
			break;
	};

	length += text.length;

	/*
	 if(tag){
	 if($.dom.isTag(tag, /^p$/ig)){
	 offset = 1;
	 }else if($.dom.isTag(tag, /^li$/ig)){
	 offset = 1;
	 }

	 if($.dom.isTag(tag, /^br$/ig)){
	 console.log(tag);
	 };
	 };
	 */
	//if(tag && $.dom.isTag(tag, /^p|li|br$/ig)) offset = 1;
	//br不用offset，之前已经设置length为1了
	if(tag && $.dom.isTag(tag, /^p|li$/ig)) offset = 1;
	if(tag && $.dom.isTag(tag, /^ul$/ig)){
		offset = 1;
	};

	return {
		length: length,
		offset: offset
	};
},
//判断nodeName是否符合
isTag: function(target, expr){
	if(!target || this.isTextNode(target)) return false;
	var tag = target;
	if(typeof(target) == "object") tag =  target.nodeName;
	return tag.test(expr, "ig");
},
//克隆一个节点的样式到另一个节点
cloneStyle: function(source, target, removeExist){
	if(!source.style || source.style.length == 0) return;
	for(var key in source.style){
		target.style[key] = source.style[key];
	}
},
//克隆一个节点的所有属性到另一个节点，但不包括id
cloneAttr: function(source, target){
	var attr, attrs = source.attributes;
	for(var key in attrs){
		attr = attrs[key];
		if(attr.nodeType == 2 && !/^$id/ig.test(attr.name)){
			target.attributes[attr.name] = attr.value;
		}
	}
},
//查找孩子节点，找到立即返回
findChild: function(parent, condition){
	var children = parent.childNodes;
	var node, result = false;
	for(var i = 0; i < children.length; i++){
		node = children[i];
		result = this.isNode(node, condition);
		if(result){
			return node;
		}else{
			result = this.findChild(node, condition);
			if(result) return result;
		};
	};
	return false;
},
/*
 * 由里向外查找节点，direction表明查找方向，如果向后查找，则忽略自己和父级前面的节点
 */
forthSearch: function(node, isNext, callback){
	var sibling = node, stop = false;
	if(node == document) return;			//最多查找到document级
	//先检查node
	//stop = callback(node);
	//if(stop) return;
	//查找所有的兄弟节点
	do{
		sibling = isNext ? sibling.nextSibling : sibling.previousSibling;
		if(sibling) stop = callback(sibling);
		if(stop) return;
	}while(sibling);

	//继续查找上级节点
	this.forthSearch(node.parentNode, isNext, callback);
},
/*
 * 查找一个节点的兄弟节点，如果没找到，则查找父亲的兄弟节点，一直找到为止
 */
findSibling: function(node, isNext){
	var sibling = node;
	do{
		sibling = isNext ? sibling.nextSibling : sibling.previousSibling;
		if(sibling) return sibling;				//如果找到，直接返回
	}while(sibling);

	return sibling || this.findSibling(node.parentNode, isNext);
},
/*
 *合并节点，把target所有的子节点，合并到source
 */
mergeNode: function(source, target, removeTarget){
	var children = target.cloneNode(true).childNodes;
	var child, last, count = children.length;
	var nText = this.nodeType.text;
	for(var i = 0; i < count; i ++){
		child = children[0];
		last = source.lastChild;
		if(last && last.nodeType == nText && child.nodeType == nText){
			last.appendData(child.data);
		}else{
			source.appendChild(child);
		}
	};
	if(removeTarget) this.removeSelf(target);
},
//统计某个元素下有多少个指定标签的子元素
countTag: function(target, tags){
	var result = 0;
	if(typeof(tags) == "string") tags = [tags];

	for(var i = 0; i < tags.length; i ++){
		result += target.querySelectorAll(tags[i]).length;
	};

	return result;
},
/*
 * @description		判断Node是否符合指定的条件
 * @return {Boolean} 是否符合条件
 * @param {HTMLElement} node 节点
 * @param {JSON} condition 匹配的条件(id/children/tag)
 */
isNode: function(node, condition){
	var result = true;
	//匹配id
	if(condition.id) result = node.id == condition.id;
	//匹配标签
	if(result && condition.tag) result = this.isTag(node, condition.tag, "ig");

	//匹配孩子节点是否符合数量
	if(result && condition.children != undefined){
		result = node.childNodes.length == condition.children;
	};
	//匹配节点类型
	if(result && condition.nodeType) result = node.nodeType == condition.nodeType;
	//匹配节点
	if(result && condition.node){
		result = node == condition.node;
	}

	return result;
},
/*
 * @description		判断Node是否是parent的边界节点(第一个或者最后一个)
 * @return {Boolean} 是否符合条件
 * @param {HTMLElement} root 相对于node的根节点
 * @param {HTMLElement} node 节点
 * @param {Boolean} findLast 是否为最后一个节点，不是最后一个就是最前一个，默认为最前一个
 */
isSideNode: function(root, node, findLast){
	var parent = node.parentNode;
	var nodes;
	while(!parent || parent == root){
		nodes = parent.childNodes;
		parent = parent.parentNode;
		if(nodes.length <= 1) continue;			//如果没有子节点或者只有一个子节点，肯定是边际节点
		if((findLast && node != nodes[nodes.length - 1]) ||
			(!findLast && node != nodes[0])) return false;

	};
	return true;
},
//查找第一个或者最后一个孩子
findSideChild: function(parent, findLast){
	//if(!parent) return false;
	var children = parent.childNodes;
	var count = children.length;
	//没有孩子节点了
	if(count == 0) return parent;
	//查找第一个节点
	if(!findLast) return this.findSideChild(children[0]);
	//查找最后一个节点
	return this.findSideChild(children[count - 1], findLast);
},
/*
 * @description 根据一个节点，向后查找N个字符，找到这个节点
 * @return {JSON|false} 返回所找到的节点(可能是文本节点或者空节点)和以及位置的偏移量
 * @param {HTMLElement} target 要查找的目标节点，只能是文本节点或其它空节点
 * @param {Integer} index 查找的索引
 * @param {Integer} location 如果target是文本节点，这里标识target中的开始位置
 */
/*
 backwardPosition: function(target, index, location){
 var result = location;

 //如果当前节点是文本节点，检查长度是否足够
 if(target.nodeType == 3){
 result = this.deleteTextNode(target, start, length);
 };

 if(result <= 0){
 //删除自身的节点
 this.deleteNode(target);
 return;
 }

 //还有没删除完，删除后面的兄弟节点(如果需要，则删除父级后面的兄弟节点 )
 var node;
 while(target.nextSibling){
 node = target.nextSibling;
 length = this.deleteChild(node, length);
 if(length <= 0) return 0;
 length = this.deleteAfterSibling(node, length);
 this.deleteNode(node);
 };

 //遍历所有后面的子节点，都没有删完，找父级吧
 if(length > 0){
 node = target.parentNode;
 //靠，都到最高级节点了，没法删了，放弃吧
 if(node == this.lastEdit.root) return 0;
 //继续删除后面的小兄弟们吧
 length = this.deleteAfterSibling(node, length);
 };

 return length;
 },
 */
/*
 * 一共有text/li/span/br/ul五种节点需要统计，其中li和br/ul会产生特殊情况
 * ul，同时有前后节点，则要将innerText的长度+1
 * br, 最后一个节点是br是不计算长度，计算原则是n-1
 * li, 空的li不计算长度，不管多少空的，非空的要+1，当li中只包含一个br只，长度只有1
 * 一个空的ul和li，不产生任何长度
 * 结论：1.li中的最后一个br不计算长度
 * 			 2.空的li的计算长度
 * 			 3.ul必需同时有
 * @description 根据一个文字索引，找到某个这个文字所在的具体节点
 * 一个段落算一个字符，一个br算一个字符
 * @return {JSON|false} 返回所找到的节点(可能是文本节点或者空节点)和以及位置的偏移量
 * @param {HTMLElement} parent 要查找的父级节点
 * @param {Integer} index 查找的索引
 */
findPosition: function(parent, index, inRange){
	//先检查是否有子节点，如果没有子节点，直接返回false
	var children = parent.childNodes;
	var count = children.length;
	if(count == 0) return false;

	//先转换为文本查询，避免重复查询
	var result;
	//不能确定在范围内，检查index是否在文本的长度内
	if(!inRange){
		result = this.positionInRange(parent, index);
		if(!result.inRange) return false;
	};

	//循环每一个节点，查找索引在哪一个节点
	var node, offset = 0, length = 0, newIndex = index, location;
	for(var i = 0; i < count; i ++){
		node = children[i];
		result = this.positionInRange(node, newIndex);

		//找到尾巴了，获取这个节点的下一个节点的第一个文本节点
		if(result.length == newIndex){
			//var sideParent = node.nextSibling;
			var sideParent = node;
			//没有下级节点，则找到父级节点
			if(!sideParent){
				sideParent = node.parentNode;
				result.node = this.findSideChild(sideParent, true);
				var sideLen = this.getTextLength(result.node)
				//location应该在最后的位置
				result.location = sideLen.length;
				//console.log(result.location)
			}else{
				result.node = this.findSideChild(sideParent, true);
				if(this.isTag(result.node, /^br$/ig)){
					result.location = 0;
				}else{
					result.location = this.getTextLength(result.node).length;
				}

				//result.location = 0;
			}

			return result;
		};
		//location = index - result.length;
		//length += result.length;
		if(result && result.inRange){
			//location = result.length - (result.length - index);
			//console.log(location - newIndex);
			//location = result.length - length - index;
			//location = result.length - newIndex;
			if(node.childNodes.length > 0){
				return this.findPosition(node, newIndex , true);
			}else{
				result.location = newIndex;
				//找到的节点
				result.node = node;
				return result;
			};
			break;
		}else{
			//console.log(node, result.offset);
			newIndex -= (result.length + result.offset);
			//console.log(result.length, newIndex);
		};
		/*
		 length += result.length;
		 //console.log(node,result.offset, result.length);
		 if(result.inRange){
		 location = result.length - (length - index);
		 //是否有子节点，如果有，则要递归查找
		 if(node.childNodes.length > 0){
		 //return this.findPosition(node, location , true);
		 }else{
		 result.location = location;
		 //找到的节点
		 result.node = node;
		 return result;
		 };
		 }else{
		 newIndex -= result.length;
		 }*/
	};
	//console.log("最后还剩下：", newIndex);
	//没有找到
	return false;
},

/*
 * @description 检查节点内文本长度是否在是否在指定长度以内
 *
 */
positionInRange: function(node, position){
	var text, type = node.nodeType;
	var offset = 0;			//计算偏移量
	var result = {
		length: 0,		//总的文本长度
		inRange: false
	};

	var textLen = this.getTextLength(node);
	result.length = textLen.length;
	result.offset = textLen.offset;
	result.inRange = position <= textLen.length;
	return result;
},
//获取一个范围
getRange: function(start, startOffset, end, endOffset){
	//开始和结束的偏移量，如果没有设置，就有节点的子节点长度为限
	if(startOffset == undefined || startOffset == null){
		startOffset = start.childNodes.length;
	};

	if(endOffset == undefined || endOffset == null){
		endOffset = end.childNodes.length;
	}

	//开始的offset是0
	if(startOffset == 0){
		var startOffset = this.indexOf(start);
		if(startOffset == 0 && start.nodeType == this.nodeType.text){
			start = start.parentNode;
			startOffset = this.indexOf(start);
		}
		start = start.parentNode;
	};

	//console.log(start, startOffset);
	//console.log(end, endOffset);
	//创建一个范围对象
	var range = document.createRange();
	range.setStart(start, startOffset);
	range.setEnd(end, endOffset);
	return range;
}