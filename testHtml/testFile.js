var fs = require('fs');
var path = require('path');
var koa = require('koa');
var staticServer = require('koa-static');
var cors = require('kcors');
var sourceMap = require('source-map');
var moment = require('moment');
var resolve = file => path.resolve(__dirname, file);
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

var logPath = resolve('./../logs/' + moment().format('YYYY-MM-DD') + '.js');
var logDirPath = resolve('./../logs/');
var w_data = new Buffer(JSON.stringify('{}'));
fileExist(logDirPath).then(function() {
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
    fs.appendFile(logPath, ',' + JSON.stringify("{a: 100}"), function (err) {
        if(err) {
            log.error(err);
        }
    })

}, function(){
    return new Promise(function(resolve, reject) {
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