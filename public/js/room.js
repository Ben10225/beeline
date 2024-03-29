import utils from "./utils.js";
import extension from "./extension.js";
import board from "./board.js"
import modal from "./modal.js"

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let auth;

auth = (parseInt(params.auth) === 0);
if(auth){
    let authData = await modal.checkIfAuthAlready(ROOM_ID);
    let authExist = authData[0];
    let authUuid = authData[1];

    if(authExist === "exist"){
        auth = false;
    }
    if(authUuid === USER_ID){
        auth = true;
    }
}

const userContainer = document.querySelector(".user-container");
const cameraBtn = document.querySelector("#camera-btn");
const audioBtn = document.querySelector("#audio-btn");
const leaveBtn = document.querySelector("#leave-btn");
const screenShareBtn = document.querySelector("#screen-share-btn");
const body = document.querySelector("body");
const bg = document.querySelector(".bg");
const wrapper = document.querySelector(".wrapper");
const msgSubmit = document.querySelector("#form-message-submit");
const messageWrapper = document.querySelector(".message-wrapper");
const sendWrapper = document.querySelector(".send-wrapper");
const sendMessageInput = document.querySelector("#send-message");
const sendImg =  document.querySelector(".send-img");
const groupNumber = document.querySelector(".group-number");
const searchBar = document.querySelector("#search");

const gameBlock = document.querySelector("#game-block");

let tmpMessageClock = null;
let tmpMessageTime = null;
let tmpMessageName = null;
let clickLeaveBtnToLeave = false;
let host = "";
let groupLst = [];
let userInRoomObj = {};

let tmpScreenShareStreamId = null;
let currentPeer = {};

let gameLeft = 0;
let gameTop = 0;
let gameDelay = 0;
let userSec = 5;
let showRecord = false;

let socket;
let socketWait;
let socketDraw;
let drawOpen = false;
let firstSocketWait = true;

if(auth){
    socket = io({transports: ['websocket']});
    socketWait = io("/enter", {transports: ['websocket']});
    socketDraw = io("/draw", {transports: ['websocket']});
    firstSocketWait = false;
}else if(CLIENT){
    socket = io({transports: ['websocket']});
    socketDraw = io("/draw", {transports: ['websocket']});

}else{
    socketWait = io("/enter", {transports: ['websocket']});
    firstSocketWait = false;
}

const myPeer = new Peer(USER_ID);
let nPeer = new Peer();

const myVideo = document.createElement("video");
myVideo.muted = true;

let tempMediaStreamId = null;
let tempRemoteMediaStreamId = null;

const peers = {};

let eyeGameInit = () => {
    document.querySelector("#eye-game").onclick = async () => {
        socket.emit("start-game", ROOM_ID);
        modal.resetAllUserGameClickFalse(ROOM_ID);
    }
}

let whiteBoardInit = async () => {
    document.querySelector("#white-board").onclick =  () => {
        document.querySelector("#white-board-block").classList.add("show");
        if(!drawOpen){
            socketDraw.emit('join-room', ROOM_ID, USER_ID);
        }
        drawOpen = true;
    }
}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {

    if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
        inRoomSocketInit();

        body.style.backgroundColor = "#000";
        bg.style.backgroundImage = "url('/public/images/roombg2.svg')";;
        bg.style.opacity = "0.15";
        wrapper.style.justifyContent = "flex-start";
        document.querySelector("#user-setup").remove();

        whiteBoardInit();
        screenShareBtnInit();
        utils.generateShortLink();
        utils.createCopyBlock();
        utils.setRoomId();
        board.boardInit(socketDraw); 
        extension.emojiBtnInit(socket);
        extension.rightIconsInit();

        msgSubmit.addEventListener("submit", messageSubmit);
        searchBar.addEventListener("input", extension.searchUser); 

        // 進房時監聽
        addVideoStream(myVideo, stream, true, USER_ID);
        myPeer.on('call', function(call){
            call.answer(stream)
            const video = document.createElement("video");
            let remoteUuid = call.peer;
            call.on("stream", userVideoStream => {
                currentPeer[remoteUuid] = call.peerConnection;

                if (USER_ID === userVideoStream.id) return;
                addVideoStream(video, userVideoStream, false, remoteUuid);
            })
        })

        socketConn(socket, stream);
        socket.emit('join-room', ROOM_ID, USER_ID);

        if(auth){
            socketWaitInRoomAuthInit();
            socketWait.emit('join-room', ROOM_ID, USER_ID);
        }

    }else{
        waitingSocketInit();

        document.querySelector("#video-streams").remove();
        document.querySelector("#controls-wrapper").remove();
        document.querySelector(".extension-wrapper").remove();
        document.querySelector(".message-show-wrapper").remove();

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
            <h2>請確認你的狀態</h2>
            <p>如果一切準備就緒...</p>   
            <div class="button-block">
                <button id="enter-request">申請加入會議</button>
            </div>
        </div>
        `
        document.querySelector("#user-setup").insertAdjacentHTML("beforeend", player);
        video.addEventListener("loadedmetadata", () => {
            video.play();
        })
        document.querySelector(`#user-${USER_ID}`).append(video);
        modal.insertMongoRoomData(ROOM_ID, USER_ID, true, true, auth, USER_NAME, USER_IMG);

        const btn = document.querySelector("#enter-request");
        btn.onclick = async () => {
            let audioStatus = !settingAudioBtn.classList.contains("disable");
            let videoStatus = !settingCameraBtn.classList.contains("disable");
            settingAudioBtn.classList.add("stop-click");
            settingCameraBtn.classList.add("stop-click");
            await modal.setWaitingStatus(ROOM_ID, USER_ID, audioStatus, videoStatus);

            socketWait.emit('send-enter-request', ROOM_ID, USER_ID, USER_NAME, USER_IMG);
            btn.style = `pointer-events: none; opacity: 0.3;`;
            let imgTag = `<div class="request-gif"></div>`;
            document.querySelector(".button-block").insertAdjacentHTML("beforeend", imgTag);
        }

        const settingAudioBtn = document.querySelector("#setting-audio-btn");
        settingAudioBtn.onclick = () => {
            toggleAudio(stream, settingAudioBtn, false);
        }

        const settingCameraBtn = document.querySelector("#setting-camera-btn");
        settingCameraBtn.onclick = () => {
            toggleCamera(stream, settingCameraBtn, false);
        }

        document.querySelector(".waiting-exit").onclick = () => {
            modal.refuseUserInRoom(ROOM_ID, USER_ID);
            window.location = "/";
        }

        socketConn(socketWait, stream);
        socketWait.emit('join-room', ROOM_ID, USER_ID);
    }

}).catch(err => {
    console.log("unable to get display media" + err);
})


