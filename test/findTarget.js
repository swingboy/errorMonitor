var fs = require('fs');
var path = require('path');
var sourceMap = require('source-map');
var filename = 'main.min.js';
var smDir = path.join(__filename, '..','..', 'example');

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
        var originSource = sourcesPathMap[result.source];
        var sourcesContent = fileObj.sourcesContent[sources.indexOf(originSource)];
        result.sourcesContent = sourcesContent;
        console.log(result);
        callback && callback(result);
    });
}

function fixPath(filepath) {
    return filepath.replace(/\.[\.\/]+/g, "");
}

var errlist = [];
var sourcesPathMap = {};
var id = 0;

// var obj = { 
//     msg: 'Uncaught ReferenceError: testerror is not defined',
//     url: 'http://127.0.0.1:8077/main.min.js',
//     row: '1',
//     col: '515',
//     id: 1
// }


var obj = { 
    msg: 'Uncaught ReferenceError: testerror is not defined',
    url: 'http://127.0.0.1:8077/main.min.js',
    row: '1',
    col: '927',
    id: 1
}


var url = obj.url, row = obj.row, col = obj.col;

var mapPath =  path.join(smDir, (filename + ".map"));

var detailInfo = new Promise(function(resolve, reject) {

    lookupSourceMap(path.join(smDir, (filename + ".map")), row, col, function(res){
        var source = res.source;
        var filename = path.basename(source);
        var filepath = path.join(smDir, filename);
        resolve({
            file: res.sourcesContent,
            msg: obj.msg,
            source: res.source,
            row: res.line,
            column: res.column,
        });
    });
}).then(function(a){
    console.log(a);
});