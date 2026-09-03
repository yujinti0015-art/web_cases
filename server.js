const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://yujinti0015-art.github.io",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// ================================
// PLAYERS
// ================================

const players = new Map();

// ================================
// HTTP
// ================================

app.get("/", (req, res) => {
    res.json({
        server: "CASE WEB",
        status: "online",
        trade: "online"
    });
});

app.get("/health", (req, res) => {
    res.send("OK");
});

// ================================
// SOCKET.IO
// ================================

io.on("connection", (socket) => {

    console.log("Игрок подключился:", socket.id);

    players.set(socket.id, {
        id: socket.id,
        inventory: [],
        balance: 0
    });

    socket.emit("trade:connected", {
        id: socket.id
    });

    // ================================
    // SYNC PLAYER
    // ================================

    socket.on("trade:sync", (data) => {

        const player = players.get(socket.id);

        if (!player || !data) return;

        if (Array.isArray(data.inventory)) {
            player.inventory = data.inventory;
        }

        if (typeof data.balance === "number") {
            player.balance = data.balance;
        }

    });

    // ================================
    // FIND PLAYER
    // ================================

    socket.on("trade:find", () => {

        let opponent = null;

        for (const [id, player] of players) {

            if (id === socket.id) continue;

            opponent = player;
            break;
        }

        if (!opponent) {

            socket.emit("trade:waiting");

            console.log(
                "Игрок",
                socket.id,
                "ждёт соперника"
            );

            return;
        }

        socket.emit("trade:found", {
            playerId: opponent.id
        });

        io.to(opponent.id).emit("trade:found", {
            playerId: socket.id
        });

        console.log(
            "Найдена пара:",
            socket.id,
            "<->",
            opponent.id
        );

    });

    // ================================
    // DISCONNECT
    // ================================

    socket.on("disconnect", () => {

        console.log(
            "Игрок отключился:",
            socket.id
        );

        players.delete(socket.id);

    });

});

// ================================
// START SERVER
// ================================

server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("======================================");
    console.log("          CASE WEB SERVER");
    console.log("======================================");
    console.log("");
    console.log("PORT:", PORT);
    console.log("TRADE SERVER: ONLINE");
    console.log("");
    console.log("======================================");

});
