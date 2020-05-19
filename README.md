## 运行
* 启动 脚本错误监控

  - bash: npm run start
  - open: http://localhost:8055/
          http://localhost:8066/

* 异常数据会存入./logs/xxx.js 文件

------------------------------------------------------------

## 前端代码异常监控

###前言: JS异常处理简介

每天调试会看到控制台各种各式的红色错误代码。

JavaScript错误是怎么输出到控制台的  ——   JavaScript的错误处理原理。


当抛出异常时，JavaScript解释器会立即停下当前正在执行的逻辑，并且跳到最近的异常处理程序（可以参考冒泡与变量作用域的相关概念。一句话简单理解：儿子犯了错误，找老子，一层一层往上找，直到找到能够承担错误的对象为止）。如果在所有的词法结构和调用栈上面没有找到错误处理程序。JavaScript就会把异常当做程序错误处理，并报告给用户。

>只要有异常对象抛出，不管是浏览器抛出的，还是代码主动抛出，都会让程序停止执行。如果想让程序继续执行，则有也可以用try…catch来捕获。


```
<script>
  error
  console.log('永远不会执行');
</script>
<script>
  console.log('我继续执行')
</script>
```

> 1.当前代码块将作为一个任务压入任务队列中，JavaScript线程会不断地从任务队列中提取任务执行；

>2.当任务执行过程中报异常，且异常没有捕获处理，则会一路沿着调用栈从顶到底抛出，最终终止当前任务的执行；

>3.JavaScript线程会继续从任务队列中提取下一个任务继续执行。



### 一、收集日志的方法

平时收集日志的手段，可以归类为两个方面，一个是逻辑中的错误判断，为主动判断；一个是利用语言给我们提供的捷径，暴力式获取错误信息，如 try..catch 和 window.onerror。

##### 1. 主动判断

我们在一些运算之后，得到一个期望的结果，然而结果不是我们想要的

```
// test.js
function calc(){
  // sth code...
  return val;
}
if(calc() !== "someVal"){
  Reporter.send(xxx);
}
```

这种属于逻辑错误/状态错误的反馈，在接口状态判断中用的比较多。

#####2. try..catch 捕获
判断一个代码段中存在的错误：

```
try {
  init();
  // code...
} catch(e){
  Reporter.send(format(e));
}
```

以 init 为程序的入口，代码中所有同步执行出现的错误都会被捕获，这种方式也可以很好的避免程序刚跑起来就挂掉。

##### 3. window.onerror
```
window.onerror = function() {
  var errInfo = format(arguments);
  Reporter.send(errInfo);
  return true;
};
```
(上文中返回true时，便不会把错误暴露在控制台中)

### 二、会出现的问题或注意事项或解决办法

##### 无具体报错信息，只有Script error

>需要设置 crossorigin 并且服务器要设置 Access-Control-Allow-Origin 的响应头(被引用的资源链)：

```
<script src="http://localhost/test.js" crossorigin></script>
```

>这种简单报错： Script error，目的是避免数据泄露到不安全的域中

>crossOrigin参数 跳过跨域限制
image 和 script 标签都有此参数，它的作用就是告诉浏览器，我要加载一个外域的资源，并且我信任这个资源。


- 还可以用try catch进行包裹
- 当然，你可以可以对try catch 进行重写（浏览器不会去try catch起来的异常进行跨域拦截）

```
const originAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = (type, listener, options) => {
  const wrappedListener = (...args) => {
    try {
      return listener.apply(this, args)
    } catch (error) {
      // 拿到error 信息统一进行处理
      throw error
    }
  }

  return originAddEventListener.call(this, type, wrappedListener, options)
}
```

- 上面改写了 EventTarget 的 addEventListener 方法，对传入的 listener 进行包装，返回包装过的 listener，对其执行进行 try-catch；浏览器不会对 try-catch 起来的异常进行跨域拦截，所以 catch 到的时候，是有堆栈信息的；重新 throw 出来异常的时候，执行的是同域代码，所以 window.onerror 捕获的时候不会丢失堆栈信息；




- 当静态资源服务器可以添加 Access-Control-Allow-Origin: * 时，我们可以直接使用window.onerror进行全局异常捕获；当静态资源服务器不受控制，window.onerror失效，我们可以借助AST技术，自动化地对全部目标Javascript函数添加try catch来捕获所有异常。

##### 关于 try..catch 的使用
对于 try..catch 的使用，一般建议是：能不用，尽量不要用。JS代码都是自己写出来的，哪里会出现问题，会出现什么问题，心中应该都有个谱，平时用到 try..catch 的一般只有两个地方：

```
// JSON 格式不对
try{
  JSON.parse(JSONString);
}catch(e){}

// 存在不可 decode 的字符
try{
  decodeComponentURI(string);
}catch(e){}
```

不能捕获异步的错误，promise、setTimeout等异常

```
try {
    console.log(1);
    setTimeout(function () {
        console.log(2);
        JSON.parse('{{}');
    }, 1000);
    console.log(3);
} catch (err) {
    console.log('55'); //是捕获不到的
}
console.log(4);
```



##### 关于window.onerror 的使用

```
// test.js
throw new Error("SHOW ME");
window.onerror = function(){
	console.log(arguments);
	// 阻止在控制台中打印错误信息
	return true;
};
```

