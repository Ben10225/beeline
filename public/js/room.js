import utils from "./utils.js";

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let auth;

let authData = await utils.checkIfAuthAlready(ROOM_ID);
let authExist = authData[0];
let authUuid = authData[1];

if(authExist === "exist"){
    auth = false;
    if(authUuid === USER_ID){
        auth = true;
    }
}else{
    auth = (parseInt(params.auth) === 0);
}

const cameraBtn = document.querySelector("#camera-btn");
const audioBtn = document.querySelector("#audio-btn");
const leaveBtn = document.querySelector("#leave-btn");
const body = document.querySelector("body");
const bg = document.querySelector(".bg");
const wrapper = document.querySelector(".wrapper");

let enterRoom = false;
let disconnect = true;

let tryEnterRoom = (uuid) => {
    if(uuid){
        if(!enterRoom){
            let ct = 0
            let timer = setInterval(() => {
                ct ++;
                if(disconnect){
                    if(ct > 700){
                        history.go(0);
                    }
                }else{
                    console.log("conn establish");
                    document.querySelector("#waiting-block").remove();
                    clearInterval(timer);
                    if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
                        new Audio("/public/audio/enter-room.mp3").play();
                    }
                }
            }, 1);
        }else{
            let timer = setInterval(() => {
                if(disconnect){
                    console.log("try");
                    let socket = io({transports: ['websocket']});
                    socket.emit('join-room', ROOM_ID, USER_ID);
                }else{
                    console.log("conn establish");
                    clearInterval(timer);
                }
            }, 10000);
        }
    }else{
        console.log("loading error");
    }
}

tryEnterRoom(USER_ID);

// const socket = io({transports: ['websocket'], upgrade: false});
// const socket = io({upgrade: true});
const socket = io({transports: ['websocket']});

const userContainer = document.querySelector(".user-container");


// const myPeer = new Peer()
const myPeer = new Peer(USER_ID)

const myVideo = document.createElement("video")
myVideo.muted = true;

let tempMediaStreamId = null;
let tempRemoteMediaStreamId = null;

const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
        body.style.backgroundColor = "#000";
        bg.style.backgroundImage = "url('/public/images/roombg2.svg')";;
        bg.style.opacity = "0.15";
        wrapper.style.justifyContent = "flex-start";

        // 進房時監聽
        addVideoStream(myVideo, stream, true);
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

        // let connectPeer = () => {
        //     myPeer.on('open', async id => {
        //         socket.emit('join-room', ROOM_ID, id);
        //     })
        // }
        // connectPeer();
    }else if(!auth){
        const video = document.createElement("video");
        video.muted = true;
        video.srcObject = stream;
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
        <div class="setup-container">
            <div class="username-wrapper">
                <span class="user-name">${USER_NAME}</span>
            </div>
            <div class="setup-player" id="user-${USER_ID}">
                <div class="micro-status-icon local"></div>
                <div class="user-block local">
                    <div class="auto-img">
                        ${imgSetting}
                    </div>
                </div>
                <div class="icon-wrapper">
                    <div class="control-icon" id="setting-audio-btn"></div>
                    <div class="control-icon" id="setting-camera-btn"></div>
                </div>
            </div>
        </div>
        <div class="setting-options">
            <h2>Grooming yourself</h2>
            <p>If everything is okay...</p>   
            <div class="button-block">
                <button id="enter-request">Let's go</button>
            </div>
        </div>
        `
        document.querySelector("#user-setup").insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play();
        })
        document.querySelector(`#user-${USER_ID}`).append(video);

        audioBtn.remove();
        cameraBtn.remove();
        const btn = document.querySelector("#enter-request");

        btn.onclick = () => {
            socket.emit('send-enter-request', ROOM_ID, USER_ID, USER_NAME, USER_IMG);
            btn.style = `pointer-events: none; opacity: 0.3;`;
            let imgTag = `<div class="request-gif"></div>`;
            document.querySelector(".button-block").insertAdjacentHTML("beforeend", imgTag);
        }

        const settingAudioBtn = document.querySelector("#setting-audio-btn");
        settingAudioBtn.onclick = () => {
            toggleAudio(stream, settingAudioBtn);
        }

        const settingCameraBtn = document.querySelector("#setting-camera-btn");
        settingCameraBtn.onclick = () => {
            toggleCamera(stream, settingCameraBtn);
        }

        leaveBtn.onclick = () => {
            removeMongoRoomData(ROOM_ID, USER_ID, auth);
            window.location = "/";
        }

        window.onunload = () => {
            removeMongoRoomData(ROOM_ID, USER_ID, auth);
        }

        insertMongoRoomData(ROOM_ID, USER_ID, true, true, auth);
    }

    socket.on('user-connected', async uuid => {
        console.log(`user ${uuid} enter room ${ROOM_ID}`);
        connectToNewUser(uuid, stream);

        if(USER_ID === uuid){
            if(auth){
                insertMongoRoomData(ROOM_ID, uuid, true, true, auth);
            }
            if(CLIENT){
                setBackRoomLeaveStatus(ROOM_ID,uuid);
            }
            enterRoom = true;
            disconnect = false;
        }
    })
    
    socket.on('user-disconnected', async uuid => {
        console.log("out meeting: ", uuid);

        if(uuid !== USER_ID){
            setTimeout(async()=>{
                auth = await resetAuthData(ROOM_ID, USER_ID);
            }, 2000)
        }

        if(uuid === USER_ID){
            disconnect = true;
            checkNeedReconnect(ROOM_ID, USER_ID);
        }
        // let outUserDiv = document.querySelector(`#wrapper-${userId}`);
        // if(outUserDiv){
        //     outUserDiv.remove();
        // }
        // if (peers[userId]) peers[userId].close();
    })
})


