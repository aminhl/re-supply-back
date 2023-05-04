const mongoose = require("mongoose").default;
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

// database connection

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
  })
  .then(() => console.log("resupply-DB connection established"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`ReSupply Application listening on port ${port}`);
});
const io = require("socket.io")(server, {
  pingTimeout: 600000,
  cors: { origin: "http://localhost:4200" },
});
io.on("connection", (socket) => {
  console.log("connected to back socket.io");

  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("user id", userId);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("new message", (newMsg) => {
    let chat = newMsg.chat;
    console.log("chat", chat);

    io.to(chat._id).emit("message received", newMsg);
    console.log("newmsg ", newMsg.content);
  });
});