let waitingSocketInit = async () => {
    socketWait.on('client-action', async (roomId, clientName, b) => {
        if(clientName === USER_NAME && b){
            await modal.setRoomEnterToken(roomId);
            window.location.reload();
        }else if(clientName === USER_NAME && !b){
            window.location = "/";
        }
    })
}

let socketConn = async (sk, stream) => {
    sk.on('user-connected', async uuid => {
        // socket user enter room
        if (uuid.split("-")[1] === "screen" && document.querySelector("#screen-wrapper")) return;
        connectToNewUser(uuid, stream);
        
        if(USER_ID === uuid){     
            if(auth){
                await modal.insertMongoRoomData(ROOM_ID, uuid, true, true, auth, USER_NAME, USER_IMG);
            }else if(CLIENT){
                await modal.setBackRoomLeaveStatus(ROOM_ID, uuid);
            }
            if(auth || CLIENT){
                let audioStatus;
                let groupData = await modal.getGroupInfo(ROOM_ID);
                groupLst = groupData[0];
                host = groupData[1];
                groupLst.forEach(user => {
                    if(user.uuid === USER_ID){
                        audioStatus = user.audioStatus;
                    }
                })
                createGroupDomNew(USER_NAME, host, USER_ID, USER_IMG, audioStatus, "afterbegin");
                audioSetInit(stream);
            }

            // conn establish
            document.querySelector("#waiting-block").remove();
            if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
                let audio = new Audio("/public/audio/enter-room.mp3");
                audio.volume = 0.2;
                audio.play();
            }
        }
    })
}

