//文件下载
var fs = require("fs");
var path = require("path");
var request = require("request");
const axios = require('axios');

var xlsx = require('node-xlsx');


module.exports = function (emitMsg2 = () => {
}) {
    function emitMsg(msg) {
        emitMsg2 && emitMsg2('msg', msg);
    }

    let downloadFile = async function (url, fileName) {
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

    let parseFile = function () {
        return new Promise((resolve, reject) => {
            fs.readFile(`./file/未打卡名单${new Date().toLocaleDateString()}.xls`, function (err, data) {
                if (err) {
                    console.error(err);
                    emitMsg('暂无名单数据');
                    return;
                }
                // 解析得到文档中的所有 sheet
                var sheets = xlsx.parse(data);
                const gradeModel = {};
                const grades = [{
                    key: "$2017",
                    gradeIndex: "2017"
                }, {
                    key: "$2018",
                    gradeIndex: "2018"
                }, {
                    key: "$2019",
                    gradeIndex: "2019"
                }, {
                    key: "$2020",
                    gradeIndex: "2020"
                }, {
                    key: "$X",
                    gradeIndex: "undefined"
                }];
                grades.forEach(grade => {
                    gradeModel[grade.key] = {
                        name: [],
                        casIds: [],
                        detail: []
                    }
                })


                // 遍历 sheet
                sheets.forEach(function (sheet) {
                    // 读取每行内容
                    for (var rowId in sheet['data']) {
                        var row = sheet['data'][rowId];
                        if (row[2] !== '学生用户') continue;
                        gradeModel['$All'].name.push(row[1]);
                        gradeModel['$All'].casIds.push(row[0].replace(/\t/g, ''));
                        gradeModel['$All'].detail.push(row.join('-').replace(/\t/g, ''));
                        try {
                            grades.forEach(grade => {
                                row[4] = row[4] + "";
                                if (row[4].startsWith(grade.gradeIndex) || row[4] === grade.gradeIndex) {
                                    // console.log(row[4], grade.gradeIndex);
                                    gradeModel[grade.key].name.push(row[1]);
                                    gradeModel[grade.key].casIds.push(row[0].replace(/\t/g, ''));
                                    gradeModel[grade.key].detail.push(row.join('-').replace(/\t/g, ''));
                                    throw new Error("jump loop");
                                }
                            })
                        } catch (e) {
                            // 此处捕获异常是提前终止了循环
                        }
                    }
                    let list = {
                        time: new Date().toLocaleTimeString(),
                        ...gradeModel
                    };
                    console.log('All', list['$All'])
                    fs.writeFile('./file/people.json', JSON.stringify(list), function (err, data) {
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

    return function (url) {
        return downloadFile(url, `未打卡名单${new Date().toLocaleDateString()}.xls`)
            .then(
                res => {
                    emitMsg('文件下载完成，正在解析!')
                    return parseFile(`未打卡名单${new Date().toLocaleDateString()}.xls`)
                        .then(
                            res => {
                                emitMsg('文件解析成功!');
                                emitMsg(`
                                        创建时间: ${res.time}</br></br>
                                        ${
                                    (function () {
                                        let str = "";
                                        for (const grade in res) {
                                            if (grade === "time") continue;
                                            if (res.hasOwnProperty(grade)) {
                                                console.log(grade)
                                                str += `${grade}级未打卡名单(${res[grade].name.length}): ${res[grade].name.join(',')}</br></br>`
                                            }
                                        }
                                        return str
                                    })()
                                }
                                    `);
                                return Promise.resolve(res);
                            }
                        )
                        .catch(e => {
                            emitMsg('文件解析失败');
                            console.log(e);
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
