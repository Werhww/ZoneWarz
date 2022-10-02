import express from "express"
import * as http from "http"
import * as socket from "socket.io"

import {join} from "path"

import { Player } from "./socket/player"

const app = express()
const server = http.createServer(app);
const io = new socket.Server(server);

app.use(express.static(join(__dirname, "client-test")))

io.on('connection', (socket) => {
  const player = new Player(socket)
  socket.on("disconnect", () => {
    player.RemovePlayer()
  })
})

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000")
})  