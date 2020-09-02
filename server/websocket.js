module.exports = function(app) {
    // const express = require('express');
    // const app = express();
    let user, emitMsg2, users = [];
    const server = require('http').createServer(app);
    const io = require('socket.io')(server);
    const _ = require('underscore');
    server.listen(3001);

    io.on('connection', function(socket) { // socket相关监听都要放在这个回调里
        // console.log('a user connected');
        users.push(socket.id);

        socket.on("disconnect", function() {
            // console.log("a user go out");
            users = users.filter(v => v !== socket.id);
            user = users[0];
            emitMsg2('msg', JSON.stringify({ message: '服务器空闲下来啦!', code: 0 }));
            console.log('user:', user);
        });

        socket.on("judgeConnection", function() {
            let lock = !!user && user !== socket.id;
            console.log(user, socket.id);
            if (!lock) {
                io.emit("judgeConnection", user);
                user = socket.id;
                lock = !lock;
            } else {
                io.emit("judgeConnection", user);
            }
        });
    });
    emitMsg2 = function(evt, msg) {
        let toSocket = _.findWhere(io.sockets.sockets, { id: user });
        if (!toSocket) toSocket = io;
        toSocket.emit(evt, msg);
    }
    return { io, emitMsg2 };
}