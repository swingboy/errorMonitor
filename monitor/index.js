var fs = require('fs');
var path = require('path');
var koa = require('koa');
var staticServer = require('koa-static');
var cors = require('kcors');
var sourceMap = require('source-map');
var moment = require('moment');
var opn = require('opn');
var resolve = file => path.resolve(__dirname, file);

// koa 入门
// https://www.jianshu.com/p/d38d076b5b83
var config = {
    port: 8055
};
var viewPath = path.join(__filename, '..', 'view');
var staticDir = path.join(__filename, '..', 'staticDir');

// 判断文件是否存在
var fileExist = function(path, cb) {
	return new Promise(function(resolve, reject) {
		if(path) {
			fs.exists(path, function(exists) {
				if(exists) {
					resolve(exists);
				} else {
					reject();
				}
			})
		} else {
			reject();
		}
	})
}

var app = new koa();
app.use(cors());
app.use(staticServer(viewPath));

//错误list
var errlist = [];
var sourcesPathMap = {};
var id = 0;

function getItemFromList(list, obj) {
    var key = Object.keys(obj)[0];
    var val = obj[key];

    var res = null;
    list.map(item => {
        if (item[key] == val) {
            res = item;
        }
    });
    
    return res;
}

function fixPath(filepath) {
    return filepath.replace(/\.[\.\/]+/g, "");
}

// 查找sourcemap
function lookupSourceMap(mapFile, line, column, callback) {
    fs.readFile(mapFile, function(err, data) {
        if(err) {
            console.error(err);
            return;
        }

        var fileContent = data.toString(),
            fileObj = JSON.parse(fileContent),
            sources = fileObj.sources;

        sources.map(item => {
            sourcesPathMap[fixPath(item)] = item;
        });

        var consumer = new sourceMap.SourceMapConsumer(fileContent);
        var lookup = {
            line: parseInt(line),
            column: parseInt(column)
        };
        var result = consumer.originalPositionFor(lookup);

        var originSource = sourcesPathMap[result.source],
            sourcesContent = fileObj.sourcesContent[sources.indexOf(originSource)];

        result.sourcesContent = sourcesContent;

        callback && callback(result);
    });
}

function writeLogs(w_data){
    var logPath = resolve('./../logs/' + moment().format('YYYY-MM-DD') + '.js');
    var logDirPath = resolve('./../logs/');
    fileExist(logDirPath).then(function() {
        //存在logs目录
        return new Promise(function(resolve) {
            resolve();
        })
    }, function(exists, cb) {
        if(!exists){
            return new Promise(function(resolve, reject) {
                fs.mkdir(logDirPath, function (err) {
                    if(err) {
                        reject();
                    } else {
                        resolve();
                    }
                });
            })
        }
    }).then(function(){
        return fileExist(logDirPath);
    }).then(function(){
        // 存在日志文件，直接在文件后继续添加
        // fs.appendFile(logPath, w_data + ',' , function (err) {
        fs.appendFile(logPath, ',' + w_data, function (err) {
            if(err) {
                log.error(err);
            }
        })

    }, function(){
        // 不存在日志文件，直接创建文件后添加
        return new Promise(function(resolve, reject) {
            // fs.writeFile(logPath, w_data, {flag: 'a'}, function (err) {
            fs.writeFile(logPath, w_data, {flag: 'a'}, function (err) {
                if(err) {
                    log.error(err);
                } else {
                    resolve();
                }
            });
        })
    }).catch(function(err){
        console.log('报错啦！！！', err);
    });
}

app.use(function *(next){
    if(this.path==='/report'){
        var paramObj = this.query;
        var msg = paramObj.msg,
            url = paramObj.url,
            row = paramObj.row,
            col = paramObj.col;

        if (url) {
            paramObj.id = ++id;
            errlist.push(paramObj);
        }
        var w_data = new Buffer(JSON.stringify(paramObj));

        writeLogs(w_data);
    }

    return yield next;
});

app.use(function *(next){
    if(this.path==='/errlist'){
        console.log('错误列表：',errlist, '\n');
        this.body = {
            errlist: errlist,
        };
    }
    return yield next;
});

app.use(function *(next){
    if(this.path==='/errdetail'){
        var errid = this.query.errid;

        var obj = getItemFromList(errlist, {id: errid});        
        var url = obj.url,
            row = obj.row,
            col = obj.col;

        var filename = path.basename(url);
       
        var detailInfo = yield new Promise(function(resolve, reject) {
            lookupSourceMap(path.join(staticDir, (filename + ".map")), row, col, function(res){
                var source = res.source;
                var filename = path.basename(source);
                var filepath = path.join(staticDir, filename);
                
                resolve({
                    sourcesContent: res.sourcesContent,
                    msg: obj.msg,
                    source: res.source,
                    line: res.line,
                    column: res.column,
                });
            });
        });
        this.body = detailInfo;
    }
    return yield next;
});

app.listen(config.port, function() {
  console.log('server: listening on port ' + config.port);
});


function writeLogsToList(){
	let jsPath = resolve('./../logs/' + moment().format('YYYY-MM-DD') + '.js');
	fileExist(jsPath).then(function(data) {
		fs.readFile(jsPath, {flag: 'r+', encoding: 'utf8'}, function(err, data) {
			if(err) {
			} else {
                try {
                    debugger;
                    data = data.indexOf(',') == 0 ? data.replace(',','')  : data;
                    errlist = JSON.parse('[' + data + ']');
                } catch (error) {
                    console.log('parse 异常',error);
                }
			}
		})
	}, function(err){
        console.log('尚无初始化文件~~');
    });
}

writeLogsToList();

setTimeout(()=>{
    opn('http://127.0.0.1:8055', {app: ['google chrome']});
    opn('http://127.0.0.1:8066', {app: ['google chrome']});
}, 500);