上面的代码直接报错了，没有继续往下执行。页面中可能有好几个 script 标签，但是 window.onerror 这个错误监听一定要放到最前头！



#### 如何监听promise错误
（关于事件 unhandledrejection、rejectionhandled）

>h5新增的事件；

##### unhandledrejection
当Promise 被reject并且没有得到处理的时候，会触发unhandledrejection事件。
unhandledrejection继承自PromiseRejectionEvent，PromiseRejectionEvent又继承自Event。因此unhandledrejection含有PromiseRejectionEvent和Event的属性和方法。

##### rejectionhandled
当一个Promise错误最初未被处理，但是稍后又得到了处理，则会触发rejectionhandled事件。


```
window.addEventListener('error', error => {
    debugger;
    console.log('error 监听',error); // 不会触发,这里不会
});

window.addEventListener('unhandledrejection', event => {
    debugger;
    console.log(event.reason); // 打印"啦啦啦啦 reject"
});
window.addEventListener('rejectionhandled', event => {
    debugger;
    console.log('rejection handled');
});
function foo() {
    return Promise.reject('啦啦啦啦 reject');
}
var r = foo();

setTimeout(() => {
    r.catch(e => { });
}, 1000);
```


##### async/await 和捕获异常

作为异步的中级方案，catch异常也是很简单的。

```
var sleep = function (time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject('error');
        }, time);
    })
};

var func = async function () {
    try {
        console.log('start');
        await sleep(1000); // 这里得到了一个返回错误
        
        // 所以以下代码不会被执行了
        console.log('end');
    } catch (err) {
        console.log('catch内容：', err); // 这里捕捉到错误 `error`
    }
};

func();

```


#####有iframe的页面怎么监听？
* 同源

```
window.frames[0].onerror = function (msg, url, row, col, error) {
    console.log({
      msg,  url,  row, col, error
    })
    return true;
};
```
* 非同源（包括可控与不可控）
可控的类似可以实行跨域那一套。postMessage等等。

略



#### 关于网络请求的
由于网络请求异常不会冒泡，因此必须在capture阶段捕获才可以。但还有一个问题是这种方式无法精确判断异常的HTTP状态是404还是500等，因此还是要配合服务端日志来排查分析才可以。

所以，这种情况下onerror 是无法帮助我们捕获到异常的

```

<script>
  window.onerror = function (msg, url, row, col, error) {
    console.log('我知道异步错误了');
    console.log({
      msg,  url,  row, col, error
    })
    return true;
  };
</script>
//html
<img src="./404.png">
```


必须要：

```
window.addEventListener("error", function(e){
	// Do something
    console.log(e.bubbles) // 回显false
}, true);

window.addEventListener("error", function(e){
    // Do something
    console.log(e.bubbles) // 回显false
}, false);

//html
<img src="404.jpg"/>
```




## 定位错误
我们的业务代码经webpack、gulp等打包压缩后产生如下代码：

```
!function(n){function t(e){if(r[e])return r[e].exports;var o=r[e]={i:e,l:!1,exports:{}};
```

在控制台会看到对应的数据：
代码如期报错，并上报相关信息

```
{ msg: 'Uncaught ReferenceError: xxx is not defined',
  url: 'http://xxx/xxx.min.js',
  row: '10',
  col: '1000' }
```


结合压缩后的代码，肉眼观察很难定位出具体问题


那我们如何定位到错误呢？

方法一：不压缩 js 代码

方法二：将压缩代码中分号变成换行

方案三：js 代码半压缩(保留空格和换行)


uglifyjs 的另一配置参数 beautify 设置为 true 时，最终代码将呈现压缩后进行格式化的效果（保留空格和换行），如


方案四：SourceMap 快速定位

>我们目前的办法是用chrome的DevTools这样的辅助工具。而且并不是每个线上资源都会添加 sourceMap 文件

##### sourceMap
SourceMap 是一个信息文件，存储着源文件的信息及源文件与处理后文件的映射关系。 里面储存着位置信息。也就是说，转换后的代码的每一个位置，所对应的转换前的位置。

我们在定位压缩代码的报错时，可以通过错误信息的行列数与对应的 SourceMap 文件，处理后得到源文件的具体错误信息。

打开Source map文件，它大概是这个样子

```
{
	version : 3,
　　file: "out.js",
　　sourceRoot : "",
　　sources: ["a.js", "b.js"],
　　names: ["src", "maps", "are", "fun"],
　　mappings: "AAgBC,SAAQ,CAAEA"
}
```

- version：Source map的版本，目前为3。
- file：转换后的文件名。
- sourceRoot：转换前的文件所在的目录。如果与转换前的文件在同一目录，该项为空。
- sources：转换前的文件。该项是一个数组，表示可能存在多个文件合并。
- names：转换前的所有变量名和属性名。
- mappings：记录位置信息的字符串。


应用举例：

```
var fs = require('fs');
var sourceMap = require('source-map');

// map文件
var rawSourceMapJsonData = fs.readFileSync('./index.min.js.map', 'utf-8')
rawSourceMapJsonData = JSON.parse(rawSourceMapJsonData)

var consumer = new sourceMap.SourceMapConsumer(rawSourceMapJsonData);

// 得到真实错误位置
console.log(consumer.originalPositionFor({line: 1, column: 100}))
```


[阮一峰JavaScript Source Map 详解](http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html)
