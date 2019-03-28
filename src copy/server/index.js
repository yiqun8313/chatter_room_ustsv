var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);

let users = new Map();
users.set("Lobby1", []);
let rooms = ["Lobby1"];
let curId = 1;

io.on("connection", socket => {
  socket.on("login", res => {
    users.get("Lobby1").push(`Guest${curId}`);
    let userName = `Guest${curId++}`;
    socket.emit("loginSuccess", {
      userName: userName,
      rooms: rooms,
      room: "Lobby1"
    });

    socket.join("Lobby1");
    socket.emit("updateChat", "SERVER", `You have entered Lobby1.`);
    socket.emit(
      "updateChat",
      "SERVER",
      `Users currently in Lobby1: ${users.get("Lobby1")}`
    );
    socket.broadcast
      .to("Lobby1")
      .emit("updateChat", "SERVER", `'${userName}' has joined this room.`);
  });

  socket.on("sendChat", (name, message, room) => {
    socket.emit("updateChat", "You", message);
    socket.broadcast.to(room).emit("updateChat", name, message);
  });

  socket.on("changeName", (oldName, newName, room) => {
    delete users[oldName];
    let tmp = users.get(room);
    let index = tmp.indexOf(oldName);
    tmp.splice(index, 1, newName);
    users.set(room, tmp);

    socket.emit(
      "updateChat",
      "SERVER",
      `You have changed your name to '${newName}'`
    );
    socket.broadcast
      .to(room)
      .emit(
        "updateChat",
        "SERVER",
        `'${oldName}' has changed name to '${newName}'.`
      );
  });

  socket.on("changeRoom", (prevRoom, nextRoom, name) => {
    if (prevRoom === nextRoom) {
      socket.emit("updateChat", "SERVER", `You\`ve already in ${prevRoom}`);
      return;
    }
    if (!rooms.includes(nextRoom)) {
      rooms.push(nextRoom);
    }
    socket.leave(prevRoom);
    socket.join(nextRoom);
    if (!users.has(nextRoom)) {
      users.set(nextRoom, []);
    }
    let array1 = users.get(prevRoom);
    array1.splice(array1.indexOf(name), 1);
    users.set(prevRoom, array1);
    users.set(nextRoom, [...users.get(nextRoom), name]);

    socket.emit("updateChat", "SERVER", `You have entered ${nextRoom}`);
    socket.emit(
      "updateChat",
      "SERVER",
      `Users currently in ${nextRoom}: ${users.get(nextRoom)}`
    );
    socket.broadcast
      .to(prevRoom)
      .emit("updateChat", "SERVER", `'${name}' has left the room.`);
    socket.broadcast
      .to(nextRoom)
      .emit("updateChat", "SERVER", `'${name}' has joined this room.`);
    io.local.emit("updateRooms", rooms);
  });
});

const port = 5000;

server.listen(port, () => console.log(`Listening on port ${port}`));
