import utils from "./utils.js";
import extension from "./extension.js";

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
const groupNumber = document.querySelector(".group-number");


let enterRoom = false;
let disconnect = true;

let tmpMessageClock = null;
let tmpMessageTime = null;
let tmpMessageName = null;
let clientFirstLoad = true;
let host = "";
let groupLst = [];
let userInRoomObj = {};

let socket;

let tryEnterRoom = (uuid) => {
    if(uuid){
        if(!enterRoom){
            let ct = 0
            let timer = setInterval(() => {
                ct ++;
                if(disconnect){
                    if(ct > 700){
                        // window.location.reload();
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
                    socket = io({transports: ['websocket']});
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

// const socket = io({transports: ['websocket'], upgrade: false});
// const socket = io({upgrade: true});

// const socket = io({transports: ['websocket']});

const userContainer = document.querySelector(".user-container");


// const myPeer = new Peer()
const myPeer = new Peer(USER_ID)

const myVideo = document.createElement("video")
myVideo.muted = true;

let tempMediaStreamId = null;
let tempRemoteMediaStreamId = null;

const peers = {}

let connectPeer = () => {
    myPeer.on('open', async id => {
        socket.emit('join-room', ROOM_ID, id);
    })
}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){

        socket = io({transports: ['websocket']});
        InRoomSocketInit();
        tryEnterRoom(USER_ID);
        
        connectPeer();

        body.style.backgroundColor = "#000";
        bg.style.backgroundImage = "url('/public/images/roombg2.svg')";;
        bg.style.opacity = "0.15";
        wrapper.style.justifyContent = "flex-start";
        document.querySelector("#user-setup").remove();

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

        socket = io({transports: ['websocket']});
        WaitingSocketInit();
        tryEnterRoom(USER_ID);

        connectPeer();

        document.querySelector("#video-streams").remove();
        document.querySelector("#controls-wrapper").remove();
        document.querySelector(".extension-wrapper").remove();

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
        <div class="waiting-exit"></div>
        <div class="setup-container">
            <div class="setup-player" id="user-${USER_ID}">
                <div class="micro-status-icon local"></div>
                <div class="user-block local">
                    <div class="auto-img">
                        ${imgSetting}
                    </div>
                </div>
                <div class="icon-wrapper">
                    <div class="setup-control-icon" id="setting-audio-btn"></div>
                    <div class="setup-control-icon" id="setting-camera-btn"></div>
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


        document.querySelector(".waiting-exit").onclick = () => {
            // removeMongoRoomData(ROOM_ID, USER_ID, auth);
            refuseUserInRoom(ROOM_ID, USER_ID);
            window.location = "/";
        }

        window.onunload = () => {
            // 這邊不要用 onunload 不然頁面轉跳 資料庫就直接拿掉了
            // refuseUserInRoom(ROOM_ID, USER_ID);
        }

        insertMongoRoomData(ROOM_ID, USER_ID, true, true, auth);
    }

    socket.on('user-connected', async uuid => {
        console.log(`user ${uuid} enter room ${ROOM_ID}`);
        connectToNewUser(uuid, stream);

        if(USER_ID === uuid){
            if(auth){
                await insertMongoRoomData(ROOM_ID, uuid, true, true, auth);

                let groupData = await extension.getGroupInfo(ROOM_ID);
                groupLst = groupData[0];
                host = groupData[1];
                if (Object.keys(userInRoomObj).length >= groupLst.length){
                    // console.log("aa")
                    createGroupDom(groupLst, host, USER_ID);
                }


            }else if(CLIENT){
                await setBackRoomLeaveStatus(ROOM_ID, uuid);

                let groupData = await extension.getGroupInfo(ROOM_ID);
                groupLst = groupData[0];
                host = groupData[1];

                console.log(groupLst)

                if (Object.keys(userInRoomObj).length >= groupLst.length 
                    && userInRoomObj[USER_ID]){
                    // console.log("bb")
                    createGroupDom(groupLst, host, USER_ID);
                }

            }
            enterRoom = true;
            disconnect = false;
        }
    })
    
    socket.on('user-disconnected', async uuid => {
        console.log("out meeting: ", uuid);

        if (userInRoomObj[uuid]) delete userInRoomObj[uuid];

        if(userInRoomObj[USER_ID] && uuid !== USER_ID){
            if (document.querySelector(".allow-click")) return
            setTimeout(async()=>{
                let data = await resetAuthData(ROOM_ID, USER_ID);
                let newHostUuid = data[0];
                let chatOpen = data[1];
                // console.log("chatOpen: ", chatOpen);
                if(USER_ID === newHostUuid){
                    auth = true;
                    addAllowClick();
                    document.querySelector(".message-wrapper").style.height = "calc(100vh - 353px)";
                    if(!chatOpen){
                        // messageWrapper.classList.add("add-disabled");
                        // sendWrapper.classList.add("add-disabled");
                        // sendMessageInput.disabled = true;
    
                        let switchInput = document.querySelector("#switch");
                        switchInput.checked = false;
                    }else{
                        // messageWrapper.classList.remove("add-disabled");
                        // sendWrapper.classList.remove("add-disabled");
                        // sendMessageInput.disabled = false;
                    }
                }else{
                    auth = false;
                }

                let hostTag = `<div class="user-host"></div>`;
                document.querySelector(`#group-${newHostUuid} .user-micro`).insertAdjacentHTML("beforebegin", hostTag);

                alertNewAuth(newHostUuid);

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


let WaitingSocketInit = async () => {
    socket.on('client-action', async (roomId, clientName, b) => {
        if(clientName === USER_NAME && b){
            await SetRoomEnterToken(roomId);
            window.location.reload();
            // history.go(0);
        }else if(clientName === USER_NAME && !b){
            window.location = "/";
        }
    })
}


let InRoomSocketInit = async () => {
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
            let remoteGroupMicro = document.querySelector(`#group-${uuid} .user-micro`);
            if(remoteGroupMicro && b){
                remoteGroupMicro.classList.remove("micro-off");
            }else if(remoteGroupMicro && !b){
                remoteGroupMicro.classList.add("micro-off");
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
            remoteUserWrapper.remove();
        }
        let groupUserWrapper = document.querySelector(`#group-${uuid}`);
        if(groupUserWrapper){
            groupUserWrapper.remove();
        }
        utils.settingVideoSize();
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
                <h3><span>${clientName}</span>wants to join this room.</h3>
                <h3 class="allow">Allow</h3>
                <h3 class="refuse">Deny</h3>
            </div>
            `;
            document.querySelector(".client-alert").insertAdjacentHTML("beforeend", html);
            new Audio("/public/audio/client-request.mp3").play();

            let alert = document.querySelector(`#alert-user-${clientUuid}`);
            let clientAllow = document.querySelector(`#alert-user-${clientUuid} .allow`);
            clientAllow.onclick = () => {
                alert.classList.add("alert-click");
                setTimeout(() => {
                    alert.remove();
                } ,500)
                socket.emit("allow-refuse-room", ROOM_ID, clientName, true);
            }

            let clientRefuse = document.querySelector(`#alert-user-${clientUuid} .refuse`);
            clientRefuse.onclick = () => {
                alert.classList.add("alert-click");
                setTimeout(() => {
                    alert.remove();
                } ,500)
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

    // auth change
    socket.on('auth-change-set', async (roomId, oldUuid, newUuid) => {
        if(ROOM_ID === roomId){
            if(USER_ID === newUuid){
                auth = true;
            }else{
                auth = false;
            }

            let hostTag = `<div class="user-host"></div>`;
            document.querySelector(`#group-${oldUuid} .user-host`).remove();
            document.querySelector(`#group-${newUuid} .user-micro`).insertAdjacentHTML("beforebegin", hostTag);

            if(USER_ID === oldUuid){
                let blocks = document.querySelectorAll(`.auth-check-block`);
                blocks.forEach(block => {
                    block.remove();
                })
                let nameBtns = document.querySelectorAll(`.user-name`);
                nameBtns.forEach(name => {
                    name.classList.remove("can-auth");
                })

                // chat room
                document.querySelector(".allow-click").remove();
                document.querySelector(".message-wrapper").style.height = "calc(100vh - 303px)";
            }
            if(USER_ID === newUuid){
                // group
                let uuidDoms = document.querySelectorAll(".user-one");
                let uuids = []
                uuidDoms.forEach(dom => {
                    let uuid = dom.id.split("-")[1];
                    uuids.push(uuid);
                })

                let nameBtns = document.querySelectorAll(`.group .user-name`);
                nameBtns.forEach((name, index)=> {
                    if (index === 0 ) return
                    name.classList.add("can-auth");
                    let html = `
                    <div class="auth-check-block">
                        <p>Assign <span>${name.textContent}</span> to be the host ?</p>
                        <p class="auth-allow">Yes</p>
                    </div>
                    `;
                    name.insertAdjacentHTML("afterend", html);
                    NameBtnInit(uuids[index]);
                })

                // chat room
                let data = await resetAuthData(ROOM_ID, USER_ID);
                let chatOpen = data[1];

                addAllowClick();
                document.querySelector(".message-wrapper").style.height = "calc(100vh - 353px)";

                if(!chatOpen){
                    let switchInput = document.querySelector("#switch");
                    switchInput.checked = false;
                }

                // alert
                alertNewAuth(newUuid);
            }
        }
    })
}


let addVideoStream = async (video, stream, islocal, remoteUuid) => {
    video.srcObject = stream
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return

    if(islocal){

        userInRoomObj[remoteUuid] = [USER_NAME, USER_IMG];

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
                <span class="user-name">You</span>
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

        userInRoomObj[remoteUuid] = [remoteName, remoteImgUrl];

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

        if(clientFirstLoad && !auth){
            let groupData = await extension.getGroupInfo(ROOM_ID);
            groupLst = groupData[0];
            host = groupData[1];
            if (Object.keys(userInRoomObj).length >= groupLst.length){
                // console.log("cc")
                createGroupDom(groupLst, host, USER_ID);
            }
        }else{
            let needAdd = true;
            groupLst.forEach(data => {
                if(data.uuid === remoteUuid){
                    needAdd = false
                }
            })
            if(needAdd){
                groupLst.push({"uuid": remoteUuid, "audioStatus": remoteAudioStatus});
            }
            if (Object.keys(userInRoomObj).length >= groupLst.length){
                // console.log("dd")
                createGroupDom(groupLst, host, USER_ID);
            }
        }

        clientFirstLoad = false;
    }
    
    utils.settingVideoSize();
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
        if(auth || CLIENT){
            document.querySelector(`#group-${USER_ID} .user-micro`).classList.add("micro-off");
        }
        socket.emit("set-option", ROOM_ID, "audio", USER_ID, false);
        setUserStreamStatus(ROOM_ID, USER_ID, "audio", false);

    }else{
        dom.classList.remove("disable");
        stream.getTracks()[0].enabled = true;
        document.querySelector(".micro-status-icon.local").classList.remove("show");
        if(auth || CLIENT){
            document.querySelector(`#group-${USER_ID} .user-micro`).classList.remove("micro-off");
        }
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
        return [data.newHost, data.chatOpen];
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

extension.rightIconsInit();

msgSubmit.addEventListener("submit", messageSubmit);

sendMessageInput.addEventListener("input", ()=>{
    sendImg.classList.add("entering");
    if(!sendMessageInput.value){
        sendImg.classList.remove("entering");
    }
})


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

let createGroupDom = async (gLst, host, localUuid) => {
    let firstLine = "";
    let otherLine = "";
    let html = "";
    let existUser = document.querySelectorAll(".user-one");
    let existLst = [];
    existUser.forEach(dom => {
        let existId = dom.id.split("-")[1];
        existLst.push(existId);
    })

    gLst.forEach(user => {
        if (existLst.includes(user.uuid)) return; // forEach 的 return 相當於使用 continue
        let txt = groupHtml(user, host, localUuid);

        if(user.uuid === localUuid){
            firstLine = txt;
        }else{
            otherLine += txt;
        }
    })
    html = firstLine + otherLine;

    document.querySelector(".user-wrapper").insertAdjacentHTML("beforeend", html);

    if(auth){
        gLst.forEach(user => {
            if (user.uuid === localUuid) return
            NameBtnInit(user.uuid)
            document.querySelector(`#group-${user.uuid} .user-name`).classList.add("can-auth");
        })
    }
    groupLst = [];
    groupNumber.textContent = Object.keys(userInRoomObj).length;
}

let NameBtnInit = (uuid) => {
    let extensionBox = document.querySelector(".extension-box");
    let nameBtn = document.querySelector(`#group-${uuid} .user-name`);
    let block = document.querySelector(`#group-${uuid} .auth-check-block`);
    let yesBtn = document.querySelector(`#group-${uuid} .auth-allow`);

    nameBtn.addEventListener("click",() => {
        block.classList.add("show");
        let ct = 0
        extensionBox.addEventListener("click", function blockShow(e){
            ct ++;
            if (!block.contains(e.target) 
                && !nameBtn.contains(e.target) 
                && ct > 1) {
                block.classList.remove("show");
                this.removeEventListener("click", blockShow);
            }else if(yesBtn.contains(e.target)){
                this.removeEventListener("click", blockShow);
            }
        })
    })
    yesBtn.onclick = async () => {
        // console.log(ROOM_ID, USER_ID, uuid);
        await extension.assignNewAuth(ROOM_ID, USER_ID, uuid);
        socket.emit("auth-change", ROOM_ID, USER_ID, uuid);
        auth = false;
        block.classList.remove("show");
    }
}


let groupHtml = (user, host, localUuid) => {
    let hostTag = "";
    let audioTag = "";
    let nameTag = "";
    if(user.uuid === host){
        hostTag = `<div class="user-host"></div>`;
    }
    if(user.uuid === localUuid || !auth){
        if(user.uuid === localUuid){
            nameTag = `<div class="user-name">${userInRoomObj[user.uuid][0]} (you)</div>`;
        }else{
            nameTag = `<div class="user-name">${userInRoomObj[user.uuid][0]}</div>`;
        }
    }else{
        nameTag = `
        <div class="user-name">${userInRoomObj[user.uuid][0]}</div>
        <div class="auth-check-block">
            <p>Assign <span>${userInRoomObj[user.uuid][0]}</span> to be the host ?</p>
            <p class="auth-allow">Yes</p>
        </div>
        `
    }
    if(!user.audioStatus){
        audioTag = "micro-off"
    }
    let imgSetting = "";
    if(userInRoomObj[user.uuid][1][0] !== "#"){
        imgSetting = `
        <div class="user-img" style="
            background-image: url('${userInRoomObj[user.uuid][1]}');
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
        "></div>
        `;
    }else{
        imgSetting = `
        <div class="user-img" style="background-color: ${userInRoomObj[user.uuid][1]};">
            <h3>${userInRoomObj[user.uuid][0][0]}</h3>
        </div>
        `;
    }
    let txt = `
    <div class="user-one" id="group-${user.uuid}">
        ${imgSetting}
        ${nameTag}
        ${hostTag}
        <div class="user-micro ${audioTag}">
            <i class="fa-solid fa-microphone-slash"></i>
            <i class="fa-solid fa-microphone"></i>
        </div>
    </div>
    `;
    return txt;
}

let alertNewAuth = (uuid) => {
    let html = `
    <div class="alert-block" id="auth-alert-${uuid}">
        <h3 class="change-auth-h3">You are assigned to be the host !</h3>
    </div>
    `;
    document.querySelector(".client-alert").insertAdjacentHTML("beforeend", html);
    new Audio("/public/audio/client-request.mp3").play();

    let alert = document.querySelector(`#auth-alert-${uuid}`);
    setTimeout(() => {
        alert.classList.add("alert-click");
    }, 3000)
    setTimeout(() => {
        alert.remove();
    }, 3500)
}

