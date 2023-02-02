import utils from "./utils.js" 

// let userData = null
// userData = await utils.auth("room");

let enterRoom = false;
let disconnect = true;

let tryEnterRoom = (uuid) => {
    if(uuid){
        if(!enterRoom){
            let timer = setInterval(() => {
                if(disconnect){
                    history.go(0);
                }else{
                    console.log("conn establish");
                    clearInterval(timer);
                }
            }, 5000);
        }else{
            let timer = setInterval(() => {
                if(disconnect){
                    connectPeer();
                }else{
                    console.log("conn establish");
                    clearInterval(timer);
                }
            }, 5000);
        }
    }else{
        console.log("loading error");
    }
}

tryEnterRoom(USER_ID)

// const socket = io({transports: ['websocket'], upgrade: false});
// const socket = io({upgrade: true});
const socket = io({upgrade: true});

const userContainer = document.querySelector(".user-container")


// const myPeer = new Peer()
const myPeer = new Peer(USER_ID)

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
        let remoteUuid = call.peer
        call.on("stream", userVideoStream => {
            if (USER_ID === userVideoStream.id) return
            // console.log("stream", userVideoStream)
            addVideoStream(video, userVideoStream, false, remoteUuid)
        })
    })

    socket.on('user-connected', async uuid => {
        // console.log("User connected: ", uuid);
        console.log(`user ${uuid} enter room ${ROOM_ID}`)
        connectToNewUser(uuid, stream);
        if(USER_ID === uuid){
            insertMongoRoomData(ROOM_ID, uuid, true, true);
            enterRoom = true;
            disconnect = false;
        }
    })
    
    
    socket.on('user-disconnected', uuid => {
        console.log("out meeting: ", uuid);
        if(uuid === USER_ID){
            disconnect = true;
            checkNeedReconnect(ROOM_ID, USER_ID);
        }
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
    if (uuid === USER_ID) return
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


socket.on('close-camera-view', (uuid) => {
    if (uuid === USER_ID) return
    let remoteDiv = document.querySelector(`#user-${uuid} .user-block`);
    // if(remoteDiv && !remoteDiv.classList.contains("show")){
    //     remoteDiv.classList.add("show");
    // }
    if(remoteDiv){
        remoteDiv.classList.add("show");
    }
})


socket.on('open-camera-view', (uuid) => {
    if (uuid === USER_ID) return
    let remoteDiv = document.querySelector(`#user-${uuid} .user-block`);
    // if(remoteDiv && remoteDiv.classList.contains("show")){
    //     remoteDiv.classList.remove("show");
    // }  
    // let remoteDiv = document.querySelector(`#user-${uuid} .user-block`);
    if(remoteDiv){
        remoteDiv.classList.remove("show");
    }
})

// audio
socket.on('show-unvoice-icon', (uuid) => {
    let remoteVoiceIcon = document.querySelector(`#user-${uuid} .micro-status-icon`);
    if(remoteVoiceIcon){
        remoteVoiceIcon.classList.add("show");
    }
})

socket.on('hide-unvoice-icon', (uuid) => {
    let remoteVoiceIcon = document.querySelector(`#user-${uuid} .micro-status-icon`);
    if(remoteVoiceIcon){
        remoteVoiceIcon.classList.remove("show");
    }
})



socket.on('leave-video-remove', (uuid) => {
    let remoteUserWrapper =  document.querySelector(`#wrapper-${uuid}`);
    if(remoteUserWrapper){
        document.querySelector(`#wrapper-${uuid}`).remove();
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
            if(!document.querySelector(".user-block.local").classList.contains("show")){
                cameraBtn.classList.add("disable");
                document.querySelector(".user-block.local").classList.add("show");
                stream.getTracks()[1].enabled = false;
                socket.emit("set-option", ROOM_ID, "video", USER_ID, false);
                setUserStreamStatus(ROOM_ID, USER_ID, "video", false);
            }else{
                cameraBtn.classList.remove("disable");
                document.querySelector(".user-block.local").classList.remove("show");
                stream.getTracks()[1].enabled = true;
                socket.emit("set-option", ROOM_ID, "video", USER_ID, true);
                setUserStreamStatus(ROOM_ID, USER_ID, "video", true)
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
                socket.emit("set-option", ROOM_ID, "audio", USER_ID, false);
                setUserStreamStatus(ROOM_ID, USER_ID, "audio", false);

            }else{
                audioBtn.classList.remove("disable");
                stream.getTracks()[0].enabled = true;
                document.querySelector(".micro-status-icon.local").classList.remove("show");
                socket.emit("set-option", ROOM_ID, "audio", USER_ID, true);
                setUserStreamStatus(ROOM_ID, USER_ID, "audio", true);
            }
        }
        audioBtn.onclick = () => {
            toggleAudio();
        }

        // leave room
        const leaveBtn = document.querySelector("#leave-btn");
        leaveBtn.onclick = async () => {
            // let localPeerId = await getLocalPeerId(localUuid)
            socket.emit("leave-room", ROOM_ID, USER_ID);
            socket.disconnect();
            removeMongoRoomData(ROOM_ID, USER_ID);
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
        if(USER_IMG[0] !== "#"){
            imgSetting = `
            <div class="img-bg" style="
                background-image: url('${USER_IMG}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            "></div>
            `;
        }else{
            imgSetting = `
            <div class="img-bg" style="background-color: ${USER_IMG};">
                <h3>${USER_NAME[0]}</h3>
            </div>
            `;
        }
        let player = `
        <div class="video-container">
            <div class="username-wrapper">
                <span class="user-name">${USER_NAME}</span>
            </div>
            <div class="video-player" id="user-${USER_ID}">
                <div class="micro-status-icon local"></div>
                <div class="user-block local">
                    <div class="auto-img">
                        ${imgSetting}
                    </div>
                </div>
            </div>
        </div>
        `
    
        userContainer.insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${USER_ID}`).append(video);

        // setUserStreamStatus(localUuid, "video", false, true);

    }else{
        if(document.querySelector(`#wrapper-${remoteUuid}`)){
            document.querySelector(`#wrapper-${remoteUuid}`).remove();
        }
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
    
        userContainer.insertAdjacentHTML("afterbegin", player);
        video.addEventListener("loadedmetadata", () => {
            video.play()
        })
        document.querySelector(`#user-${remoteUuid}`).append(video)

        let data = await getRemoteUser(ROOM_ID, remoteUuid);

        let remoteName = data.name;
        let remoteImgUrl = data.imgurl;
        let remoteAudioStatus = data.audioStatus;
        let remoteVideoStatus = data.videoStatus;

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
        if(!remoteAudioStatus){
            document.querySelector(`#wrapper-${remoteUuid} .micro-status-icon`).classList.add("show");
        }
        if(!remoteVideoStatus){
            document.querySelector(`#wrapper-${remoteUuid} .user-block`).classList.add("show");
        }
    }
}

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    let video = document.createElement("video")
    let remoteUuid = call.peer
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream, false, remoteUuid)
    })
    call.on("close", () => {
        video.remove()
    })
    peers[userId] = call;
}


let getRemoteUser = async (roomId, remoteUuid) => {
    let response = await fetch(`/api/getremoteuser`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": remoteUuid
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
    let data = await response.json();
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
    let data = await response.json();
}

let checkNeedReconnect = async (roomId, uuid) => {
    let response = await fetch(`/room/checkneedreconnect`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
        })
    });
    let data = await response.json();
    console.log(data);
    if(data.message == "needReconnect"){
        console.log(`user ${uuid} connection break, try reconnect.`)
        tryEnterRoom(uuid);
    }
}

let setUserStreamStatus = async (roomId, uuid, status, bool) => {
    let response = await fetch(`/room/streamstatus`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "status": status,
            "b": bool,
        })
    });
    let data = await response.json();
}


generateShortLink();


/*
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
    let data = await response.json();
}
*/
