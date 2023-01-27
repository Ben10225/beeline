// const socket = io({transports: ['websocket'], upgrade: false});
const socket = io({upgrade: true});

const localContainer = document.querySelector(".local-container")
const remoteContainer = document.querySelector(".remote-container")


const myPeer = new Peer()

const myVideo = document.createElement("video")
myVideo.muted = true

let tempMediaStreamId = null;
const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    addVideoStream(myVideo, stream, true)
    let localId = stream.id

    // 進房時監聽

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement("video")
        call.on("stream", userVideoStream => {
            if(localId !== userVideoStream.id)
            // console.log("stream", userVideoStream)
            addVideoStream(video, userVideoStream, false)
            // console.log("userVideoStream", userVideoStream)
        })
    })


    socket.on('user-connected', userId => {
        // console.log("User connected: " + userId)
        console.log("User connected: ", userId)
        connectToNewUser(userId, stream)
    })

    socket.on('user-disconnected', userId => {
        console.log("out meeting: ", userId)
        // let outUserDiv = document.querySelector(`#user-${userId}`)
        // outUserDiv.remove()
        if (peers[userId]) peers[userId].close()
    })
})





myPeer.on('open', id => {
    console.log(ROOM_ID, id)
    socket.emit('join-room', ROOM_ID, id)
})


socket.on('close-camera-view', (userId) => {
    let html = `
    <div class="black-block" style="background: #111; width:300px; height:300px; position: absolute; top:0"; left: 0></div>
    `
    document.querySelector(`#user-${userId} video`).insertAdjacentHTML("beforeend", html);
})


socket.on('open-camera-view', (userId) => {
    document.querySelector(`#user-${userId} .black-block`).remove()
})



function addVideoStream(video, stream, islocal){
    video.srcObject = stream
    // let audioStream = stream.getTracks()[0];
    // let videoStream = stream.getTracks()[1];

    if (tempMediaStreamId === stream.id) return

    if(islocal){
        document.querySelector(".close-audio").addEventListener("click", ()=>{
            stream.getTracks()[0].enabled = false
            // console.log(stream.getTracks()[0])

            // socket.emit("stop-camera", "user")
        })

        document.querySelector(".open-audio").addEventListener("click", ()=>{
            stream.getTracks()[0].enabled = true
            // socket.emit("open-camera", "user")
        })

        document.querySelector(".close-video").addEventListener("click", ()=>{
            stream.getTracks()[1].enabled = false
            socket.emit("stop-camera", stream.id)
            // MediaStream.enabled = false
        })
    
        document.querySelector(".open-video").addEventListener("click", ()=>{
            stream.getTracks()[1].enabled = true
            socket.emit("open-camera", stream.id)
        })

        let player = `
        <div id="user-${stream.id}">
            <h2>本人</h2>
        </div>
        `
    
        localContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${stream.id}`).append(video)

    }else{
        let player = `
        <div id="user-${stream.id}" style="position: relative;">
            <h2>${stream.id}</h2>
        </div>
        `
    
        remoteContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${stream.id}`).append(video)
    }
    tempMediaStreamId = stream.id;
}

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    let video = document.createElement("video")
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream, false)
    })
    call.on("close", () => {
        video.remove()
    })

    peers[userId] = call
}