let socketWaitInRoomAuthInit = async () => {
    socketWait.on('user-connected', async uuid => {
        // socketWait connect
    })

    // get enter request
    socketWait.on('sent-to-auth', (clientUuid, clientName, clientImg) => {
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
                <h3><span>${clientName}</span>想加入此會議</h3>
                <h3 class="allow">同意</h3>
                <h3 class="refuse">拒絕</h3>
            </div>
            `;
            document.querySelector(".client-alert").insertAdjacentHTML("beforeend", html);
            let audio = new Audio("/public/audio/client-request.mp3");
            audio.volume = 0.3;
            audio.play();

            let alert = document.querySelector(`#alert-user-${clientUuid}`);
            let clientAllow = document.querySelector(`#alert-user-${clientUuid} .allow`);
            clientAllow.onclick = () => {
                alert.classList.add("alert-click");
                setTimeout(() => {
                    alert.remove();
                } ,500)
                socketWait.emit("allow-refuse-room", ROOM_ID, clientName, true);
            }

            let clientRefuse = document.querySelector(`#alert-user-${clientUuid} .refuse`);
            clientRefuse.onclick = () => {
                alert.classList.add("alert-click");
                setTimeout(() => {
                    alert.remove();
                } ,500)
                socketWait.emit("allow-refuse-room", ROOM_ID, clientName, false);

                modal.refuseUserInRoom(ROOM_ID, clientUuid);
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
}

let inRoomSocketInit = async () => {
    // camera
    socket.on('set-view', (options, uuid, b) => {
        if (uuid === USER_ID) return
        if(options === "video"){
            let remoteDiv = document.querySelector(`#user-${uuid} .user-block`);
            let remoteNameBg = document.querySelector(`#wrapper-${uuid} .username-wrapper-room`);
            if(remoteDiv && b){
                setTimeout(()=>{
                    remoteDiv.classList.remove("show");
                    remoteNameBg.classList.remove("bg-none");
                }, 1000)
                let audioTag = document.querySelector(`#user-${uuid} audio`);
                audioTag && (audioTag.remove());

            }else if(remoteDiv && !b){
                remoteDiv.classList.add("show");
                remoteNameBg.classList.add("bg-none");
            }
        }else if(options === "audio"){
            let remoteDiv = document.querySelector(`#wrapper-${uuid} .micro-status-icon`)
            let remoteAudioAni = document.querySelector(`#user-${uuid} .micro-ani-block`);
            if(remoteDiv && b){
                remoteDiv.classList.remove("show");
                remoteAudioAni.classList.remove("hide");
            }else if(remoteDiv && !b){
                remoteDiv.classList.add("show");
                remoteAudioAni.classList.add("hide");
            }
            let remoteGroupMicro = document.querySelector(`#group-${uuid} .user-micro`);
            let remoteGroupAudioAni = document.querySelector(`#group-${uuid} .micro-ani-block`);

            if(remoteGroupMicro && b){
                remoteGroupMicro.classList.remove("micro-off");
                remoteGroupAudioAni.classList.remove("hide");
            }else if(remoteGroupMicro && !b){
                remoteGroupMicro.classList.add("micro-off");
                remoteGroupAudioAni.classList.add("hide");
            }
        }
    })

    // leave room
    socket.on('leave-video-remove', async (uuid) => {
        let remoteUserWrapper =  document.querySelector(`#wrapper-${uuid}`);
        if(remoteUserWrapper){
            remoteUserWrapper.remove();
        }
        let groupUserWrapper = document.querySelector(`#group-${uuid}`);
        if(groupUserWrapper){
            groupUserWrapper.remove();
        }
        groupNumber.textContent = document.querySelectorAll(".group .user-one").length;
        utils.settingVideoSize();
    })

    // chat room
    socket.on('chat-room', async (roomId, clientName, message) => {
        if(ROOM_ID === roomId){

            let currentdate = new Date().toLocaleTimeString();
            let time = currentdate.slice(0,2);
            let clock = currentdate.slice(2,-3);
            let hour = clock.split(":")[0];
            let txtUuid = extension.uuid();

            if(time === "上午" && hour <= 6){
                time = "凌晨";
            }else if(time === "上午" && hour == 12){
                clock = "0" + clock.slice(2);
                time = "凌晨";
            }else if(time === "下午" && hour >= 18){
                time = "晚上";
            }

            if(tmpMessageName === clientName 
            && tmpMessageClock === clock
            && tmpMessageTime === time){
                let tag = `<div class="message-content msg-${txtUuid}"></div>`
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
                        <span class="message-time">${time}</span>
                        <span class="message-clock">${clock}</span>
                    </div>
                    <div class="message-content msg-${txtUuid}"></div>
                </div> 
                `;
                messageWrapper.insertAdjacentHTML("beforeend", html);
            }
            document.querySelector(`.msg-${txtUuid}`).textContent = message;
            tmpMessageName = clientName;
            tmpMessageClock = clock;
            tmpMessageTime = time;

            messageWrapper.scrollTo(0, messageWrapper.scrollHeight);

            extension.insertMessageAlert(clientName, message);
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
            let originHostDom = document.querySelector(`#group-${oldUuid} .user-host`);
            originHostDom.replaceChildren();

            if(USER_ID === newUuid){
                auth = true;
            }else{
                auth = false;
            }

            let hostTag = `<div class="bee-gif"></div>`;
            document.querySelector(`#group-${newUuid} .user-host`).insertAdjacentHTML("beforeend", hostTag);

            if(USER_ID === oldUuid){
                let blocks = document.querySelectorAll(`.auth-check-block`);
                blocks.forEach(block => {
                    block.remove();
                })
                let blcokOnes = document.querySelectorAll(`.user-one`);
                blcokOnes.forEach(one => {
                    one.classList.remove("can-auth");
                })

                // chat room
                document.querySelector(".allow-click").remove();
                document.querySelector(".message-wrapper").style.height = "calc(100vh - 293px)";

                // game
                document.querySelector("#eye-game").remove();
                let gameTag = `
                <div class="service-block" id="eye-game">
                    <div class="service-img s-game"></div>
                    <div class="service-txt">
                        <h4>眼明手快</h4>
                        <p>需由室長發起遊戲</p>
                    </div>
                </div>
                `;
                document.querySelector(".service-wrapper").insertAdjacentHTML("afterbegin", gameTag);
                socketWait.emit('auth-leave', ROOM_ID);
            }
            if(USER_ID === newUuid){
                if(firstSocketWait){
                    socketWait = io("/enter", {transports: ['websocket']});
                    firstSocketWait = false;
                    socketWaitInRoomAuthInit();
                }
                socketWait.emit('join-room', ROOM_ID, USER_ID);

                // group
                newAuthGroupSetting();

                // chat room
                let data = await modal.resetAuthData(ROOM_ID, USER_ID);
                let chatOpen = data[1];

                let chatAllowBlock = document.querySelector(".allow-click");
                chatAllowBlock || (addAllowClick());

                document.querySelector(".message-wrapper").style.height = "calc(100vh - 343px)";

                if(!chatOpen){
                    let switchInput = document.querySelector("#switch");
                    switchInput.checked = false;
                }

                // alert
                alertNewAuth(newUuid);

                // game
                eyeGameInit();
                document.querySelector("#eye-game .service-txt p").textContent = "點擊發起遊戲";
            }
        }
    })

    // close screen
    socket.on('close-screen-set', async (roomId, uuid) => {
        if(ROOM_ID === roomId){
            if(document.querySelector("#screen-wrapper")){
                document.querySelector("#screen-wrapper").remove();
                utils.settingVideoSize();
            }

            if(uuid !== USER_ID){
                screenShareBtn.classList.remove("stopShareClick");
            }
        }
    })

    // audio animation
    socket.on('audio-ani-set', async (roomId, uuid, b) => {
        if(ROOM_ID === roomId){
            if (document.querySelector(`#user-${uuid} .micro-ani-block`) &&
            document.querySelector(`#user-${uuid} .micro-ani-block`)){
                extension.audioAni(uuid, b);
            }
        }
    })

    // get game value
    socket.on('give-game-value', async (roomId, gameValue) => {
        if(ROOM_ID === roomId){
            gameLeft = gameValue[0];
            gameTop = gameValue[1];
            gameDelay = parseFloat(gameValue[2]);
            let clicked = false;
            showRecord = false;
            let needStop = false;

            let gameBg = document.querySelector(".game-bg");
            if(gameBg){
                gameBlock.replaceChildren();
            }

            gameStartAni();

            setTimeout(()=>{
                setTimeout(()=>{
                    let audio = new Audio("/public/audio/bee-show.wav");
                    audio.volume = 0.4;
                    audio.play();
                    gameBlock.insertAdjacentHTML("beforeend", `<div class="bee-game-gif"></div>`);
                    let dom = document.querySelector(".bee-game-gif");
                    dom.style = `left: ${gameLeft}%; top: ${gameTop}%;`;
                    userSec = 5;
                    setTimeout(() => {
                        let start = window.performance.now();
                        dom.addEventListener("click", async function sendReactionSecond(){
                            clicked = true;
                            let end = window.performance.now();
                            let sec = roundTo(((end - start) / 1000), 6);
                            userSec = sec;
                            this.removeEventListener("click", sendReactionSecond);
                            this.remove();
        
                            let waitHtml = `
                            <div class="game-wait">
                                <h1>請稍候</h1>
                                <div class="game-wait-gif"></div>
                            </div>
                            `;
                            gameBlock.insertAdjacentHTML("afterbegin", waitHtml);

                            let quitGame = await modal.sendUserSecToDB(ROOM_ID, USER_ID, sec, true);
                            if(quitGame){
                                socket.emit("five-sec-end-game", ROOM_ID);
                            }
                        })
                    }, 1)
                    let timer = setInterval(() => {
                        if(showRecord){
                            clearInterval(timer);
                            needStop = true;
                            return;
                        };
                    } ,100)
                    setTimeout(() => {
                        if (needStop) return;
                        if(!clicked){
                            modal.sendUserSecToDB(ROOM_ID, USER_ID, 5, false);
                            dom.remove();
                            let waitHtml = `
                            <div class="game-wait">
                                <h1>請稍候</h1>
                                <div class="game-wait-gif"></div>
                            </div>
                            `;
                            gameBlock.insertAdjacentHTML("afterbegin", waitHtml);
                        }
                        auth && (socket.emit("five-sec-end-game", ROOM_ID));
                    }, 5000)
                }, gameDelay * 1000)
            }, 8000)
        }
    })

    // 5 end
    socket.on('five-end', async (roomId) => {
        if(ROOM_ID === roomId){
            showRecord = true;
            setTimeout(async () => {
                let data = await modal.getGameResult(ROOM_ID);
                let wait =  document.querySelector(".game-wait");
                if(wait){
                    wait.remove();
                }
                extension.createRecordBoard(data, userSec);
            }, 500)
            setTimeout(() => {
                let exit = document.querySelector(".record-exit");
                if(exit){
                    gameBlock.classList.remove("show");
                    setTimeout(() => {
                        gameBlock.replaceChildren();
                    }, 500)
                }
            }, 10000)
        }
    })

    // disconnect
    socket.on('user-disconnected', async uuid => {
        // socket disconnect
        if (userInRoomObj[uuid]){
            delete userInRoomObj[uuid];
        } 

        if(userInRoomObj[USER_ID] && uuid !== USER_ID){
            if (document.querySelector(".allow-click")) return
            setTimeout(async()=>{
                let data = await modal.resetAuthData(ROOM_ID, USER_ID);
                let newHostUuid = data[0];
                let chatOpen = data[1];
                if(USER_ID === newHostUuid){
                    auth = true;
                    
                    let chatAllowBlock = document.querySelector(".allow-click");
                    chatAllowBlock || (addAllowClick());

                    document.querySelector(".message-wrapper").style.height = "calc(100vh - 343px)";
                    if(!chatOpen){
                        let switchInput = document.querySelector("#switch");
                        switchInput.checked = false;
                    }
                    newAuthGroupSetting();
                    alertNewAuth(newHostUuid);

                    eyeGameInit();
                    document.querySelector("#eye-game .service-txt p").textContent = "點擊發起遊戲";

                    // socketWait
                    if(firstSocketWait){
                        socketWait = io("/enter", {transports: ['websocket']});
                        socketWaitInRoomAuthInit();
                    }
                    socketWait.emit('join-room', ROOM_ID, USER_ID);
                }else{
                    auth = false;
                }
                if(!document.querySelector(".bee-gif")){
                    let hostTag = `<div class="bee-gif"></div>`;
                    document.querySelector(`#group-${newHostUuid} .user-host`).insertAdjacentHTML("beforeend", hostTag);
                }
            }, 1000)
        }
    })
}


let addVideoStream = async (video, stream, islocal, remoteUuid) => {
    video.srcObject = stream;
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return
    
    if(islocal){
        userInRoomObj[remoteUuid] = [USER_NAME, USER_IMG];
        tempMediaStreamId = stream.id;

        audioBtn.onclick = () => {
            toggleAudio(stream, audioBtn, true);
        }

        cameraBtn.onclick = () => {
            toggleCamera(stream, cameraBtn, true);
        }

        // leave room
        leaveBtn.onclick = async () => {
            clickLeaveBtnToLeave = true;
            await modal.setLeaveTrueOrDeleteRoom(ROOM_ID, USER_ID, auth);
            await modal.setRoomEnterToken(ROOM_ID);
            socket.emit("leave-room", ROOM_ID, USER_ID);
            window.location = "/";
        }

        // close broswer
        window.onunload = async () => {
            if(!clickLeaveBtnToLeave){
                // broswer 關閉不要 await 不然會壞掉
                // 需要一個 clickLeave 變數，不然案離開畫面轉跳會再執行一次
                modal.setLeaveTrueOrDeleteRoom(ROOM_ID, USER_ID, auth);
                modal.setRoomEnterToken(ROOM_ID);
                socket.emit("leave-room", ROOM_ID, USER_ID);
            }
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
                <div class="micro-ani-block">
                    <div class="dot d-left"></div>
                    <div class="dot d-middle"></div>
                    <div class="dot d-right"></div>
                </div>
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
            let data = await modal.getRemoteUser(ROOM_ID, USER_ID);

            let localAudioStatus = data.audioStatus;
            let localVideoStatus = data.videoStatus;
            if(!localAudioStatus){
                stream.getAudioTracks()[0].enabled = false;
                document.querySelector(`#user-${USER_ID} .micro-status-icon`).classList.add("show");
                document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.add("hide");
                audioBtn.classList.add("disable");
            }
            if(!localVideoStatus){
                stream.getVideoTracks()[0].enabled = false;
                stream.getVideoTracks()[0].stop();
                document.querySelector(`#user-${USER_ID} .user-block`).classList.add("show");
                document.querySelector(`.username-wrapper-room.local`).classList.add("bg-none");
                cameraBtn.classList.add("disable");
            }
            
            let roomStatus = await modal.getRoomChatAndShare(ROOM_ID);
            let chatOpen = roomStatus[0];
            let screenShare = roomStatus[1];
            if(!chatOpen){
                messageWrapper.classList.add("add-disabled");
                sendWrapper.classList.add("add-disabled");
                sendMessageInput.disabled = true;
            }
            if(!screenShare){
                screenShareBtn.classList.remove("stopShareClick");
            }

            document.querySelector(".allow-click").remove();
            document.querySelector(".message-wrapper").style.height = "calc(100vh - 293px)";
            document.querySelector("#eye-game .service-txt p").textContent = "需由室長發起遊戲";

        }else{
            switchInputInit();
            eyeGameInit();
            document.querySelector("#eye-game .service-txt p").textContent = "點擊發起遊戲";
            screenShareBtn.classList.remove("stopShareClick");
        }

    }else{
        // console.log(remoteUuid);
        if (tmpScreenShareStreamId === remoteUuid) return;
        // console.log("remote", remoteUuid)
        if(remoteUuid.split("-")[1] === "screen"){
            tmpScreenShareStreamId = remoteUuid;
            let shareName = userInRoomObj[remoteUuid.split("-")[0]][0];
            let tag = "";
            if(document.querySelector(".extension-box").classList.contains("show")){
                tag = `class="go-left"`;
            }
            let html = `
            <div id="screen-wrapper" ${tag}>
                <h4>${shareName} 正在分享螢幕</h4>
            </div>
            `;
            document.querySelector("#video-streams").insertAdjacentHTML("afterbegin", html);
            video.addEventListener("loadedmetadata", () => {
                video.play();
            })
            document.querySelector(`#screen-wrapper`).append(video);
            if(remoteUuid.split("-")[0] !== USER_ID){
                screenShareBtn.classList.add("stopShareClick");
            }
    
            utils.settingVideoSize();
            return
        }
    
        // create remote container
        if(document.querySelector(`#wrapper-${remoteUuid}`)){
            document.querySelector(`#wrapper-${remoteUuid}`).remove();
        }

        tempRemoteMediaStreamId = stream.id;

        let player = `
        <div class="video-container" id="wrapper-${remoteUuid}">
            <div class="username-wrapper-room">
                <span class="user-name"></span>
            </div>
            <div class="video-player" id="user-${remoteUuid}">
                <div class="micro-ani-block">
                    <div class="dot d-left"></div>
                    <div class="dot d-middle"></div>
                    <div class="dot d-right"></div>
                </div>
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
            video.play();
        })

        document.querySelector(`#user-${remoteUuid}`).append(video);

        let audio = document.createElement("audio");
        audio.srcObject=stream;

        audio.addEventListener("loadedmetadata", () => {
            audio.play();
        })
        document.querySelector(`#user-${remoteUuid}`).append(audio);

        let data = await modal.getRemoteUser(ROOM_ID, remoteUuid);
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
            document.querySelector(`#user-${remoteUuid} .micro-ani-block`).classList.add("hide");
        }
        if(!remoteVideoStatus){
            document.querySelector(`#wrapper-${remoteUuid} .user-block`).classList.add("show");
            document.querySelector(`#wrapper-${remoteUuid} .username-wrapper-room`).classList.add("bg-none");
        }else{
            audio.remove();
        }

        if(!userInRoomObj[remoteUuid]){
            let groupData = await modal.getGroupInfo(ROOM_ID);
            groupLst = groupData[0];
            host = groupData[1];
    
            createGroupDomNew(remoteName, host, remoteUuid, remoteImgUrl, remoteAudioStatus, "beforeend");
            userInRoomObj[remoteUuid] = [remoteName, remoteImgUrl];
        }

        socket.emit('remote-track-reload', ROOM_ID, remoteUuid);
        if(screenShareBtn.classList.contains("stopShareClick")){
            socket.emit('get-already-screen-share', ROOM_ID);
        }
    }    
    utils.settingVideoSize();
}

// camera button
let toggleCamera = async (stream, dom, inRoom) => {
    if(!document.querySelector(".user-block.local").classList.contains("show")){
        dom.classList.add("disable");
        document.querySelector(".user-block.local").classList.add("show");
        stream.getVideoTracks()[0].enabled = false;
        stream.getVideoTracks()[0].stop();

        inRoom && socket.emit("set-option", ROOM_ID, "video", USER_ID, false);
        inRoom && modal.setUserStreamStatus(ROOM_ID, USER_ID, "video", false); 

        if(inRoom){
            document.querySelector(".username-wrapper-room.local").classList.add("bg-none");
        }

    }else{
        document.querySelector(".user-block.local").classList.remove("show");
        if(inRoom){
            document.querySelector(".username-wrapper-room.local").classList.remove("bg-none");            
        }
        dom.classList.remove("disable");
        inRoom && socket.emit("set-option", ROOM_ID, "video", USER_ID, true);
        inRoom && modal.setUserStreamStatus(ROOM_ID, USER_ID, "video", true);

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        }).then( newStream => {

            if(!inRoom){
                let waitingCameraBtn = document.querySelector("#setting-camera-btn");
                document.querySelector(".setup-player video").srcObject = newStream;
                waitingCameraBtn.onclick = () => {
                    toggleCamera(newStream, waitingCameraBtn, false);
                }
                return;
            }

            myVideo.srcObject = newStream;

            let videoTrack = newStream.getVideoTracks()[0];
            socket.on('need-reload', async (roomId, uuid) => {
                if(ROOM_ID === roomId && uuid !== USER_ID){
                    let timer = setInterval(() => {
                        if(currentPeer[uuid]){
                            let sender = currentPeer[uuid].getSenders().find(function(s){
                                return s.track.kind == videoTrack.kind;
                            });
                            sender.replaceTrack(videoTrack);
                            clearInterval(timer);
                        }
                    }, 100)   
                }
            })
            try{
                Object.values(currentPeer).forEach(item => {
                    let sender = item.getSenders().find(function(s){
                        return s.track.kind == videoTrack.kind;
                    });
                    sender.replaceTrack(videoTrack);
                })
            }catch{}

            cameraBtn.onclick = () => {
                toggleCamera(newStream, cameraBtn, true);
            }
        })      
    }
}

// audio button
let toggleAudio = async (stream, dom, inRoom) => {
    let isVolumn = stream.getTracks()[0].enabled;
    if(isVolumn){
        dom.classList.add("disable");
        stream.getAudioTracks()[0].enabled = false;
        document.querySelector(".micro-status-icon.local").classList.add("show");
        if(inRoom){
            document.querySelector(`#group-${USER_ID} .user-micro`).classList.add("micro-off");
            document.querySelector(`#group-${USER_ID} .micro-ani-block`).classList.add("hide");
            document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.add("hide");
        }
        
        inRoom && socket.emit("set-option", ROOM_ID, "audio", USER_ID, false);
        inRoom && modal.setUserStreamStatus(ROOM_ID, USER_ID, "audio", false);

    }else{
        dom.classList.remove("disable");
        stream.getAudioTracks()[0].enabled = true;
        document.querySelector(".micro-status-icon.local").classList.remove("show");
        if(inRoom){
            document.querySelector(`#group-${USER_ID} .user-micro`).classList.remove("micro-off");
            document.querySelector(`#group-${USER_ID} .micro-ani-block`).classList.remove("hide");
            document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.remove("hide");
        }
        inRoom && socket.emit("set-option", ROOM_ID, "audio", USER_ID, true);
        inRoom && modal.setUserStreamStatus(ROOM_ID, USER_ID, "audio", true);
    }
}

let connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream)
    let video = document.createElement("video")
    let remoteUuid = call.peer
    call.on("stream", userVideoStream => {
        currentPeer[remoteUuid] = call.peerConnection;
        addVideoStream(video, userVideoStream, false, remoteUuid);
    })
    call.on("close", () => {
        video.remove();
    })
    peers[userId] = call;
}

