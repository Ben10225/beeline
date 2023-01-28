import utils from "./utils.js" 

let userData = null;

userData = await utils.auth("room");
let localUuid = userData.uuid;
let localName = userData.name;
// let localImgUrl = userData.imgUrl;



// const socket = io({transports: ['websocket'], upgrade: false});
const socket = io({upgrade: true});

const localContainer = document.querySelector(".local-container")
const remoteContainer = document.querySelector(".remote-container")


// const myPeer = new Peer()
const myPeer = new Peer()

const myVideo = document.createElement("video")
myVideo.muted = true

let tempMediaStreamId = null;
let tempRemoteMediaStreamId = null;

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
        let remotePeerid = call.peer
        call.on("stream", userVideoStream => {
            if(localId !== userVideoStream.id)
            // console.log("stream", userVideoStream)
            addVideoStream(video, userVideoStream, false, remotePeerid)
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
    setPeerid(localUuid, id)
    socket.emit('join-room', ROOM_ID, id)
})


// socket.on('close-camera-view', (userId) => {
//     let html = `
//     <div class="black-block" style="background: #111; width:300px; height:300px; position: absolute; top:0"; left: 0></div>
//     `
//     document.querySelector(`#user-${userId} video`).insertAdjacentHTML("beforeend", html);
// })


// socket.on('open-camera-view', (userId) => {
//     document.querySelector(`#user-${userId} .black-block`).remove();
// })

socket.on('leave-video-remove', (peerId) => {
    let remoteUserWrapper =  document.querySelector(`#wrapper-${peerId}`);
    if(remoteUserWrapper){
        document.querySelector(`#wrapper-${peerId}`).remove();
    }
})



async function addVideoStream(video, stream, islocal, remotePeerid){
    video.srcObject = stream
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return

    if(islocal){
        tempMediaStreamId = stream.id;

        // camera button
        const cameraBtn = document.querySelector("#camera-btn");
        let toggleCamera = async () => {
            let isOpen = stream.getTracks()[1].enabled;
            if(isOpen){
                cameraBtn.classList.add("disable");
                stream.getTracks()[1].enabled = false;
                // socket.emit("stop-camera", stream.id);
            }else{
                cameraBtn.classList.remove("disable");
                stream.getTracks()[1].enabled = true;
                // socket.emit("open-camera", stream.id);
            }
        }
        cameraBtn.onclick = () => {
            toggleCamera();
        }

        // audio button
        const audioBtn = document.querySelector("#audio-btn");
        let toggleAudio = async () => {
            let isVolumn = stream.getTracks()[0].enabled;
            if(isVolumn){
                audioBtn.classList.add("disable");
                stream.getTracks()[0].enabled = false;
            }else{
                audioBtn.classList.remove("disable");
                stream.getTracks()[0].enabled = true;
            }
        }
        audioBtn.onclick = () => {
            toggleAudio();
        }

        // leave room
        const leaveBtn = document.querySelector("#leave-btn");
        leaveBtn.onclick = async () => {
            let localPeerId = await getLocalPeerId(localUuid)
            socket.emit("leave-room", localPeerId);
            window.location = "/";
        }


        /*

        document.querySelector(".close-audio").addEventListener("click", ()=>{
            stream.getTracks()[0].enabled = false
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
        */

        let player = `
        <div class="video-container">
            <div class="username-wrapper">
                <span class="user-name">${localName}</span>
            </div>
            <div class="video-player" id="user-${stream.id}"></div>
        </div>
        `
    
        localContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${stream.id}`).append(video)
    }else{
        tempRemoteMediaStreamId = stream.id

        let remoteName = await getRemoteUser(remotePeerid);

        let player = `
        <div class="video-container" id="wrapper-${remotePeerid}">
            <div class="username-wrapper">
                <span class="user-name">${remoteName}</span>
            </div>
            <div class="video-player" id="user-${remotePeerid}"></div>
        </div>
        `
    
        remoteContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${remotePeerid}`).append(video)
    }
}

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    let video = document.createElement("video")
    let remotePeerid = call.peer
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream, false, remotePeerid)
    })
    call.on("close", () => {
        video.remove()
    })

    peers[userId] = call
}


let getRemoteUser = async (remotePeerid) => {
    let response = await fetch(`/api/getusername`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "peerId": remotePeerid
        })
    });
    let data = await response.json();
    if(data.data){
        return data.data
    }
}

let setPeerid = async (uuid, peerId) => {
    let response = await fetch(`/api/setpeerid`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "uuid": uuid,
            "peerId": peerId
        })
    });
    let data = await response.json();
}

let getLocalPeerId = async (uuid) => {
    let response = await fetch(`/api/getlocalpeerid`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "uuid": uuid
        })
    });
    let data = await response.json();
    if(data.data){
        return data.data
    }
}