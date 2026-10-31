
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.get('/', (req, res) => {
    res.json({
        name: 'PROJECT: ZERO SERVER',
        status: 'online',
        rooms: rooms.size
    });
});

function createRoom(name, privateRoom = false) {
    const id = crypto.randomBytes(4).toString('hex');

    const room = {
        id,
        name,
        private: privateRoom,
        players: new Map(),
        mode: 'FREE MODE',
        createdAt: Date.now(),
        state: {
            started: false,
            time: 0,
            score: {
                blue: 0,
                red: 0
            }
        }
    };

    rooms.set(id, room);
    return room;
}

function getPlayerRoom(socket) {
    for (const room of rooms.values()) {
        if (room.players.has(socket.id)) return room;
    }

    return null;
}

function publicPlayer(player) {
    return {
        id: player.id,
        name: player.name,
        team: player.team,
        position: player.position,
        rotation: player.rotation,
        health: player.health,
        kills: player.kills,
        deaths: player.deaths
    };
}

function broadcastRoom(room) {
    io.to(room.id).emit('room:update', {
        id: room.id,
        name: room.name,
        mode: room.mode,
        players: [...room.players.values()].map(publicPlayer),
        state: room.state
    });
}

io.on('connection', socket => {
    console.log('Conectado:', socket.id);

    socket.emit('server:ready', {
        message: 'PROJECT ZERO SERVER READY'
    });

    socket.on('room:list', callback => {
        const list = [...rooms.values()]
            .filter(room => !room.private)
            .map(room => ({
                id: room.id,
                name: room.name,
                mode: room.mode,
                players: room.players.size,
                started: room.state.started
            }));

        if (typeof callback === 'function') callback(list);
    });

    socket.on('room:create', (data = {}, callback) => {
        if (getPlayerRoom(socket)) {
            if (typeof callback === 'function') {
                callback({ error: 'Você já está em uma sala.' });
            }
            return;
        }

        const name = String(data.name || 'Nova sala').slice(0, 30);
        const room = createRoom(name, Boolean(data.private));

        joinRoom(socket, room, data.playerName);

        if (typeof callback === 'function') {
            callback({ success: true, room: room.id });
        }
    });

    socket.on('room:join', (data = {}, callback) => {
        const room = rooms.get(String(data.room));

        if (!room) {
            if (typeof callback === 'function') {
                callback({ error: 'Sala não encontrada.' });
            }
            return;
        }

        if (room.private && data.password !== room.password) {
            if (typeof callback === 'function') {
                callback({ error: 'Senha incorreta.' });
            }
            return;
        }

        if (room.players.size >= 16) {
            if (typeof callback === 'function') {
                callback({ error: 'Sala cheia.' });
            }
            return;
        }

        if (getPlayerRoom(socket)) {
            if (typeof callback === 'function') {
                callback({ error: 'Você já está em uma sala.' });
            }
            return;
        }

        joinRoom(socket, room, data.playerName);

        if (typeof callback === 'function') {
            callback({ success: true, room: room.id });
        }
    });

    function joinRoom(socket, room, playerName) {
        const player = {
            id: socket.id,
            name: String(playerName || 'Player').slice(0, 20),
            team: room.players.size % 2 === 0 ? 'blue' : 'red',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            health: 100,
            kills: 0,
            deaths: 0
        };

        room.players.set(socket.id, player);
        socket.join(room.id);

        socket.emit('room:joined', {
            id: room.id,
            name: room.name,
            mode: room.mode,
            players: [...room.players.values()].map(publicPlayer)
        });

        socket.to(room.id).emit('player:joined', publicPlayer(player));

        broadcastRoom(room);
    }

    socket.on('player:move', data => {
        const room = getPlayerRoom(socket);
        if (!room) return;

        const player = room.players.get(socket.id);

        const valid = value =>
            typeof value === 'number' && Number.isFinite(value);

        if (
            !data ||
            !data.position ||
            !data.rotation ||
            !valid(data.position.x) ||
            !valid(data.position.y) ||
            !valid(data.position.z) ||
            !valid(data.rotation.y)
        ) return;

        const clamp = (value, min, max) =>
            Math.max(min, Math.min(max, value));

        player.position = {
            x: clamp(data.position.x, -500, 500),
            y: clamp(data.position.y, -50, 100),
            z: clamp(data.position.z, -500, 500)
        };

        player.rotation = {
            x: 0,
            y: clamp(data.rotation.y, -1000, 1000),
            z: 0
        };

        socket.to(room.id).emit('player:moved', {
            id: socket.id,
            position: player.position,
            rotation: player.rotation
        });
    });

    socket.on('player:shoot', data => {
        const room = getPlayerRoom(socket);
        if (!room || !data) return;

        socket.to(room.id).emit('player:shot', {
            id: socket.id,
            origin: data.origin,
            direction: data.direction
        });
    });

    socket.on('player:damage', data => {
        const room = getPlayerRoom(socket);
        if (!room || !data) return;

        const target = room.players.get(String(data.target));
        if (!target || target.id === socket.id) return;

        const attacker = room.players.get(socket.id);

        if (!attacker || attacker.team === target.team) return;

        const damage = Math.max(
            0,
            Math.min(Number(data.damage) || 0, 40)
        );

        target.health = Math.max(0, target.health - damage);

        if (target.health <= 0) {
            target.deaths++;
            attacker.kills++;

            room.state.score[attacker.team]++;

            target.health = 100;

            io.to(room.id).emit('player:eliminated', {
                attacker: attacker.id,
                target: target.id,
                score: room.state.score
            });
        }

        broadcastRoom(room);
    });

    socket.on('team:change', team => {
        const room = getPlayerRoom(socket);
        if (!room) return;

        if (team !== 'blue' && team !== 'red') return;

        const player = room.players.get(socket.id);
        player.team = team;

        broadcastRoom(room);
    });

    socket.on('mode:change', mode => {
        const room = getPlayerRoom(socket);
        if (!room) return;

        const allowed = [
            'FREE MODE',
            'TEAM FIGHT',
            'ELITE SQUAD',
            'TIME MODE',
            'OBJECTIVE MODE',
            'SURVIVAL',
            'TRAINING'
        ];

        if (!allowed.includes(mode)) return;

        room.mode = mode;
        broadcastRoom(room);
    });

    socket.on('chat:send', message => {
        const room = getPlayerRoom(socket);
        if (!room) return;

        const player = room.players.get(socket.id);
        const text = String(message || '').trim().slice(0, 200);

        if (!text) return;

        io.to(room.id).emit('chat:message', {
            id: socket.id,
            name: player.name,
            message: text,
            time: Date.now()
        });
    });

    socket.on('room:leave', () => leaveRoom(socket));

    socket.on('disconnect', () => {
        leaveRoom(socket);
        console.log('Desconectado:', socket.id);
    });
});

function leaveRoom(socket) {
    const room = getPlayerRoom(socket);
    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(room.id);

    io.to(room.id).emit('player:left', {
        id: socket.id
    });

    if (room.players.size === 0) {
        rooms.delete(room.id);
    } else {
        broadcastRoom(room);
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PROJECT ZERO SERVER: PORT ${PORT}`);
});