let messageSubmit = async (e) => {
    e.preventDefault();
    let message = sendMessageInput.value;
    if (!message) return
    sendMessageInput.value = "";
    socket.emit('chat', ROOM_ID, USER_NAME, message);
    sendImg.classList.remove("entering");
}

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
            await modal.setRoomChatStatus(ROOM_ID, false);
        }else{
            socket.emit('close-chat', ROOM_ID, false);
            await modal.setRoomChatStatus(ROOM_ID, true);
        }
    }
}

let addAllowClick = () => {
    let html = `
    <div class="allow-click">
        <p>允許所有人傳送訊息</p>
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

let createGroupDomNew = async (name, host, uuid, imgUrl, audioStatus, position) => {
    let hostTag = "";
    let audioTag = "";
    let audioTag2 = "";
    let nameTag = "";
    if(uuid === host){
        hostTag = `<div class="bee-gif"></div>`;
    }
    if(uuid === USER_ID || !auth){
        if(uuid === USER_ID){
            nameTag = `<div class="user-name">${name} (你)</div>`;
        }else{
            nameTag = `<div class="user-name">${name}</div>`;
        }
    }else{
        nameTag = `
        <div class="user-name">${name}</div>
        <div class="auth-check-block">
            <p>是否指定 <span>${name}</span> 為會議主辦人？</p>
            <p class="auth-allow">是</p>
        </div>
        `
    }
    if(!audioStatus){
        audioTag = "hide";
        audioTag2 = " micro-off";
    }
    let imgSetting = "";
    if(imgUrl[0] !== "#"){
        imgSetting = `
        <div class="user-img" style="
            background-image: url('${imgUrl}');
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
        "></div>
        `;
    }else{
        imgSetting = `
        <div class="user-img" style="background-color: ${imgUrl};">
            <h3>${name[0]}</h3>
        </div>
        `;
    }
    let txt = `
    <div class="user-one" id="group-${uuid}">
        ${imgSetting}
        ${nameTag}
        <div class="user-host">
            ${hostTag}
        </div>
        <div class="micro-ani-block ${audioTag}">
            <div class="dot d-left"></div>
            <div class="dot d-middle"></div>
            <div class="dot d-right"></div>
        </div>
        <div class="user-micro ${audioTag2}">
            <i class="fa-solid fa-microphone-slash"></i>
        </div>
    </div>
    `;
    document.querySelector(".user-wrapper").insertAdjacentHTML(position, txt);
    groupNumber.textContent = document.querySelectorAll(".user-one").length;

    if(auth){
        if (uuid === USER_ID) return;
        NameBtnInit(uuid);
        document.querySelector(`#group-${uuid}.user-one`).classList.add("can-auth");
    }
}

