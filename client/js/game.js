import { LeafletMap, escape } from "./map.js"  

const map = new LeafletMap()

const leaveGame = document.getElementById("leave2")
const playersLobby = document.getElementById("playerList")

const startButton = document.getElementById("start")
const leaveLobby = document.getElementById("leave")

const lobby = document.getElementById("lobby")
const game = document.getElementById("game")

const stopGame = document.getElementById("stopgame")

const closeName = document.getElementById("closename")

const suicide = document.getElementById("suicide")

const timer = document.getElementById("timer-time")
const timerText = document.getElementById("timer-text")
const timerParent = document.getElementById("timer")

var interval

var lastUpdate = new Date().getTime()
setInterval(() => {
    if (new Date().getTime() - lastUpdate > 10000){
        window.location.href = "/"
    }
}, 1000)

const url = "https://server.zonewarz.com"

var audio = new Audio('/assets/sounds/beep.mp3')
function PlayBeep() {
    audio.play().catch(()=>{})
}

function GameStart(socket, map, init){
    const playerRole = init.self.seeker
    map.CenterMap()

    if(playerRole ){
        suicide.style.display='none'
    } else{
        suicide.style.display='flex'
    }

    // ! What is this? Most likely a bug with leaflet<!
    map.CreateSetZone(map.ConvertPosition({
        lat: init.center.lon,
        lon: init.center.lat
    }), init.radius)


    function WaitUntilClick(ready){
        document.popup({
            message: "Click anywhere!"
        })
        document.onclick = () => {
            ready()
            document.onclick = () => {}
        }
    }

    WaitUntilClick(()=>{
        PlayBeep()
    })

    function timerStart(){
        timerParent.style.display = 'flex'
        timer.classList.remove( 'slow','medium', 'fast')
        timer.classList.add('slow')
        var time = init.settings.HideTime - (init.time - init.StartedTime)
        if (time < 0) {
            timerParent.style.display = 'none'
            return
        }
        
        const tickRate = 1000

        if(playerRole == true){
            timerText.innerHTML = "Seeker, dont move!"
            timerText.style.color = 'red'
        } else {
            timerText.innerHTML = "Hider, hide!"
            timerText.style.color = 'white'
        }

        var i = Math.floor(time/1000)
        const ii = Math.floor(time/1000)
        
        interval = setInterval(()=>{
            const min = Math.floor(i/60)
            const sec = Math.floor(i - (min*60))
            if(i <= 0){
                clearInterval(interval)
                timerParent.style.display = 'none'
                return
            }

            if(i <  (ii - (ii/3) ) && timer.classList.contains('slow')){
                timer.classList.remove('slow')
                timer.classList.add('medium')
            } else if(i <  (ii - ((ii/3)*2)) && timer.classList.contains('medium')){
                timer.classList.remove('medium')
                timer.classList.add('fast')
            }
        
            timer.innerHTML = (`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`)

            i -= 1
            timerParent.style.display = 'flex'
        },tickRate)
    }

    timerStart()
}

function GameEnd(socket, map){
    if(interval)clearInterval(interval)
    map.RemoveZone()

    for (var marker of document.getElementsByClassName("leaflet-marker-icon")){
        marker.remove()
    }
}   


function MakeQrcode(input) {
    new QRCode("qrcode", input)
} 




const LobbyPlayerMap = {}
const GamePlayerMap = {}

function GameRunning(data, socket, map){
    if (data.closest){
        //closename.innerText = data.closest.player

        if(data.closest.distance < 5){
            PlayBeep()

            setTimeout(() => {
                PlayBeep()
            }, 250)
            setTimeout(() => {
                PlayBeep()
            }, 500)
        }
        else if(data.closest.distance < 10){
            PlayBeep()
            setTimeout(() => {
                PlayBeep()
            }, 250)
        }
        else if(data.closest.distance < 20){
            PlayBeep()
        }
    }

    function AddNew(player){
        var type = player.username == data.self.username ? "self" : "friend"
        type = player.eliminated ? "seeker" : type  
        GamePlayerMap[player.username].marker = map.AddPlayerMarker(player.username, map.ConvertPosition(player.position), type)
    }

    function RemovePlayer(player, elem){

        delete GamePlayerMap[player.username]
        if (elem) elem.parentElement.remove()
    }

    const players = data.players
    players.push(data.self)

    for (var player of players){
        if (!GamePlayerMap[player.username]){
            GamePlayerMap[player.username] = player
            AddNew(player)
            continue
        }

        GamePlayerMap[player.username].marker.setLatLng(map.ConvertPosition(player.position))
        GamePlayerMap[player.username].eliminated = player.eliminated
    }

    for (var username in GamePlayerMap){
        const marker = document.getElementById(`MUUID-${escape(username)}`)

        if (players.filter((item) => username == item.username).length < 1){
            RemovePlayer(GamePlayerMap[username], marker)
        }
        
        if (GamePlayerMap[username].eliminated) {
            if (!marker || marker.classList.contains("seeker")) continue
            marker.classList.remove("friend", "self")
            marker.classList.add("seeker")
        }
    }

    map.SetZoneRadius(data.radius)
}



