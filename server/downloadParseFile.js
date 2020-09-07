//文件下载
var fs = require("fs");
var path = require("path");
var request = require("request");
const axios = require('axios');

var xlsx = require('node-xlsx');



module.exports = function(emitMsg2) {
        function emitMsg(msg) {
            emitMsg2('msg', msg);
        }
        let downloadFile = async function(url, fileName) {
            if (!fs.existsSync('./file')) {
                fs.mkdirSync('./file');
                console.log("文件夹创建成功");
            } else {
                console.log("文件夹已存在");
            }
            var dirPath = path.resolve('./file', fileName);
            console.log(dirPath)

            const writer = fs.createWriteStream(dirPath);
            const response = await axios({
                url,
                method: "GET",
                responseType: "stream"
            });
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
        }

        let parseFile = function() {
            return new Promise((resolve, reject) => {
                fs.readFile(`./file/未打卡名单${new Date().toLocaleDateString()}.xls`, function(err, data) {
                    if (err) {
                        console.error(err);
                        emitMsg('暂无名单数据');
                        return;
                    }
                    // 解析得到文档中的所有 sheet
                    var sheets = xlsx.parse(data);
                    const yiqi = {
                            name: [],
                            detail: []
                        },
                        yiba = {
                            name: [],
                            detail: []
                        },
                        yijiu = {
                            name: [],
                            detail: []
                        }

                    // 遍历 sheet
                    sheets.forEach(function(sheet) {
                        // 读取每行内容
                        for (var rowId in sheet['data']) {
                            var row = sheet['data'][rowId];
                            if (row[2] !== '学生用户') continue;
                            if (!row[4]) continue;
                            if (row[4].startsWith('2017')) {
                                yiqi.name.push(row[1]);
                                yiqi.detail.push(row.join('-').replace(/\t/g, ''));
                            };
                            if (row[4].startsWith('2018')) {
                                yiba.name.push(row[1]);
                                yiba.detail.push(row.join('-').replace(/\t/g, ''));
                            };
                            if (row[4].startsWith('2019')) {
                                yijiu.name.push(row[1]);
                                yijiu.detail.push(row.join('-').replace(/\t/g, ''));
                            };
                            // console.log(row);
                        }
                        console.log(yiqi, yiba, yijiu);
                        let list = {
                            time: new Date().toLocaleTimeString(),
                            yiqi,
                            yiba,
                            yijiu
                        };
                        fs.writeFile('./file/people.json', JSON.stringify(list), function(err, data) {
                            if (err) {
                                console.error(err);
                                reject();
                            }
                            resolve(list);
                        })
                    });
                })
            })
        }

        return function(url) {
            downloadFile(url, `未打卡名单${new Date().toLocaleDateString()}.xls`)
                .then(
                    res => {
                        emitMsg('文件下载完成，正在解析!')
                        parseFile(`未打卡名单${new Date().toLocaleDateString()}.xls`)
                            .then(
                                res => {
                                    emitMsg('文件解析成功!');
                                    emitMsg(`
                                        创建时间: ${res.time}</br></br>
                                        17级未打卡名单: ${res.yiqi.name.join(',')}</br></br>
                                        18级未打卡名单: ${res.yiba.name.join(',')}</br></br>
                                        19级未打卡名单: ${res.yijiu.name.join(',')}</br></br>
                                    `);
                                }
                            )
                            .catch(e => {
                                emitMsg('文件解析失败');
                            })
                    }
                )
                .catch(e => {
                    emitMsg('文件下载失败');
                })
        }
    }
    // downloadFile('http://yqfk.dgut.edu.cn/auth/ibps/downloadTodayNoWritePeople?instId=750682944133136384', `未打卡名单${new Date().toLocaleDateString()}.xls`)
    //     .then(res => {
    //         console.log('文件下载完毕');

//     })