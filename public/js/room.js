import utils from "./utils.js" 

let userData = null;

userData = await utils.auth("room");

let localUuid = userData.uuid;
let localName = userData.name;
let localImgUrl = userData.imgUrl;

let enterRoom = false;
if(localUuid){
    let timer = setInterval(() => {
        if(!enterRoom){
            connectPeer();
        }else{
            console.log("enter");
            clearInterval(timer);
        }
    }, 5000);
}


// const socket = io({transports: ['websocket'], upgrade: false});
// const socket = io({upgrade: true});
const socket = io({upgrade: true});

const localContainer = document.querySelector(".local-container")
const remoteContainer = document.querySelector(".remote-container")


// const myPeer = new Peer()
const myPeer = new Peer(localUuid)

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

    // 進房時監聽
    myPeer.on('call', function(call){
        call.answer(stream)
        const video = document.createElement("video")
        let remotePeerid = call.peer
        call.on("stream", userVideoStream => {
            if (localUuid === userVideoStream.id) return
            // console.log("stream", userVideoStream)
            addVideoStream(video, userVideoStream, false, remotePeerid)
        })
    })

    socket.on('user-connected', async uuid => {
        console.log("User connected: ", uuid);
        connectToNewUser(uuid, stream);
        if(localUuid === uuid){
            insertMongoRoomData(ROOM_ID, uuid, true, true);
            enterRoom = true;
        }
    })
    
    
    socket.on('user-disconnected', uuid => {
        console.log("out meeting: ", uuid)
        // let outUserDiv = document.querySelector(`#wrapper-${userId}`);
        // if(outUserDiv){
        //     outUserDiv.remove();
        // }
        // if (peers[userId]) peers[userId].close();
        // if (userId === localPeerId) window.location = "/";
    })

})


function connectPeer(){
    myPeer.on('open', async id => {
        socket.emit('join-room', ROOM_ID, id);
        // localPeerId = id;
        // await setPeerid(localUuid, id);
    })
}

connectPeer()


// camera
socket.on('set-view', (options, uuid, b) => {
    if (uuid === localUuid) return
    if(options === "video"){
        let remoteDiv = document.querySelector(`#user-${uuid} .user-block`);
        if(remoteDiv && b){
            remoteDiv.classList.remove("show");
        }else if(remoteDiv && !b){
            remoteDiv.classList.add("show");
        }
    }else if(options === "audio"){
        let remoteDiv = document.querySelector(`#user-${uuid} .micro-status-icon`)
        if(remoteDiv && b){
            remoteDiv.classList.remove("show");
        }else if(remoteDiv && !b){
            remoteDiv.classList.add("show");
        }
    }
})


socket.on('close-camera-view', (peerId) => {
    if (peerId === localUuid) return
    let remoteDiv = document.querySelector(`#user-${peerId} .user-block`);
    // if(remoteDiv && !remoteDiv.classList.contains("show")){
    //     remoteDiv.classList.add("show");
    // }
    if(remoteDiv){
        remoteDiv.classList.add("show");
    }
})


