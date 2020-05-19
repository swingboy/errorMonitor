var koa = require('koa');
var staticServer = require('koa-static');
var cors = require('kcors');
var app = new koa();

app.use(staticServer(__dirname));

app.listen(8066, function() {
  console.log('server: listening on port ' + 8066);
});

////////////////////////////////////////////////////////////////////////////////////

var cdn = new koa();
cdn.use(function *(next){
    // var requestOrigin = this.get('Origin');
    // if (!requestOrigin) {
    //   console.log('next')
    //   return yield next;
    // }
    // this.set('Access-Control-Allow-Origin', 'http://www.baidu.com');
    // this.set('Access-Control-Allow-Origin', '*');
    this.vary('Origin');
    return yield next;
});

cdn.use(staticServer(__dirname));

cdn.listen(8077, function() {
  console.log('cdn: listening on port ' + 8077);
});
