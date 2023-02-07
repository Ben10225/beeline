import utils from "./utils.js";
// import extension from "./extension.js";

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
const msgSubmit = document.querySelector("#form-message-submit");
const messageWrapper = document.querySelector(".message-wrapper");
const sendWrapper = document.querySelector(".send-wrapper");
const sendMessageInput = document.querySelector("#send-message");
const sendImg =  document.querySelector(".send-img");
const infoIcon =  document.querySelector(".fa-circle-info");
const messageIcon =  document.querySelector(".fa-message");
const extensionBox = document.querySelector(".extension-box");
const chat = document.querySelector(".chat");
const info = document.querySelector(".info");


let enterRoom = false;
let disconnect = true;

let tmpMessageClock = null;
let tmpMessageTime = null;
let tmpMessageName = null;

let userInRoom = {};

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

        utils.generateShortLink();
        // 進房時監聽
        addVideoStream(myVideo, stream, true, USER_ID);
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

    }else if(!auth){
        document.querySelector("#video-streams").remove();

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

        if (userInRoom[uuid]) delete userInRoom[uuid];

        if(userInRoom[USER_ID] && uuid !== USER_ID){
            if (document.querySelector(".allow-click")) return
            setTimeout(async()=>{
                let data = await resetAuthData(ROOM_ID, USER_ID);
                let auth = data[0];
                let chatOpen = data[1];
                console.log("chatOpen: ", chatOpen);
                if(auth){
                    addAllowClick();
                    document.querySelector(".message-wrapper").style.height = "calc(100vh - 353px)";
                }
                if(!chatOpen){
                    messageWrapper.classList.add("add-disabled");
                    sendWrapper.classList.add("add-disabled");
                    sendMessageInput.disabled = true;

                    let switchInput = document.querySelector("#switch");
                    switchInput.checked = false;
                }else{
                    messageWrapper.classList.remove("add-disabled");
                    sendWrapper.classList.remove("add-disabled");
                    sendMessageInput.disabled = false;
                }
            }, 1000)
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
        let remoteNameBg = document.querySelector(`#wrapper-${uuid} .username-wrapper-room`);
        if(remoteDiv && b){
            remoteDiv.classList.remove("show");
            remoteNameBg.classList.remove("bg-none");
        }else if(remoteDiv && !b){
            remoteDiv.classList.add("show");
            remoteNameBg.classList.add("bg-none");
        }
    }else if(options === "audio"){
        let remoteDiv = document.querySelector(`#wrapper-${uuid} .micro-status-icon`)
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
    settingVideoSize();
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
            refuseUserInRoom(ROOM_ID, clientUuid);
            // removeMongoRoomData(ROOM_ID, clientUuid, false);
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

// chat room
socket.on('chat-room', async (roomId, clientName, timeSlice, message) => {
    if(ROOM_ID === roomId){
        if(tmpMessageName === clientName 
          && tmpMessageClock === timeSlice[0]
          && tmpMessageTime === timeSlice[1]){
            let tag = `<div class="message-content">${message}</div>`
            let messageBlockS = document.querySelectorAll(".message-block");
            messageBlockS.forEach((block, i) => {
                if(i === messageBlockS.length-1){
                    block.insertAdjacentHTML("beforeend", tag);
                }
            })
        }else{
            let html = `
            <div class="message-block">
                <div class="message-title">
                    <span class="message-name">${clientName}</span>
                    <span class="message-clock">${timeSlice[0]}</span>
                    <span class="message-time">${timeSlice[1]}</span>
                </div>
                <div class="message-content">${message}</div>
            </div> 
            `;
            messageWrapper.insertAdjacentHTML("beforeend", html);
        }
        tmpMessageName = clientName;
        tmpMessageClock = timeSlice[0];
        tmpMessageTime = timeSlice[1];

        messageWrapper.scrollTo(0, messageWrapper.scrollHeight);
    }
})

// close open chat wrapper
socket.on('close-open-chat', async (roomId, close) => {
    if(ROOM_ID === roomId){
        if(close){
            messageWrapper.classList.add("add-disabled");
            sendWrapper.classList.add("add-disabled");
            sendMessageInput.disabled = true;
        }else{
            messageWrapper.classList.remove("add-disabled");
            sendWrapper.classList.remove("add-disabled");
            sendMessageInput.disabled = false;
        }
    }
})


let addVideoStream = async (video, stream, islocal, remoteUuid) => {
    video.srcObject = stream
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return

    userInRoom[remoteUuid] = true;

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
            <div class="username-wrapper-room local">
                <span class="user-name">你</span>
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
        // const videoContainer = document.querySelector(".video-container");
        // videoContainer.style.height = `calc(${videoContainer.offsetWidth}px * 3 / 4);`;

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
                document.querySelector(`.username-wrapper-room.local`).classList.add("bg-none");
                cameraBtn.classList.add("disable");
            }
            
            let chatOpen = await getRoomChatStatus(ROOM_ID);
            if(!chatOpen){
                messageWrapper.classList.add("add-disabled");
                sendWrapper.classList.add("add-disabled");
                sendMessageInput.disabled = true;
            }

            document.querySelector(".allow-click").remove();
            document.querySelector(".message-wrapper").style.height = "calc(100vh - 303px)";

        }else{
            switchInputInit();
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
            <div class="username-wrapper-room">
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
        document.querySelector(`#user-${remoteUuid}`).append(video);
        // const videoContainer = document.querySelector(".video-container");
        // videoContainer.style.height = `calc(${videoContainer.offsetWidth}px * 3 / 4);`;

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
            document.querySelector(`#wrapper-${remoteUuid} .username-wrapper-room`).classList.add("bg-none");
        }
    }
    
    settingVideoSize();
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

        if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
            document.querySelector(".username-wrapper-room.local").classList.add("bg-none");
        }

    }else{
        dom.classList.remove("disable");
        document.querySelector(".user-block.local").classList.remove("show");
        stream.getTracks()[1].enabled = true;
        socket.emit("set-option", ROOM_ID, "video", USER_ID, true);
        setUserStreamStatus(ROOM_ID, USER_ID, "video", true)

        if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
            document.querySelector(".username-wrapper-room.local").classList.remove("bg-none");            
        }
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