function GameLobby(data, socket){
    function AddNew(player){
        playersLobby.innerHTML += `<div class="player" id="PUUID-${escape(player.username)}">
            <p>${escape(player.username)}</p>
        </div>`
    }

    function RemovePlayer(player){
        delete LobbyPlayerMap[player.username]
    }



    const players = data.players
    players.push(data.self)

    for (var player of players){
        var rplayer = LobbyPlayerMap[player.username]

        if (!rplayer){
            AddNew(player)
            LobbyPlayerMap[player.username] = player
        } else {
            rplayer.seeker = player.seeker
        }
    }

    for (var username in LobbyPlayerMap){
        const player = LobbyPlayerMap[username]
        const elem = document.getElementById(`PUUID-${escape(player.username)}`)
        elem.style.color = player.seeker ? "#ff0000" : "#00ff00"

        if (data.self.host){
            elem.onclick = () => {
                socket.emit("SetSeeker", player.username, !player.seeker)
            }    
        }

        if (players.filter((item) => username == item.username).length < 1){
            RemovePlayer(player)
        }
    }
}


function ready(socket, map, init) { 
    const eliminate = (msg) => {
        document.popup(msg, true)
    }

    suicide.addEventListener("click", () => {
        socket.emit("EliminateSelf")
    })    

    if (init.self.eliminated){
        eliminate({
            message: "You are eliminated."
        })
    }

    socket.on("popup", document.popup)

    socket.on("eliminated", () => {
        eliminate({
            message: "You are eliminated."
        })
    })

    socket.on("GameEnd", () => {
        window.location.href = "/"
    })
    
    document.getElementById("id").innerText = init.GID
    MakeQrcode(window.location.origin + `?join=${init.GID}`)

    setInterval(() => {
        socket.emit("UpdatePosition", {
            lon: map.position.lng,
            lat: map.position.lat
        })
    }, 2000)

    startButton.onclick = () => {
        socket.emit("StartGame")
    }

    stopGame.onclick = () => {
        socket.emit("ResetGame")
    }

    leaveLobby.onclick = () => {
        if (init.self.host){
            socket.emit("EndGame")
        }
        socket.emit("LeaveGame")
        window.location.href = "/"
    }

    leaveGame.onclick = () => {
        socket.emit("LeaveGame")
        window.location.href = "/"
    }

    if (init.self.host) {
        leaveGame.style.display = "none"
        stopGame.style.display = "flex"

        leaveLobby.innerText = "end"
    } else {
        stopGame.style.display = "none"
        leaveGame.style.display = "flex"
    } 

    var n = !init.started
    socket.on("GameData", (data) => {
        lastUpdate = new Date().getTime()

        if (data.started == true && n == false){
            game.style.visibility = "visible"
            lobby.style.display = "none"
    
            n = true
            GameStart(socket, map, data)
        }
        else if (data.started == false && n == true){
            n = false
            lobby.style.display = "flex"
            game.style.visibility = "hidden"

            GameEnd(socket, map)
        }

        if (data.self.host == true){
            startButton.style.display = "flex"
        }

        if (data.started) {
            GameRunning(data, socket, map)
        } else {
            GameLobby(data, socket)
        }
    })
}


function mapReady() {
    map.CenterMap()

    const socket = io(url)
    socket.on('connect', () => {

        const session = localStorage.getItem("session")
        socket.emit("session", session)

        socket.on("session", (session) => {
            localStorage.setItem("session", session)
            socket.once("GameData", (data) => ready(socket, map, data))
        })
    })
}

map.init("gameMap", false).then(() => mapReady()).catch(() => mapReady())