let connectPeer = () => {
    myPeer.on('open', async id => {
        socket.emit('join-room', ROOM_ID, id);
    })
}

connectPeer();


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

// leave room
socket.on('leave-video-remove', async (uuid) => {
    // if(authParam){
    //     let newAuth = await resetAuthData(ROOM_ID, USER_ID);
    //     console.log(newAuth);
    // }

    let remoteUserWrapper =  document.querySelector(`#wrapper-${uuid}`);
    if(remoteUserWrapper){
        document.querySelector(`#wrapper-${uuid}`).remove();
    }
})

// get enter request
socket.on('sent-to-auth', (clientUuid, clientName, clientImg) => {
    if(auth){
        let imgSetting = "";
        if(clientImg[0] !== "#"){
            imgSetting = `
            <div class="alert-user-img" style="
                background-image: url('${clientImg}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            "></div>
            `;
        }else{
            imgSetting = `
            <div class="alert-user-img" style="background-color: ${clientImg};">
                <h3>${clientName[0]}</h3>
            </div>
            `;
        }
        let html = `
        <div class="alert-block" id="alert-user-${clientUuid}">
            ${imgSetting}
            <h3><span>${clientName}</span>想進入聊天室</h3>
            <h3 class="allow">准許</h3>
            <h3 class="refuse">拒絕</h3>
        </div>
        `;
        document.querySelector(".client-alert").insertAdjacentHTML("beforeend", html);
        new Audio("/public/audio/client-request.mp3").play();

        let clientAllow = document.querySelector(`#alert-user-${clientUuid} .allow`);
        clientAllow.onclick = () => {
            document.querySelector(`#alert-user-${clientUuid}`).remove();
            socket.emit("allow-refuse-room", ROOM_ID, clientName, true);
        }

        let clientRefuse = document.querySelector(`#alert-user-${clientUuid} .refuse`);
        clientRefuse.onclick = () => {
            document.querySelector(`#alert-user-${clientUuid}`).remove();
            socket.emit("allow-refuse-room", ROOM_ID, clientName, false);

            // 需要改成 delete 不只設 leave
            removeMongoRoomData(ROOM_ID, clientUuid, false);
        }

        clientAllow.onmouseover = () => {
            clientAllow.classList.add("hover");
        }
        clientAllow.onmouseout = () => {
            clientAllow.classList.remove("hover");
        }
        clientRefuse.onmouseover = () => {
            clientRefuse.classList.add("hover");
        }
        clientRefuse.onmouseout = () => {
            clientRefuse.classList.remove("hover");
        }
    }
})


socket.on('client-action', async (roomId, clientName, b) => {
    if(clientName === USER_NAME && b){
        await SetRoomEnterToken(roomId);
        history.go(0);
    }else if(clientName === USER_NAME && !b){
        window.location = "/";
    }
})