let NameBtnInit = (uuid) => {
    let extensionBox = document.querySelector(".extension-box");
    let userOne = document.querySelector(`#group-${uuid}.user-one`);
    let block = document.querySelector(`#group-${uuid} .auth-check-block`);
    let yesBtn = document.querySelector(`#group-${uuid} .auth-allow`);

    userOne.addEventListener("click",() => {
        block.classList.add("show");
        let ct = 0;
        extensionBox.addEventListener("click", function blockShow(e){
            ct ++;
            if (!block.contains(e.target) 
                && !userOne.contains(e.target) 
                && ct > 1) {
                block.classList.remove("show");
                this.removeEventListener("click", blockShow);
            }else if(yesBtn.contains(e.target)){
                this.removeEventListener("click", blockShow);
            }
        })
    })
    yesBtn.onclick = async () => {
        await modal.assignNewAuth(ROOM_ID, USER_ID, uuid);
        socket.emit("auth-change", ROOM_ID, USER_ID, uuid);
        auth = false;
        block.classList.remove("show");
    }
}

let alertNewAuth = (uuid) => {
    let exist = document.querySelector(`#auth-alert-${uuid}`);
    if (exist) return;
    let html = `
    <div class="alert-block" id="auth-alert-${uuid}">
        <h3 class="change-auth-h3">您已被指派為會議主辦人</h3>
    </div>
    `;
    document.querySelector(".client-alert").insertAdjacentHTML("beforeend", html);
    let audio = new Audio("/public/audio/client-request.mp3");
    audio.volume = 0.3;
    audio.play();

    let alert = document.querySelector(`#auth-alert-${uuid}`);
    setTimeout(() => {
        alert.classList.add("alert-click");
    }, 3000)
    setTimeout(() => {
        alert.remove();
    }, 3500)
}

