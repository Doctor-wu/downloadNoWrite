// websocket 连接服务
(function() {
    let options = {
        dir: "ltr",
        lang: "zh-CN",
        body: "有人通过审批啦!",
        icon: "https://dtwu.club/avatar.png",
        tag: "msgId"
    }

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
                document.querySelector('#judgeOutSchool').addEventListener('click', debounce(() => {
                    axios.get('http://localhost:4396/judgeOutSchool');
                }, 300, true));
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
        if (data.toString().includes("审批成功!</h3></br>")) {
            console.log("notify");
            new Notification(data.match(/\>(.+[^<>])+\</i)[1], options);
        }
        msgScroll();
        try {
            data = JSON.parse(data);
            if (data.message === '获取下载地址成功') {
                let url = data.data;
                addMsg('.monitor .msg', `下载地址：<a href="${url}" target="_blank">${url}</a>`);
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
    document.querySelector(el).innerHTML += `<li>${msg}</li></br>`
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


function showNotice(msg) {
    //发送通知

    if (Notification.permission == "default") {
        Notification.requestPermission();
    } else {
        newNotify = function() {
                var notification = new Notification("系统通知:", {
                    dir: "auto",
                    lang: "hi",
                    requireInteraction: true,
                    //tag: "testTag",
                    icon: "https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo_top_86d58ae1.png",
                    body: msg
                });
                notification.onclick = function(event) {
                    //回到发送此通知的页面
                    window.focus();
                    //回来后要做什么
                    console.log("I'm back");
                }
            }
            //权限判断
        if (Notification.permission == "granted") {
            newNotify();
        } else {
            //请求权限
            Notification.requestPermission(function(perm) {
                if (perm == "granted") {
                    newNotify();
                }
            })
        }
    }
}