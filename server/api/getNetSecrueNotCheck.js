const auth = require("../auth.js")();
const express = require("express");
const fs = require('fs');
const axios = require("axios");
const path = require("path");
const app = express();
const downloadParseFile = require("../downloadParseFile")();
let token;

let emitMsg = console.log;
let clearDot = function (id, token) {
    axios
        .get(`http://e.dgut.edu.cn/api/home/readRedDot?proc_inst_id=${id}`, {
            headers: {
                "X-Authorization-access_token": token,
                "Content-Type": "application/json",
            },
        })
        .then((res) => {
            emitMsg("红点已清除");
        })
        .catch((err) => {
            emitMsg("红点清除失败");
            console.error(err);
        });
};
let start = async function (res, defId = "735181530816577536") {
    token = await auth();
    emitMsg(`token：${token}`);
    emitMsg({
        message: "正在获取参数",
    });
    // 690529366286794752 全校
    // 735181530816577536 网院
    let date = new Date().toLocaleDateString().split("-");
    if (date[1] < 10) date[1] = "0" + date[1];
    if (date[2] < 10) date[2] = "0" + date[2];
    date = date.join("-");
    emitMsg("日期为: " + date);
    return axios.post("http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/start", {
        parameters: [
            {
                key: "defId",
                value: defId,
            },
            {
                key: "version",
                value: "0",
            },
            {
                key: "data",
                value: `{"id":"","shenQingRen":"42593960257912867","suoShuBuMen":"5013628906935158270","xuanZeShiJian":${date},"xiaZaiDiZhi":"","zhangHao":"2009021"}`,
            },
        ],
    }, {
        headers: {
            "X-Authorization-access_token": token,
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            console.log(response.data);
            if (response.data && response.data.state === 200) {
                return response.data;
            } else {
                emitMsg({
                    message: "参数获取失败，正在重启流程",
                });
                start(res);
            }
        })
        .then(param => {
            return axios(
                `http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/instFormInfo?instId=${param.variables.proInstId}`,
                {
                    headers: {
                        "X-Authorization-access_token": token,
                        "Content-Type": "application/json",
                    },
                    timeout: 10000,
                }
            );
        })
        .then(resolve => {
            if (resolve.data.state === 200) {
                console.log(resolve.data.data);
                emitMsg({
                    message: "获取下载地址成功",
                    data: JSON.parse(resolve.data.data.boData).xiaZaiDiZhi,
                });
                return downloadParseFile(JSON.parse(resolve.data.data.boData).xiaZaiDiZhi);
                res.end();
            } else {
                console.log(`${resolve.data.message},${resolve.data.cause}`);
                emitMsg(`${resolve.data.message},${resolve.data.cause}`);
                emitMsg(`正在重新启动流程`);
                start(res);
            }
        })
        .then(_ => {
            fs.readFile(path.resolve(__dirname, './file/people.json'), (err, data) => {
                if (err) {
                    console.error(err);
                    return false;
                }
                let parseRes = JSON.parse(data.toString());
                console.log(parseRes)
                res.json({
                    casids: parseRes['$All'] && parseRes['$All']['casIds']
                })
                console.log('data', parseRes);
            })
        })
        .catch((err) => {
            console.log(`ERROR\n${err}`);
            emitMsg({
                message: "启动获取名单出错啦",
            });
            res.end();
        });
};

app.get('/getList', async (req, res) => {
    // res.json({hello: "world"});
    let param = await start(res);
    console.log('param', param)
});




app.listen(28762);