let newAuthGroupSetting = () => {
    let uuidDoms = document.querySelectorAll(".user-one");
    let uuids = []
    uuidDoms.forEach((dom, index) => {
        let uuid = dom.id.split("-")[1];
        uuids.push(uuid);
        if (index !== 0 ){
            dom.classList.add("can-auth");
        }
    })

    let nameBtns = document.querySelectorAll(`.group .user-name`);
    nameBtns.forEach((name, index)=> {
        if (index === 0 ) return
        name.classList.add("can-auth");
        let html = `
        <div class="auth-check-block">
            <p>是否指定 <span>${name.textContent}</span> 為會議主辦人？</p>
            <p class="auth-allow">是</p>
        </div>
        `;
        name.insertAdjacentHTML("afterend", html);
        NameBtnInit(uuids[index]);
    })
}

let screenShareBtnInit = async () => {
    let sct = 0;
    screenShareBtn.addEventListener("click", function addScreen(){
        sct ++;
        navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: false
        }).then(async stream => {
            nPeer = new Peer(`${USER_ID}-screen-${sct}`);
    
            nPeer.on('call', function(call){
                call.answer(stream);
            })
        
            nPeer.on('open', id => {
                socket.emit('join-room', ROOM_ID, `${USER_ID}-screen-${sct}`);
            })
    
            socket.on('screen-share-emit-for-late-users', async (roomId) => {
                if(ROOM_ID === roomId){
                    socket.emit('join-room', ROOM_ID, `${USER_ID}-screen-${sct}`);
                }
            })
    
            await modal.setScreenShareBool(ROOM_ID, true);
    
            this.removeEventListener("click", addScreen);
            this.classList.add("userShare");
    
            this.addEventListener("click", async function stopShare(){
                tmpScreenShareStreamId = null;
                stream.getTracks().forEach(track => track.stop());
                await modal.setScreenShareBool(ROOM_ID, false);
                screenShareBtn.classList.remove("userShare");
                socket.emit('close-screen', ROOM_ID, USER_ID);
    
                this.removeEventListener("click", stopShare);
                this.addEventListener("click", addScreen);
            })
    
            let videoTrack = stream.getVideoTracks()[0];
            videoTrack.onended = async () => {
                tmpScreenShareStreamId = null;
                await modal.setScreenShareBool(ROOM_ID, false);
                screenShareBtn.classList.remove("userShare");
                socket.emit('close-screen', ROOM_ID, USER_ID);
                screenShareBtn.addEventListener("click", addScreen);
            }
    
        }).catch(err => {
            console.log("unable to get display media" + err);
        })
    })
}

