
import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import { Server } from 'socket.io';

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

const MODES = [
    'FREE MODE',
    'TEAM FIGHT',
    'ELITE SQUAD',
    'TIME MODE',
    'OBJECTIVE MODE',
    'SURVIVAL',
    'TRAINING'
];

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        name: 'PROJECT: ZERO',
        server: 'ONLINE',
        rooms: rooms.size,
        version: '1.0.0'
    });
});

function createRoom(data) {
    const id = crypto.randomBytes(4).toString('hex');

    const room = {
        id,
        name: String(data.name || 'Nova sala').slice(0, 30),
        private: Boolean(data.private),
        password: data.private ? String(data.password || '') : null,
        mode: 'FREE MODE',
        players: new Map(),
        state: {
            started: false,
            score: { blue: 0, red: 0 },
            time: 0
        }
    };

    rooms.set(id, room);
    return room;
}

function findRoom(socket) {
    for (const room of rooms.values()) {
        if (room.players.has(socket.id)) return room;
    }

    return null;
}

function playerData(player) {
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

function broadcast(room) {
    io.to(room.id).emit('room:update', {
        id: room.id,
        name: room.name,
        mode: room.mode,
        state: room.state,
        players: [...room.players.values()].map(playerData)
    });
}

function leaveRoom(socket) {
    const room = findRoom(socket);
    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(room.id);

    io.to(room.id).emit('player:left', {
        id: socket.id
    });

    if (room.players.size === 0) {
        rooms.delete(room.id);
    } else {
        broadcast(room);
    }
}

function joinRoom(socket, room, name) {
    const player = {
        id: socket.id,
        name: String(name || 'Player').slice(0, 20),
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
        players: [...room.players.values()].map(playerData)
    });

    socket.to(room.id).emit('player:joined', playerData(player));
    broadcast(room);
}

io.on('connection', socket => {
    console.log('Player conectado:', socket.id);

    socket.emit('server:ready', {
        message: 'PROJECT ZERO SERVER READY'
    });

    socket.on('room:list', callback => {
        if (typeof callback !== 'function') return;

        callback([...rooms.values()]
            .filter(room => !room.private)
            .map(room => ({
                id: room.id,
                name: room.name,
                mode: room.mode,
                players: room.players.size,
                started: room.state.started
            }))
        );
    });

    socket.on('room:create', (data = {}, callback) => {
        if (findRoom(socket)) {
            callback?.({ error: 'Você já está em uma sala.' });
            return;
        }

        if (data.private && !data.password) {
            callback?.({ error: 'Defina uma senha para a sala.' });
            return;
        }

        const room = createRoom(data);
        joinRoom(socket, room, data.playerName);

        callback?.({
            success: true,
            room: room.id
        });
    });

    socket.on('room:join', (data = {}, callback) => {
        if (findRoom(socket)) {
            callback?.({ error: 'Você já está em uma sala.' });
            return;
        }

        const room = rooms.get(String(data.room));

        if (!room) {
            callback?.({ error: 'Sala não encontrada.' });
            return;
        }

        if (room.private && data.password !== room.password) {
            callback?.({ error: 'Senha incorreta.' });
            return;
        }

        if (room.players.size >= 16) {
            callback?.({ error: 'Sala cheia.' });
            return;
        }

        joinRoom(socket, room, data.playerName);

        callback?.({
            success: true,
            room: room.id
        });
    });

    socket.on('player:move', data => {
        const room = findRoom(socket);
        if (!room || !data?.position || !data?.rotation) return;

        const values = [
            data.position.x,
            data.position.y,
            data.position.z,
            data.rotation.y
        ];

        if (!values.every(Number.isFinite)) return;

        const player = room.players.get(socket.id);

        const clamp = (value, min, max) =>
            Math.max(min, Math.min(max, value));

        player.position = {
            x: clamp(data.position.x, -500, 500),
            y: clamp(data.position.y, -50, 100),
            z: clamp(data.position.z, -500, 500)
        };

        player.rotation.y = clamp(data.rotation.y, -1000, 1000);

        socket.to(room.id).emit('player:moved', {
            id: socket.id,
            position: player.position,
            rotation: player.rotation
        });
    });

    socket.on('player:shoot', data => {
        const room = findRoom(socket);
        if (!room || !data) return;

        socket.to(room.id).emit('player:shot', {
            id: socket.id,
            origin: data.origin,
            direction: data.direction
        });
    });

    socket.on('player:damage', data => {
        const room = findRoom(socket);
        if (!room || !data) return;

        const target = room.players.get(String(data.target));
        const attacker = room.players.get(socket.id);

        if (!target || !attacker || target.id === attacker.id) return;
        if (target.team === attacker.team) return;

        const damage = Math.max(
            0,
            Math.min(Number(data.damage) || 0, 40)
        );

        target.health = Math.max(0, target.health - damage);

        if (target.health === 0) {
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

        broadcast(room);
    });

    socket.on('team:change', team => {
        const room = findRoom(socket);
        if (!room || !['blue', 'red'].includes(team)) return;

        room.players.get(socket.id).team = team;
        broadcast(room);
    });

    socket.on('mode:change', mode => {
        const room = findRoom(socket);
        if (!room || !MODES.includes(mode)) return;

        room.mode = mode;
        broadcast(room);
    });

    socket.on('chat:send', message => {
        const room = findRoom(socket);
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
        console.log('Player desconectado:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`PROJECT ZERO SERVER running on port ${PORT}`);
});
