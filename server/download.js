//文件下载
var fs = require("fs");
var path = require("path");
var request = require("request");
const axios = require('axios');

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
    // axios.get(url, {
    //     responseType: 'arraybuffer'
    // }).then(res => {
    //     fs.writeFile(path.join(dirPath, fileName), res.data.concat(), (err) => {
    //         if (err) {
    //             console.error(err);
    //         } else {
    //             console.log("文件[" + fileName + "]下载完毕");
    //         }
    //     })
    // })

}

downloadFile('http://yqfk.dgut.edu.cn/auth/ibps/downloadTodayNoWritePeople?instId=750457558711402496', `未打卡名单${new Date().toLocaleDateString()}.xls`)
    .then(res => {
        console.log('文件下载完毕');
    })