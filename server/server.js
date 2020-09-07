const http = require('http');
const express = require('express');
const fs = require("fs");
const path = require("path");
const request = require("request");
const axios = require('axios');
const app = express();
const { io, emitMsg2 } = require('./websocket')(app);
app.use(express.static('../public'));
// const token = require('./token.json');
const auth = require('./auth.js')(emitMsg2);
const downloadParseFile = require('./downloadParseFile')(emitMsg2);
let token;

let emitMsg = function(msg) {
    if (!msg) return;
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    emitMsg2('msg', msg);
}
let start = async function(res) {
    token = await auth();
    emitMsg(`token：${token}`);
    emitMsg({ message: '正在获取参数' });
    // 690529366286794752 全校
    // 735181530816577536 网院
    return axios('http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/start', {
            method: 'post',
            headers: {
                "X-Authorization-access_token": token,
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
            console.log(response.data);
            if (response.data && response.data.state === 200) {
                fs.writeFile('../public/file/param.json', JSON.stringify(response.data), err => {
                    if (err) {
                        console.error(err);
                        emitMsg({ message: '写入文件出错啦' });
                        res.end();
                        return
                    }
                    emitMsg({ message: '参数获取成功,流程已启动' });
                    clearDot(response.data && response.data.variables.proInstId);
                    res.end();
                    //文件写入成功。
                })
            } else {
                emitMsg({ message: '参数获取失败，正在重启流程' });
                start(res);
            }
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
                "X-Authorization-access_token": token,
                "Content-Type": "application/json"
            },
            timeout: 5000
        })
        .then(resolve => {
            if (resolve.data.state === 200) {
                console.log(resolve.data.data);
                emitMsg({ message: '获取下载地址成功', data: JSON.parse(resolve.data.data.boData).xiaZaiDiZhi });
                downloadParseFile(JSON.parse(resolve.data.data.boData).xiaZaiDiZhi);
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
                            if (err || !data) {
                                emitMsg('获取参数失败，请联系管理员');
                                return;
                            }
                            param = JSON.parse(data);
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
                "X-Authorization-access_token": token,
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
app.get('/', function(req, res, next) {
    try {
        next();
    } catch (err) {
        console.log(err)
    }
})
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

app.get('/getDetail', async function(req, res, next) {
    fs.readFile(`./file/people.json`, function(err, data) {
        if (err) {
            console.error(err);
            emitMsg('暂无名单数据, 请重新拉取名单');
            res.end();
            return;
        }
        data = JSON.parse(data.toString());
        let result =
            `
            创建时间: ${data.time}</br></br>
            17级未打卡名单(详细): ${(function(){
                let result = '</br>';
                data.yiqi.detail.forEach(i=>{
                    result += i + '</br>'
                });
                return result;
            })()}</br></br>
            18级未打卡名单(详细):${(function(){
                let result = '</br>';
                data.yiba.detail.forEach(i=>{
                    result += i + '</br>'
                });
                console.log(result)
                return result;
            })()}</br></br>
            19级未打卡名单(详细): ${(function(){
                let result = '</br>';
                data.yijiu.detail.forEach(i=>{
                    result += i + '</br>'
                });
                return result;
            })()}</br></br>
        `
        console.log(result);
        emitMsg(result);
        res.end();
    });
})



app.listen(4396, () => {
    console.log('server is running at 4396')
})