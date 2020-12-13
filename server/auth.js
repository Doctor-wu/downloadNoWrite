const axios = require('axios');
const fs = require('fs');


module.exports = function(emit=() => {}) {
    return function() {
        return new Promise((resolve, reject) => {
            let preToken,
                cookies = ['languageIndex=0'],
                preURL;

            function emitMsg(msg) {
                emit && emit('msg', msg);
            }


            // [GET] https://cas.dgut.edu.cn/home/Oauth/getToken/appid/ibpstest/state/home 从返回的html中解析出token
            axios.get('https://cas.dgut.edu.cn/home/Oauth/getToken/appid/ibpstest/state/home').then(
                res => {
                    let strs = res.headers['set-cookie'];
                    strs.forEach(str => {
                        let cookie = str.split(';')[0].trim();
                        cookies.push(cookie);
                    })
                    console.log(cookies.join('; '));
                    emitMsg('cookie解析成功');
                    emitMsg('解析html成功');
                    let result = res.data.match(/token = ".+";/ig);
                    if (result.length > 0) {
                        emitMsg('解析前置token成功');
                        preToken = result[0].split('=')[1].trim();
                        console.log(preToken);
                    } else {
                        emitMsg('解析前置token失败');
                    }
                }
            ).then(_ => {
                // [POST] https://cas.dgut.edu.cn/home/Oauth/getToken/appid/ibpstest/state/home 获取url
                // username:2009021
                // password:XTdx170830
                // __token__:27a9d03a772a3197fd7f74b0036601a0
                // wechat_verify:
                axios('https://cas.dgut.edu.cn/home/Oauth/getToken/appid/ibpstest/state/home', {
                        method: 'POST',
                        headers: {
                            "Cookie": cookies.join('; '),
                            "Content-Type": "application/json; charset=UTF-8"
                        },
                        data: {
                            username: "2009021",
                            password: "170830xtdX",
                            __token__: preToken.slice(1, -2),
                            wechat_verify: ""
                        }
                    }).then(res => {
                        emitMsg('获取url成功' + JSON.stringify(res.data));
                        preURL = res.data.info;
                        console.log(preURL);
                    }).catch(err => {
                        console.error(err.toJSON());
                    })
                    .then(_ => {
                        // [GET] url  返回头中的location可以解析出token
                        axios(preURL, {
                                method: 'GET',
                                headers: {}
                            })
                            .then(res => {
                                let result = res.request.path.match(/access_token=[a-z0-9]+/);
                                // console.log(result);
                                let realToken = result[0].split('=')[1];
                                // fs.writeFile('./token.json', JSON.stringify(realToken), function(err) {
                                //     if (err) {
                                //         console.log(err);
                                //     } else {
                                //         emitMsg('成功更新token!');
                                //         resolve(realToken);
                                //     }
                                // });
                                emitMsg('成功更新token!');
                                resolve(realToken);
                            })
                    })
            })
        })
    }
}
