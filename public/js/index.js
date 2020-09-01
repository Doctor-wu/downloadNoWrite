// websocket 连接服务
(function() {
    this.socket = io("ws://127.0.0.1:3001"); // 建立链接

    socket.on('judgeConnection', function(connected) { // 监听服务端的消息“judgeConnection”
        if (connected) {
            console.log('websocket连接成功', socket);
            addMsg('.monitor .msg', 'websocket连接成功');
            document.querySelector('#getFile').addEventListener('click', debounce(factory, 300));
            document.querySelector('#start').addEventListener('click', debounce(() => {
                axios.get('http://localhost:4396/start');
            }, 300));
            document.querySelector('#clearMsg').addEventListener('click', debounce(() => {
                document.querySelector('.monitor .msg').innerHTML = `<li class="loading">
                <div class="wrap">
                    <div class="circle"></div>
                    <div class="top"></div>
                    <div class="bottom"></div>
                </div>
            </li>`;
            }, 300));
        }
    });

    socket.on('msg', function(data) { // 监听服务端的消息“judgeConnection”
        addMsg('.monitor .msg', data);
        try {
            data = JSON.parse(data);
            if (data.message === '获取下载地址成功') {
                let url = data.data;
                document.querySelector('#download').addEventListener('click', debounce(() => {
                    window.open(url, '_blank');
                }));
                document.querySelector('#download').removeAttribute('disabled');
                window.open(url, '_blank');
            }
            if (data.message === '参数获取成功,流程已启动') {
                document.querySelector('#getFile').click();
            }
        } catch {}
        console.log(data);
    });

    socket.emit('judgeConnection');
    return socket;
})(this);

function factory() {
    axios.get('http://localhost:4396/getFile').then(res => {})
}

function addMsg(el, msg) {
    document.querySelector(el).innerHTML += `<li>${msg}</li>\n\n`
}

function debounce(func, delay = 300, immediately = false) {
    let timer = null;

    return function anonymous(...params) {
        let now = immediately && !timer;
        clearTimeout(timer);

        timer = setTimeout(() => {
            timer = null;
            !immediately ? func.apply(this, params) : null;
        }, delay)

        now ? func.apply(this, params) : null;
    }
}