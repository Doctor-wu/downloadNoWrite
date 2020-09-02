// websocket 连接服务
(function() {
    this.socket = io("ws://127.0.0.1:3001"); // 建立链接
    let iamUser = false,
        first = true;
    socket.on('judgeConnection', function(user) { // 监听服务端的消息“judgeConnection”
        iamUser = (user === socket.id) || (!user);

        console.log(user, socket.id);
        if (iamUser || first) {
            if (iamUser && first) {
                console.log('websocket连接成功', socket);
                addMsg('.monitor .msg', 'websocket连接成功');
                first = false;
                changeState(true);
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
            } else {
                console.log(iamUser);
                !iamUser && first && (addMsg('.monitor .msg', '服务器正忙，稍后再试吧'), changeState(false), first = false);
            }
        }
    });

    socket.on('msg', function(data) { // 监听服务端的消息“judgeConnection”
        addMsg('.monitor .msg', data);
        msgScroll();
        try {
            data = JSON.parse(data);
            if (data.message === '获取下载地址成功') {
                let url = data.data;
                document.querySelector('#download').addEventListener('click', debounce(() => {
                    window.open(url, '_blank');
                }));
                document.querySelector('#download').removeAttribute('disabled');
                // window.open(url, '_blank');
            } else
            if (data.message === '参数获取成功,流程已启动') {
                document.querySelector('#getFile').click();
            } else
            if (data.code === 0) {
                console.log('空闲');
                first = true;
                socket.emit('judgeConnection');
            }
            console.log(data);
        } catch {}
    });
    document.querySelector('#getDetail').addEventListener('click', debounce(() => {
        axios.get('http://localhost:4396/getDetail').then(res => {})
    }))
    console.log(socket);
    socket.emit('judgeConnection');
    return socket;
})(this);

function factory() {
    axios.get('http://localhost:4396/getFile').then(res => {})
}

function addMsg(el, msg) {
    document.querySelector(el).innerHTML += `<li>${msg}</li>\n\n`
}

function msgScroll() {
    document.querySelector('.msg').scrollTo(0, document.querySelector('.msg').scrollHeight);
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

function changeState(op) {
    let el = document.querySelector('#status');
    if (op) {
        el.classList.remove('offline');
        el.classList.add('online');
    } else {
        el.classList.add('offline');
        el.classList.remove('online');
    }
}