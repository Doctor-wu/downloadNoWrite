module.exports = function(app) {
    // const express = require('express');
    // const app = express();
    let currUser, emitMsg2, users = [];
    const server = require('http').createServer(app);
    const io = require('socket.io')(server);
    const _ = require('underscore');
    server.listen(3001);

    io.on('connection', (socket) => { // socket相关监听都要放在这个回调里
        // console.log('a user connected');
        users.push(socket.id);

        socket.on("disconnect", () => {
            // console.log("a user go out");
            let oldUser = currUser;
            users = users.filter(v => v !== socket.id);
            currUser = users[0];
            if (currUser !== oldUser) {
                emitMsg2('msg', JSON.stringify({ message: '服务器空闲下来啦!', code: 0 }), currUser);
            }
            io.emit("msg", `当前在线人数：${users.length}`);
            // console.log('currUser:', user);
        });

        socket.on("judgeConnection", () => {
            if (currUser === undefined) {
                currUser = users[0];
                console.log('currUser access', currUser, users[0]);
            };
            console.log(currUser, socket.id, users);
            io.emit("judgeConnection", currUser);
            io.emit("msg", `当前在线人数：${users.length}`);
        });
    });
    emitMsg2 = function(evt, msg, id) {
        let toSocket = _.findWhere(io.sockets.sockets, { id: id || currUser });
        if (!toSocket) toSocket = io;
        toSocket.emit(evt, msg);
    }
    return { io, emitMsg2 };
}