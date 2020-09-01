const http = require('http');
const express = require('express');
const fs = require("fs");
const path = require("path");
const request = require("request");
const axios = require('axios');
const app = express();
const io = require('./websocket')(app);
app.use(express.static('../public'));

function emitMsg(msg) {
    if (!msg) return;
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    io.emit('msg', msg);
}
let start = function(res) {
    emitMsg({ message: '正在获取参数' });
    return axios('http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/start', {
            method: 'post',
            headers: {
                "X-Authorization-access_token": "b8d629e0ec0b11ea836ad9cd8549fdd9",
                "Content-Type": "application/json"
            },
            data: {
                "parameters": [{
                        "key": "defId",
                        "value": "735181530816577536"
                    },
                    {
                        "key": "version",
                        "value": "0"
                    },
                    {
                        "key": "data",
                        "value": "{ id: '', shenQingRen: 42593960257912867, suoShuBuMen: 5013628906935158270, xiaZaiDiZhi: '', zhangHao: 2009021 }"
                    }
                ]
            }
        })
        .then(response => {
            fs.writeFile('../public/file/param.json', JSON.stringify(response.data), err => {
                if (err) {
                    console.error(err);
                    emitMsg({ message: '写入文件出错啦' });
                    res.end();
                    return
                }
                emitMsg({ message: '参数获取成功,流程已启动' });
                clearDot(response.data.variables.proInstId);
                res.end();
                //文件写入成功。
            })
        })
        .catch(err => {
            console.log(`ERROR\n${err}`);
            emitMsg({ message: '启动获取名单出错啦' });
            res.end();
        });
};
let getFile = function(res, param) {
    axios(`http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/instFormInfo?instId=${param.variables.proInstId}`, {
            headers: {
                "X-Authorization-access_token": "b8d629e0ec0b11ea836ad9cd8549fdd9",
                "Content-Type": "application/json"
            },
            timeout: 5000
        })
        .then(resolve => {
            if (resolve.data.state === 200) {
                console.log(resolve.data.data);
                emitMsg({ message: '获取下载地址成功', data: JSON.parse(resolve.data.data.boData).xiaZaiDiZhi });
                res.end();
            } else {
                console.log(`${resolve.data.message},${resolve.data.cause}`);
                emitMsg(`${resolve.data.message},${resolve.data.cause}`);
                emitMsg(`正在重新启动流程`);
                start(res)
                    .then(_ => {
                        emitMsg('重启流程成功，正在获取下载地址;');
                        let param;
                        fs.readFile('../public/file/param.json', 'utf8', (err, data) => {
                            param = JSON.parse(data);
                            if (err || !param) {
                                emitMsg('获取参数失败，请联系管理员');
                                return;
                            }
                            emitMsg('正在获取文件下载地址' + '参数为:' + JSON.stringify(param));
                            getFile(res, param);
                        });
                        getFile(res, param);
                    });
            }

        })
        .catch(err => {
            console.log(`ERROR\n${err}`);
            emitMsg({ message: '获取列表出错啦' });
            res.end();
        })
};
let clearDot = function(id) {
    axios.get(`http://e.dgut.edu.cn/api/home/readRedDot?proc_inst_id=${id}`, {
            headers: {
                "X-Authorization-access_token": "b8d629e0ec0b11ea836ad9cd8549fdd9",
                "Content-Type": "application/json"
            }
        })
        .then(res => {
            emitMsg('红点已清除');
        })
        .catch(err => {
            emitMsg('红点清除失败');
            console.error(err)
        })
}

app.get('/start', function(req, res, next) {
    // 启动获取名单的流程
    start(res);
});

app.get('/getFile', async function(req, res, next) {
    let param;
    fs.readFile('../public/file/param.json', 'utf8', (err, data) => {
        if (err) emitMsg('获取参数失败，请联系管理员');
        param = JSON.parse(data);
        emitMsg('正在获取文件下载地址' + '参数为:' + JSON.stringify(param));
        getFile(res, param);
    });
})



app.listen(4396, () => {
    console.log('server is running at 4396')
})