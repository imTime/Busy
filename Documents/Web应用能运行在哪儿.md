#[Solo]imTime跨平台项目经验分享—Web应用能运行在哪儿？
##聊一聊Javascript

我对Javascript这种语言一直情用独钟，事实上我Javascript的技术水平并不怎么样，我更多的时候是花在怎么实现功能上，而非对语言的研究，包括其它很多语言也是一样，我都是半吊子。当然同样半吊子的还有我的设计水平和产品能力。

2011年我就开始关注Node.JS，这一年我一直在用Javascript/HTML5/CSS3在iOS上做混合开发，当微软将Javascript作为Windows8/Windows Phone的开发语言的时候，我肯定，Javascript将会大放异彩。自从Apple将软件App化之后，传统的大型软件将会限于专业人士使用，而对多数用户来说，轻巧、功能单一、价格低廉的App将会是最好的选择。

##多平台解决方案

自从有了Node.JS这个优秀的项目，Javascript能运行几乎所有的设备和平台上，当然Nokia的功能机除外，但我想功能机的用户最终将和IE6一样会被抛弃。主流浏览器的Javascript性能都非常强劲，IE10也有不俗的表现，国内IE的份额较，但很快这种局面将会被360和搜狐之类的双核浏览器改写。

借助混合开发技术，我们可以Web+Native的方式低成本实现，最重要的是，后期的维护更简单，快速响应能力被大大的提高。比如说现在imTime某个地方有个小Bug，我改完Bug只需要启用自动化部署代码，两小时内可以发布到多个平台。实际上我还可以将部署的自动化程序提高，基本上就是改完并测试之后，敲入一个命令，所以产品都被打包出来了。

其实我们老讲HTML5，主要还是CSS3和Javascript的性能，特别是CSS3才是重中之重，HTML5无非是一个主义化的标签而已。当然HTML5的Canvas和本地存储缓存等功能也非常有用，但我认为CSS3的动画才是开发模拟Native的重点。

###iPhone/iTouch/iPad

以我目前的经验，iOS上的混合开发应用表现得非常优秀，在iTouch第四代和iPhone 4/iPad2上表现优秀，目前低于这个版本的设备基本上已经很少了。CSS3

###Android/Pad/Kindle
我对Android手机的使用不多，但我最近看到华为的千元低端机表现得也非常流畅，同样是webkit的内核，表现不会太差。2010年的时候我在G3上开发过Web项目，虽然不如iOS，但总体来说还是不错的，现在当然会更好。

###Windows Phone/Pad

我目前还没有做Windows Phone的App开发，虽然我去年交了99刀，最后一个软件也没有写。但从Windows Phone 7.5访问网页的表现来看，虽然不如iOS，但性能已经十分优秀，就是对CSS3的支持度还有所欠缺。

###浏览器

除了天杀的IE6/7/8，特别是IE6，其它主流的浏览器都非常捧。各种浏览器的扩展开发也非常方便，Firefox的XUL要麻烦一点，但是Firefox3.6开始，可以借助JetPack开发扩展，和Chrome没什么差别了。要实现复杂的功能可以使用XUL，真的是丰俭由已。

Opera自从11开始支持扩展，Safari自从5开始支持扩展，并且Safari扩展的开发现在是不需要付年费的。幸运的是，我们都可以用HTML5/CSS3/Javascript开发扩展。

国内的浏览器主要是Chrome系浏览器和Maxhon两种，前者基本或者完全兼容Chrome插件，后者开发起来要麻烦一点。

###Windows

Windows上我们分为两种情况，第一种是XP/Vista/Win7，更早前的Windows不用考虑了，基本上份额很小。第二种是Windows 8。Win8就好说了，因为Win8本来是把Javascript作为主要的原生开发语言的，甚至它会支持jQuery，所以基本上你不用改太多的代码就能把应用发布到Windows Marketplace上去。

对于传统的Windows系统，我认为有两种解决方案可以使用，第一种是借助Adobe AIR，我目前暂时也是用这种解决方案。这种解决方案就是代码量少，并且可以运行在Mac/Linux/Windows三个平台上。但很明显，你的控制能力会比较差一些。

还有第二种方案，我们可以用C#+Webkit.Net的方式，其实这种解决方案本质来说，和Adobe AIR以及iOS+UIWebview没什么区别。这种方式你可以获得更多的权限，借助C#，你可以做任何你想做的事。

### Mac OSX

Mac上的解决方案和Windows其实是一样的，一种为Adobe AIR，另一种是UIWebView + Web的方式，借助`NSCachedURLResponse`。后者是可以打包发布到Mac App Store收费的，当然实现成本会高一些。通过UIWebView这个桥梁，你可以像调用本地代码一样调用任何功能，比如说调用用户的相机。

### Linux

Linux我目前还是采用Adobe AIR，当然也可以用WebKit的方式封装，我想这个不会太难，但我自己确实没有Linux下的开发经验，只能凭常识判断。

### Firefox OS/WebOS

Firefox OS其实很简单，因为它本身就是基于HTML5的，开发应用也很简单，设置好配置文件和缓存基本上就行了。WebOS也是基于HTML5的，所以也没什么问题，但是WebOS前景不明，有时间做做也不是不可以，反正花的时间不多。

### 其它第三方平台

现在主流的第三方平台，还没有不支持Javascript的，PHP和Javascript基本上是标配了，不管是新浪微博还是Facebook，而且调用基本上都比较简单。