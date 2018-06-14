(function(){
    function fetchRequest(params){
        return fetch(params.url, {
            credentials: "same-origin"
        }).then((response) => {
            return response.json();
        }).then((data) => {
            return data;
        }).catch((e) => {
            console.log(e);
        });
    }
    function encodeHTML(str) {
        if(!str || str.length == 0) return "";
        return str.replace(/&/g, "&#38;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\'/g, "&#39;");
    }

    let $errlist = document.querySelector('#errlist');
    let $errCode = document.querySelector('#errCode');

    $errlist.addEventListener('click', function(e){
        let target = e.target;
        let {errid, isshow } = target.dataset;
        if (isshow !== undefined){
            target.querySelector('.errdetail').style.display = (isshow > 0 ? 'none' : 'block');
            target.dataset.isshow = isshow > 0 ? 0 : 1;
            return;
        }

        target.dataset.isshow = 1;

        fetchRequest({
            url: 'http://localhost:8055/errdetail?errid=' + errid
        }).then(function(data){
            $errCode.innerHTML = data.sourcesContent;
            let lines = $errCode.innerText.split('\n');
            let row = data.line;
            let len = lines.length - 1;
            let start = row - 3 >= 0 ? row - 3 : 0;
            let end = start + 6 >= len ? len : start + 6;
            let newLines = [];
            for(let i = start; i <= end; i++) {
                newLines.push(`<div class="code-line ${i + 1 == row ? 'heightlight': ''}" title="${i + 1 == row ? encodeHTML(data.msg): ''}">${ (i+1)}.    ${encodeHTML(lines[i])}</div>`);
            }
    
            target.innerHTML += `<div class="errdetail">
                <div class="errheader">${data.source} at line ${data.line}:${data.column}</div>
                <pre class="errCode">${newLines.join("")}</pre>
            </div>`;
        });

    });

    function renderItem(obj, index) {
        let msg = obj.msg, url = obj.url, id = obj.id;
        return `<li data-errid='${id}'>
            <span style="float:left;  margin-right: 20px;color: red; ">(${++ index}): </span>
            <p>${encodeHTML(msg)}</p>
            <p>${url}</p>
        </li>`;
    }  

    fetchRequest({
        url: 'http://localhost:8055/errlist'
    }).then(function(data){
        let list = data && data.errlist || [];
        $errlist.innerHTML = list.map((item, index) => {
            return renderItem(item, index);
        }).join('') || '暂无异常数据';
    });
})();