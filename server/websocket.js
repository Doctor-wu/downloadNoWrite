module.exports = function(app) {
    // const express = require('express');
    // const app = express();
    const server = require('http').createServer(app);
    const io = require('socket.io')(server);
    server.listen(3001);

    io.on('connection', function(socket) { // socket相关监听都要放在这个回调里
        console.log('a user connected');

        socket.on("disconnect", function() {
            console.log("a user go out");
        });

        socket.on("judgeConnection", function() {
            io.emit("judgeConnection", true);
        })
    });
    return io;
}