import utils from "./utils.js" 

let userData = null;

userData = await utils.auth("room");

let localUuid = userData.uuid;
let localName = userData.name;
let localImgUrl = userData.imgUrl;
let localPeerId = null;



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
    setPeerid(localUuid, id);
    localPeerId = id;
    socket.emit('join-room', ROOM_ID, id);
})

// camera
socket.on('close-camera-view', (peerId) => {
    let remoteDiv = document.querySelector(`#user-${peerId} .user-block`);
    if(remoteDiv){
        remoteDiv.classList.add("show");
    }
})

socket.on('open-camera-view', (peerId) => {
    let remoteDiv = document.querySelector(`#user-${peerId} .user-block`);
    if(remoteDiv){
        remoteDiv.classList.remove("show");
    }
})

// audio
socket.on('show-unvoice-icon', (peerId) => {
    let remoteVoiceIcon = document.querySelector(`#user-${peerId} .micro-status-icon`);
    if(remoteVoiceIcon){
        remoteVoiceIcon.classList.add("show");
    }
})

socket.on('hide-unvoice-icon', (peerId) => {
    let remoteVoiceIcon = document.querySelector(`#user-${peerId} .micro-status-icon`);
    if(remoteVoiceIcon){
        remoteVoiceIcon.classList.remove("show");
    }
})



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

    // stream.getTracks()[1].enabled = false;
    // stream.getTracks()[0].enabled = false;

    if(islocal){
        tempMediaStreamId = stream.id;

        // camera button
        const cameraBtn = document.querySelector("#camera-btn");
        let toggleCamera = async () => {
            let isOpen = stream.getTracks()[1].enabled;
            if(isOpen){
                cameraBtn.classList.add("disable");
                document.querySelector(".user-block.local").classList.add("show");
                stream.getTracks()[1].enabled = false;
                socket.emit("stop-camera", localPeerId);
            }else{
                cameraBtn.classList.remove("disable");
                document.querySelector(".user-block.local").classList.remove("show");
                stream.getTracks()[1].enabled = true;
                socket.emit("open-camera", localPeerId);
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
                document.querySelector(".micro-status-icon.local").classList.add("show");
                socket.emit("stop-audio", localPeerId);
            }else{
                audioBtn.classList.remove("disable");
                stream.getTracks()[0].enabled = true;
                document.querySelector(".micro-status-icon.local").classList.remove("show");
                socket.emit("open-audio", localPeerId);
            }
        }
        audioBtn.onclick = () => {
            toggleAudio();
        }
        stream.getTracks()[0].enabled = false;
        stream.getTracks()[1].enabled = false;


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
        let imgSetting = "";
        if(localImgUrl[0] !== "#"){
            imgSetting = `
            <div class="img-bg" style="
                background-image: url('${localImgUrl}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            "></div>
            `;
        }else{
            imgSetting = `
            <div class="img-bg" style="background-color: ${localImgUrl};">
                <h3>${localName[0]}</h3>
            </div>
            `;
        }
        let player = `
        <div class="video-container">
            <div class="username-wrapper">
                <span class="user-name">${localName}</span>
            </div>
            <div class="video-player" id="user-${stream.id}">
                <div class="micro-status-icon local show"></div>
                <div class="user-block local show">
                    <div class="auto-img">
                        ${imgSetting}
                    </div>
                </div>
            </div>
        </div>
        `
    
        remoteContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${stream.id}`).append(video)
    }else{
        tempRemoteMediaStreamId = stream.id

        let player = `
        <div class="video-container" id="wrapper-${remotePeerid}">
            <div class="username-wrapper">
                <span class="user-name"></span>
            </div>
            <div class="video-player" id="user-${remotePeerid}">
            <div class="micro-status-icon show"></div>
                <div class="user-block show">
                    <div class="auto-img">
                        <div class="img-bg">
                            <h3></h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
    
        remoteContainer.insertAdjacentHTML("afterbegin", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${remotePeerid}`).append(video)

        let data = await getRemoteUser(remotePeerid);
        let remoteName = data.name;
        let remoteImgUrl = data.imgurl;
        document.querySelector(`#wrapper-${remotePeerid} span`).textContent = remoteName;
        if(remoteImgUrl[0] !== "#"){
            document.querySelector(`#wrapper-${remotePeerid} .img-bg`).style = `
                background-image: url('${remoteImgUrl}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            `;
        }else{
            document.querySelector(`#wrapper-${remotePeerid} .img-bg`).style = `background-color: ${remoteImgUrl}`;
            document.querySelector(`#wrapper-${remotePeerid} h3`).textContent = remoteName[0];
        }
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
    let response = await fetch(`/api/getremoteuser`, {
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


let generateShortLink = async () => {
    let currentUrl = window.location.href;
    const copyIcon = document.querySelector(".fa-copy");
    document.querySelector("#room-url").textContent = currentUrl;
    copyIcon.addEventListener("click", ()=>{
        copyContent(currentUrl);
        copyIcon.style.opacity = "0.8";
        setTimeout(()=>{
            copyIcon.style.opacity = "0.3";
        }, 700)
    })
}


let copyContent = async (url) => {
    try {
        await navigator.clipboard.writeText(url)
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

generateShortLink();