socket.on('open-camera-view', (peerId) => {
    if (peerId === localUuid) return
    let remoteDiv = document.querySelector(`#user-${peerId} .user-block`);
    // if(remoteDiv && remoteDiv.classList.contains("show")){
    //     remoteDiv.classList.remove("show");
    // }  
//     let remoteDiv = document.querySelector(`#user-${peerId} .user-block`);
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



async function addVideoStream(video, stream, islocal, remoteUuid){
    video.srcObject = stream
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return


    if(islocal){
        tempMediaStreamId = stream.id;

        // stream.getTracks()[1].enabled = false;
        // stream.getTracks()[0].enabled = false;

        // camera button
        const cameraBtn = document.querySelector("#camera-btn");
        let toggleCamera = async () => {
            // let isOpen = stream.getTracks()[1].enabled;
            let oldLocalUuid = localUuid;
            if(!document.querySelector(".user-block.local").classList.contains("show")){
                cameraBtn.classList.add("disable");
                document.querySelector(".user-block.local").classList.add("show");
                // stream.getTracks()[1].enabled = false;
                socket.emit("set-option", ROOM_ID, "video", localUuid, false);
                // if(localUuid.split("-")[1] === undefined){
                //     localUuid = localUuid + "-0";
                // }else{
                //     localUuid = localUuid.split("-")[0] + "-0" + localUuid.split("-")[1].slice(1);
                // }
                // await setUserStreamStatus(localUuid, "video", false, false);
            }else{
                cameraBtn.classList.remove("disable");
                document.querySelector(".user-block.local").classList.remove("show");
                // stream.getTracks()[1].enabled = true;
                socket.emit("set-option", ROOM_ID, "video", localUuid, true);
                // localUuid = localUuid + "-1";
                // if(localUuid.split("-")[1] === undefined){
                //     localUuid = localUuid + "-1";
                // }else{
                //     localUuid = localUuid.split("-")[0] + "-1" + localUuid.split("-")[1].slice(1);
                // }
                // await setUserStreamStatus(localUuid, "video", true, false);
            }
            // await setUuid(oldLocalUuid, localUuid);

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
                socket.emit("set-option", ROOM_ID, "audio", localUuid, false);

                // await setUserStreamStatus(localUuid, "audio", false, false);

            }else{
                audioBtn.classList.remove("disable");
                stream.getTracks()[0].enabled = true;
                document.querySelector(".micro-status-icon.local").classList.remove("show");
                socket.emit("set-option", ROOM_ID, "audio", localUuid, true);

                // await setUserStreamStatus(localUuid, "audio", true, false);
            }
        }
        audioBtn.onclick = () => {
            toggleAudio();
        }

        // leave room
        const leaveBtn = document.querySelector("#leave-btn");
        leaveBtn.onclick = async () => {
            // let localPeerId = await getLocalPeerId(localUuid)
            socket.emit("leave-room", ROOM_ID, localUuid);
            socket.disconnect();
            removeMongoRoomData(ROOM_ID, localUuid);
            // setUserStreamStatus(localUuid, "video", false, true);
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
            <div class="video-player" id="user-${localUuid}">
                <div class="micro-status-icon local"></div>
                <div class="user-block local">
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
        document.querySelector(`#user-${localUuid}`).append(video);

        // setUserStreamStatus(localUuid, "video", false, true);

    }else{
        tempRemoteMediaStreamId = stream.id

        // let remoteVideoStatus = stream.getTracks()[1].enabled;
        // let remoteAudioStatus = stream.getTracks()[0].enabled;

        let videoTag = null;
        let audioTag = null;

        // if(remoteVideoStatus){
        //     videoTag = `<div class="user-block">`;
        // }else{
        //     videoTag = `<div class="user-block show">`;
        // }


        // if(remoteAudioStatus){
        //     audioTag = `<div class="micro-status-icon"></div>`;
        // }else{
        //     audioTag = `<div class="micro-status-icon show"></div>`;
        // }

        let player = `
        <div class="video-container" id="wrapper-${remoteUuid}">
            <div class="username-wrapper">
                <span class="user-name"></span>
            </div>
            <div class="video-player" id="user-${remoteUuid}">
                <div class="micro-status-icon"></div>
                <div class="user-block">
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
        document.querySelector(`#user-${remoteUuid}`).append(video)

        let data = await getRemoteUser(remoteUuid);
        let remoteName = data.name;
        let remoteImgUrl = data.imgurl;
        // let remoteVideoStatus = data.videostatus;
        // let remoteAudioStatus = data.audiostatus;

        document.querySelector(`#wrapper-${remoteUuid} span`).textContent = remoteName;
        if(remoteImgUrl[0] !== "#"){
            document.querySelector(`#wrapper-${remoteUuid} .img-bg`).style = `
                background-image: url('${remoteImgUrl}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            `;
        }else{
            document.querySelector(`#wrapper-${remoteUuid} .img-bg`).style = `background-color: ${remoteImgUrl}`;
            document.querySelector(`#wrapper-${remoteUuid} h3`).textContent = remoteName[0];
        }
        // if(remoteVideoStatus){
        //     document.querySelector(`#wrapper-${remotePeerid} .user-block`).classList.remove("show");
        // }
        // if(remoteAudioStatus){
        //     document.querySelector(`#wrapper-${remotePeerid} .micro-status-icon`).classList.remove("show");
        // }
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


let getRemoteUser = async (remoteUuid) => {
    let response = await fetch(`/api/getremoteuser`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "uuid": remoteUuid
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


let setUserStreamStatus = async (uuid, status, bool, bothSetFalse) => {
    let response = await fetch(`/api/setuservideostatustrue`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "uuid": uuid,
            "status": status,
            "b": bool,
            "both": bothSetFalse,
        })
    });
    let data = await response.json();
}


let setUuid = async (oldUuid, newUuid) => {
    let response = await fetch(`/api/setnewuuid`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "oldUuid": oldUuid,
            "newUuid": newUuid,
        })
    });
    let data = response.json();
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

let insertMongoRoomData = async (roomId, uuid, audioStatus, videoStatus) => {
    let response = await fetch(`/room/setusertoroom`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "audioStatus": audioStatus,
            "videoStatus": videoStatus,
        })
    });
    let data = response.json();
}

let removeMongoRoomData = async (roomId, uuid) => {
    let response = await fetch(`/room/deleteuserfromroom`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
        })
    });
    let data = response.json();
}


generateShortLink();