let addVideoStream = async (video, stream, islocal, remoteUuid) => {
    video.srcObject = stream
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return

    if(islocal){
        tempMediaStreamId = stream.id;

        audioBtn.onclick = () => {
            toggleAudio(stream, audioBtn);
        }

        cameraBtn.onclick = () => {
            toggleCamera(stream, cameraBtn);
        }

        // leave room
        leaveBtn.onclick = async () => {
            // socket.disconnect();
            await removeMongoRoomData(ROOM_ID, USER_ID, auth);
            await SetRoomEnterToken(ROOM_ID);
            socket.emit("leave-room", ROOM_ID, USER_ID);
            window.location = "/";
        }

        // close broswer
        window.onunload = async () => {
            // broswer 關閉不要 await 反而會壞掉
            removeMongoRoomData(ROOM_ID, USER_ID, auth);
            SetRoomEnterToken(ROOM_ID);
            socket.emit("leave-room", ROOM_ID, USER_ID);
        }

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

        if(!auth){
            let data = await getRemoteUser(ROOM_ID, USER_ID);

            let localAudioStatus = data.audioStatus;
            let localVideoStatus = data.videoStatus;
            if(!localAudioStatus){
                stream.getTracks()[0].enabled = false;
                document.querySelector(`#user-${USER_ID} .micro-status-icon`).classList.add("show");
                audioBtn.classList.add("disable");
            }
            if(!localVideoStatus){
                stream.getTracks()[1].enabled = false;
                document.querySelector(`#user-${USER_ID} .user-block`).classList.add("show");
                cameraBtn.classList.add("disable");
            }
        }

    }else{
        // create remote container
        if(document.querySelector(`#wrapper-${remoteUuid}`)){
            document.querySelector(`#wrapper-${remoteUuid}`).remove();
        }
        tempRemoteMediaStreamId = stream.id

        // let remoteVideoStatus = stream.getTracks()[1].enabled;
        // let remoteAudioStatus = stream.getTracks()[0].enabled;

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

// camera button
let toggleCamera = async (stream, dom) => {
    // let isOpen = stream.getTracks()[1].enabled;
    if(!document.querySelector(".user-block.local").classList.contains("show")){
        dom.classList.add("disable");
        document.querySelector(".user-block.local").classList.add("show");
        stream.getTracks()[1].enabled = false;
        socket.emit("set-option", ROOM_ID, "video", USER_ID, false);
        setUserStreamStatus(ROOM_ID, USER_ID, "video", false);
    }else{
        dom.classList.remove("disable");
        document.querySelector(".user-block.local").classList.remove("show");
        stream.getTracks()[1].enabled = true;
        socket.emit("set-option", ROOM_ID, "video", USER_ID, true);
        setUserStreamStatus(ROOM_ID, USER_ID, "video", true)
    }
}

// audio button
let toggleAudio = async (stream, dom) => {
    let isVolumn = stream.getTracks()[0].enabled;
    if(isVolumn){
        dom.classList.add("disable");
        stream.getTracks()[0].enabled = false;
        document.querySelector(".micro-status-icon.local").classList.add("show");
        socket.emit("set-option", ROOM_ID, "audio", USER_ID, false);
        setUserStreamStatus(ROOM_ID, USER_ID, "audio", false);

    }else{
        dom.classList.remove("disable");
        stream.getTracks()[0].enabled = true;
        document.querySelector(".micro-status-icon.local").classList.remove("show");
        socket.emit("set-option", ROOM_ID, "audio", USER_ID, true);
        setUserStreamStatus(ROOM_ID, USER_ID, "audio", true);
    }
}

let connectToNewUser = (userId, stream) => {
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

let insertMongoRoomData = async (roomId, uuid, audioStatus, videoStatus, auth) => {
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
            "auth": auth,
        })
    });
    let data = await response.json();
}

let removeMongoRoomData = async (roomId, uuid, auth) => {
    let response = await fetch(`/room/deleteuserfromroom`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "auth": auth,
        })
    });
    let data = await response.json();
    return data.ok;
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

let SetRoomEnterToken = async (roomId) => {
    let response = await fetch(`/room/entertoken`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
        })
    });
    let data = await response.json();
}

let setBackRoomLeaveStatus = async (roomId, uuid) => {
    let response = await fetch(`/room/setLeaveFalse`, {
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

let resetAuthData = async (roomId, uuid) => {
    let response = await fetch(`/room/checkAuthChange`, {
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
    if(data){
        return data.auth;
    }
}

// generateShortLink();


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