let refuseUserInRoom = async (roomId, uuid) => {
    let response = await fetch(`/room/deleteUserArray`, {
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
        return [data.auth, data.chatOpen];
    }
}

let settingVideoSize = () => {
    let videoContainerS = document.querySelectorAll(".video-container");

    if(videoContainerS.length == 1){
        document.querySelector(".user-container").style.flexWrap = "nowrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 80%;
                height: 600px;
            `;
        })
    }else if(videoContainerS.length == 2){
        document.querySelector(".user-container").style.flexWrap = "nowrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 50%;
                height: 440px;
            `;
        })
    }else if(videoContainerS.length == 3 || videoContainerS.length == 4){
        document.querySelector(".user-container").style.flexWrap = "wrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 35%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 300px;
            `;
        })
        let imgBgS = document.querySelectorAll(".img-bg");
        imgBgS.forEach(img => {
            img.classList.remove("smaller");
        })
    }
    else if(videoContainerS.length >= 5 || videoContainerS.length <= 6){
        document.querySelector(".user-container").style.flexWrap = "wrap";
        videoContainerS.forEach(container => {
            container.style = `
            width: 30%;
            max-height: 270px;
            `;
        })
        let imgBgS = document.querySelectorAll(".img-bg");
        imgBgS.forEach(img => {
            img.classList.add("smaller");
        })
    }
}

let messageSubmit = async (e) => {
    e.preventDefault();
    let message = sendMessageInput.value;
    if (!message) return
    sendMessageInput.value = "";
    socket.emit('chat', ROOM_ID, USER_NAME, message);
    sendImg.classList.remove("entering");

    // let currentdate = new Date().toLocaleTimeString();
    // let time = currentdate.slice(0,2);
    // let clock = currentdate.slice(2,-3)
    // if (time === "下午") time = "晚上"
}

msgSubmit.addEventListener("submit", messageSubmit);

sendMessageInput.addEventListener("input", ()=>{
    sendImg.classList.add("entering");
    if(!sendMessageInput.value){
        sendImg.classList.remove("entering");
    }
})

infoIcon.onclick = () => {
    if(!infoIcon.classList.contains("clicked")){
        infoIcon.classList.add("clicked");
        messageIcon.classList.remove("clicked");
        info.classList.add("info-show");
        chat.classList.remove("chat-show");
        if(!extensionBox.classList.contains("show")){
            extensionBox.classList.add("show");
            setTimeout(() => {
                userContainer.classList.add("go-left");
            }, 100);
        }
    }else{
        infoIcon.classList.remove("clicked");
        setTimeout(() => {
            info.classList.remove("info-show");
        }, 300)
        if(extensionBox.classList.contains("show")){
            extensionBox.classList.remove("show");
            setTimeout(() => {
                userContainer.classList.remove("go-left");
            }, 100);
        }
    }
}

messageIcon.onclick = () => {
    if(!messageIcon.classList.contains("clicked")){
        messageIcon.classList.add("clicked");
        infoIcon.classList.remove("clicked");
        chat.classList.add("chat-show");
        info.classList.remove("info-show");
        if(!extensionBox.classList.contains("show")){
            extensionBox.classList.toggle("show");
            setTimeout(() => {
                userContainer.classList.toggle("go-left");
            }, 100);
        }
    }else{
        messageIcon.classList.remove("clicked");
        setTimeout(() => {
            chat.classList.remove("chat-show");
        }, 300)
        if(extensionBox.classList.contains("show")){
            extensionBox.classList.remove("show");
            setTimeout(() => {
                userContainer.classList.remove("go-left");
            }, 100);
        }
    }
}


let switchInputInit = () => {
    const switchInput = document.querySelector("#switch");
    switchInput.onclick = async () => {
        if(!switchInput.checked){
            socket.emit('close-chat', ROOM_ID, true);
            await setRoomChatStatus(ROOM_ID, false);
        }else{
            socket.emit('close-chat', ROOM_ID, false);
            await setRoomChatStatus(ROOM_ID, true);
        }
    }
}


let setRoomChatStatus = async (roomId, b) => {
    let response = await fetch(`/room/roomChatStatus`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "chatOpen": b,
        })
    });
    let data = await response.json();
}

let getRoomChatStatus = async (roomId) => {
    let response = await fetch(`/room/getRoomChatStatus`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
        })
    });
    let data = await response.json();
    if(data){
        return data.chatOpen;
    }
}

let addAllowClick = () => {
    let html = `
    <div class="allow-click">
        <p>Let everyone send messages</p>
        <div class="switch-button">
            <input type="checkbox" id="switch" checked>
            <label for="switch">
                <span class="switch-txt" turnOn="On" turnOff="Off"></span>
            </label>
        </div>
    </div>
    `;
    document.querySelector(".chat h2").insertAdjacentHTML("afterend", html);
    switchInputInit();
} 