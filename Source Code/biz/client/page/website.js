/*
 * 用于普通网站
 */
$(document).ready(function(){
	//- 初始化主要页面
	$.env.language = $("body").attr("lang");
	$.env.client = im.e.Client.WebSite;
	im.page.init();
});