let gameStartAni = () => {
    let html = `
    <div class="game-bg"></div>
    <h3 class="game-start-txt"></h3>
    <h3 class="reciprocal"></h3>
    `;

    gameBlock.insertAdjacentHTML("beforeend", html);
    const gameStartTxt = document.querySelector(".game-start-txt");
    gameBlock.classList.add("show");
    extension.gameStartTextSetting();

    setTimeout(()=>{
        gameStartTxt.style.opacity = "0";
        setTimeout(()=>{
            gameStartTxt.remove();
        }, 500)
    }, 5000)

    let content = 3;
    setTimeout(()=>{
        let timer = setInterval(()=>{
            extension.reciprocalAnimation(content);
            let audio = new Audio("/public/audio/count-down.wav");
            audio.volume = 0.2;
            audio.play();

            content --;
            if(content === 0){
                clearInterval(timer);
            }
        }, 1000)
    }, 4000)
}

let roundTo = ( num, decimal ) => {
    return Math.round( ( num + Number.EPSILON ) * Math.pow( 10, decimal ) ) / Math.pow( 10, decimal ); 
}

let audioSetInit = async (stream) => {
    let volumeCallback = null;
    let volumeInterval = null;
    let isVolumn = false;
    let stopT = true;

    // Initialize
    try {
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.minDecibels = -127;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.4;
        audioSource.connect(analyser);
        const volumes = new Uint8Array(analyser.frequencyBinCount);
        volumeCallback = () => {
            analyser.getByteFrequencyData(volumes);
            let volumeSum = 0;
            for(const volume of volumes)
            volumeSum += volume;
            const averageVolume = volumeSum / volumes.length;

            if(averageVolume < 40 && !isVolumn){
                socket.emit("audio-ani", ROOM_ID, USER_ID, false);
            }else{
                isVolumn = true;
                if(isVolumn && stopT){
                    socket.emit("audio-ani", ROOM_ID, USER_ID, true);
                    setTimeout(() => {
                        isVolumn = false;
                        stopT = true;
                    }, 500)
                }
                stopT = false;
            }
        };
    } catch(e) {
        console.error('Failed to initialize volume visualizer, simulating instead...', e);
    }

    volumeInterval = setInterval(volumeCallback, 100);
}