const axios = require('axios');
const auth = require('./auth')();
const downloadParseFile = require('./downloadParseFile')();

let token;

function clearDot(id) {
    return axios.get(`http://e.dgut.edu.cn/api/home/readRedDot?proc_inst_id=${id}`, {
            headers: {
                "X-Authorization-access_token": token,
                "Content-Type": "application/json"
            }
        })
        .then(res => {
            console.log('红点已清除');
        })
        .catch(err => {
            console.log('红点清除失败');
            console.error(err)
        })
}

function getFile(param) {
    axios(`http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/instFormInfo?instId=${param.variables.proInstId}`, {
        headers: {
            "X-Authorization-access_token": token,
            "Content-Type": "application/json"
        },
        timeout: 5000
    }).then(resolve => {
        if (resolve.data.state === 200) {
            console.log(resolve.data.data.boData);
            downloadParseFile(JSON.parse(resolve.data.data.boData).xiaZaiDiZhi)
                .then(({ yiqi: { detail: detail17 }, yiba: { detail: detail18 }, yijiu: { detail: detail19 } }) => {
                    let noWriteCasIds = [];
                    [detail17, detail18, detail19].forEach(detailArr => {
                        detailArr.forEach(p => {
                            noWriteCasIds.push(p.split("-")[0]);
                        })
                    });
                    console.log(noWriteCasIds);
                    postData(noWriteCasIds);
                });
        } else {
            console.log("获取下载地址失败");
            return;
        }
    })
}

function postData(casIds) {
    axios("https://www.dingdongtongxue.com/dingdong/api/v1/official/msgToUnClocked", {
        method: 'post',
        data: {
            casIds
        }
    }).then(
        res => {
            console.log(res);
        }
    )
}

async function notify() {
    // 690529366286794752 全校
    token = await auth();
    axios('http://e.dgut.edu.cn/ibps/business/v3/bpm/instance/start', {
        method: 'post',
        headers: {
            "X-Authorization-access_token": token,
            "Content-Type": "application/json"
        },
        data: {
            "parameters": [{
                    "key": "defId",
                    "value": "690529366286794752"
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
    }).then(
        response => {
            console.log(response.data);
            if (response.data && response.data.state === 200) {
                clearDot(response.data && response.data.variables.proInstId)
                    .then(_ => {
                        getFile(response.data);
                    });

            } else {
                emitMsg({ message: '参数获取失败，正在重启流程' });
                start(res);
            }
        }
    ).catch(e => {
        console.error('error', e)
    })
}

notify();