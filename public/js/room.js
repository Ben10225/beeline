import utils from "./utils.js";
import extension from "./extension.js";

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let pct = 0;
let enterRoom = false;

let pageTimer = setInterval(() => {
    pct ++;
    if(pct === 1300){
        clearInterval(pageTimer);
        if(!enterRoom){
            history.go(0);
        }
    }
}, 1);

let auth;

auth = (parseInt(params.auth) === 0);
if(auth){
    let authData = await utils.checkIfAuthAlready(ROOM_ID);
    let authExist = authData[0];
    let authUuid = authData[1];

    if(authExist === "exist"){
        auth = false;
    }
    if(authUuid === USER_ID){
        auth = true;
    }
}

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


let disconnect = true;

let tmpMessageClock = null;
let tmpMessageTime = null;
let tmpMessageName = null;
// let clientFirstLoad = true;
let clickLeaveBtnToLeave = false;
let host = "";
let groupLst = [];
let userInRoomObj = {};
let videoCt = 0;
let tmpNewStreamCt = null;
let needLoadAgain = false;
let currentPeer;

let voiceNow = false;
let wait = false;
let slowAni = true;
let vFirst = 0;
let vSecond = 0;
let vThird = 0;
let stopToken = 0;
let aniToken = 0;
// let timerAni;
// let socket;

const socket = io({transports: ['websocket']});
// const socket = io({transports: ['websocket'], upgrade: false});
// const socket = io({upgrade: true});


const userContainer = document.querySelector(".user-container");

// const myPeer = new Peer()
// const myPeer = new Peer(USER_ID)
const myPeer = new Peer(USER_ID, {
    host: "https://beelinetw.com/myapp",
    port: 9000,
    path: "/myapp",
})

const myVideo = document.createElement("video")
myVideo.muted = true;

let tempMediaStreamId = null;
let tempRemoteMediaStreamId = null;

const peers = {}

let nPeer = new Peer();
// const nPeer = new Peer(`${USER_ID}-screen`)


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( async stream => {
    if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
        InRoomSocketInit();

        body.style.backgroundColor = "#000";
        bg.style.backgroundImage = "url('/public/images/roombg2.svg')";;
        bg.style.opacity = "0.15";
        wrapper.style.justifyContent = "flex-start";
        document.querySelector("#user-setup").remove();

        utils.generateShortLink();

        // console.log("bb");

        // 進房時監聽
        addVideoStream(myVideo, stream, true, USER_ID);
        myPeer.on('call', function(call){
            call.answer(stream)
            const video = document.createElement("video")
            let remoteUuid = call.peer;
            call.on("stream", userVideoStream => {
                currentPeer = call.peerConnection;

                if (USER_ID === userVideoStream.id) return
                // console.log("stream", userVideoStream)
                addVideoStream(video, userVideoStream, false, remoteUuid)
            })
        })        

        // nPeer.on('call', function(call){
        //     call.answer(stream);
        //     console.log(stream)
        //     // const video = document.createElement("video")
        //     // addVideoStream(video, userVideoStream, false, remoteUuid, "screen")
        // })

    }else if(!auth){
        WaitingSocketInit();

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
        await insertMongoRoomData(ROOM_ID, USER_ID, true, true, auth);


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
    }

    socket.on('user-connected', async uuid => {
        console.log(`user ${uuid} enter room ${ROOM_ID}`);
        connectToNewUser(uuid, stream);

        if(USER_ID === uuid){
            tryEnterRoom(USER_ID);        

            if(auth){
                await insertMongoRoomData(ROOM_ID, uuid, true, true, auth);
            }else if(CLIENT){
                await setBackRoomLeaveStatus(ROOM_ID, uuid);
            }
            if(auth || CLIENT){
                let audioStatus;
                let groupData = await extension.getGroupInfo(ROOM_ID);
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

            enterRoom = true;
            disconnect = false;
        }
    })
    
    socket.on('user-disconnected', async uuid => {
        console.log("out meeting: ", uuid);

        if (userInRoomObj[uuid]){
            delete userInRoomObj[uuid];
            // console.log(userInRoomObj);
            groupNumber.textContent = Object.keys(userInRoomObj).length;
        } 

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
                    newAuthGroupSetting();
                    alertNewAuth(newHostUuid);

                }else{
                    auth = false;
                }
                if(!document.querySelector(".bee-gif")){
                    let hostTag = `<div class="bee-gif"></div>`;
                    document.querySelector(`#group-${newHostUuid} .user-host`).insertAdjacentHTML("beforeend", hostTag);
                }
            }, 1000)
        }

        if(uuid === USER_ID){
            disconnect = true;
            checkNeedReconnect(ROOM_ID, USER_ID);
        }
    })

    socket.emit('join-room', ROOM_ID, USER_ID);
    
    // var conn = myPeer.connect(USER_ID);
    // on open will be launch when you successfully connect to PeerServer
    // conn.on('open', function(){
    //     // here you have conn.id
    // });

    // myPeer.on('open', async id => {
    //     console.log("before emit join room");
    //     socket.emit('join-room', ROOM_ID, id);
    // })
})


let WaitingSocketInit = async () => {
    socket.on('client-action', async (roomId, clientName, b) => {
        if(clientName === USER_NAME && b){
            await setRoomEnterToken(roomId);
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
                // setTimeout(()=>{
                //     remoteDiv.classList.remove("show");
                //     remoteNameBg.classList.remove("bg-none");
                // }, 2000)
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
                <h3><span>${clientName}</span>想加入此會議</h3>
                <h3 class="allow">准許</h3>
                <h3 class="refuse">拒絕</h3>
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

            let currentdate = new Date().toLocaleTimeString();
            let time = currentdate.slice(0,2);
            let clock = currentdate.slice(2,-3);
            let hour = clock.split(":")[0];

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
                        <span class="message-time">${time}</span>
                        <span class="message-clock">${clock}</span>
                    </div>
                    <div class="message-content">${message}</div>
                </div> 
                `;
                messageWrapper.insertAdjacentHTML("beforeend", html);
            }
            tmpMessageName = clientName;
            tmpMessageClock = clock;
            tmpMessageTime = time;

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
                newAuthGroupSetting();

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

    // close screen
    socket.on('close-screen-set', async (roomId) => {
        if(ROOM_ID === roomId){
            document.querySelector("#screen-wrapper").remove();
            utils.settingVideoSize();
        }
    })

    // audio animation
    socket.on('audio-ani-set', async (roomId, uuid, b) => {
        if(ROOM_ID === roomId){
            extension.audioAni(uuid, b);
        }
    })
}


let addVideoStream = async (video, stream, islocal, remoteUuid, screen) => {
    video.srcObject = stream;
    if (tempMediaStreamId === stream.id) return
    if (tempRemoteMediaStreamId === stream.id) return

    if(screen === "screen"){
        // document.querySelector(".user-container").style.width = "20%";

        // let html = `<div id="screen-warpper"></div>`;
        // document.querySelector(".user-container").insertAdjacentHTML("afterbegin", html)
        // video.addEventListener("loadedmetadata", () => {
        //     video.play();
        // })
        // document.querySelector(`#screen-warpper`).append(video);

        // utils.settingVideoSize();
        // console.log("dd")
        // document.querySelector(".video-container").style.width = "20%";
        // document.querySelector(".video-container").style.height = "20%";
        return
    }

    if(islocal){
        /*
        if(remoteUuid.split("-")[1]){
            if (tmpNewStreamCt === remoteUuid.split("-")[1]) return;

            // let videoBlock = document.createElement("div");
            // videoBlock.className = "video-block";
            // document.querySelector(`#user-${existUuid}`).append(videoBlock);

            tmpNewStreamCt = remoteUuid.split("-")[1];
            let existUuid = remoteUuid.split("-")[0];

            // let videoDom = document.querySelector(`#user-${existUuid} video`);
            // videoDom.remove()
            // videoDom.style = `background-color: #fff`;

            video.addEventListener("loadedmetadata", () => {
                video.play()
            })
            setTimeout(()=>{
                document.querySelector(`#user-${existUuid}`).append(video);
            }, 1000)
            return
        }
        */
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
            clickLeaveBtnToLeave = true;
            await setLeaveTrueOrDeleteRoom(ROOM_ID, USER_ID, auth);
            await setRoomEnterToken(ROOM_ID);
            socket.emit("leave-room", ROOM_ID, USER_ID);
            window.location = "/";
        }

        // close broswer
        window.onunload = async () => {
            if(!clickLeaveBtnToLeave){
                // broswer 關閉不要 await 反而會壞掉
                // 需要一個 clickLeave 變數，不然畫面轉跳以下會再執行一次
                setLeaveTrueOrDeleteRoom(ROOM_ID, USER_ID, auth);
                setRoomEnterToken(ROOM_ID);
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

        // let videoBlock = document.createElement("div");
        // videoBlock.className = "video-block";
        // document.querySelector(`#user-${USER_ID}`).append(videoBlock);

        
        if(!auth){
            let data = await getRemoteUser(ROOM_ID, USER_ID);

            let localAudioStatus = data.audioStatus;
            let localVideoStatus = data.videoStatus;
            if(!localAudioStatus){
                stream.getTracks()[0].enabled = false;
                document.querySelector(`#user-${USER_ID} .micro-status-icon`).classList.add("show");
                document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.add("hide");
                audioBtn.classList.add("disable");
            }
            if(!localVideoStatus){
                stream.getTracks()[1].enabled = false;
                // stream.getTracks()[1].stop();
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
        if(remoteUuid.split("-")[1] === "screen"){
            let shareName = userInRoomObj[remoteUuid.split("-")[0]][0]
            // oriDom = document.querySelector(`wrapper-${remoteUuid.split("-")[0]}`);
            let html = `
            <div id="screen-wrapper">
                <h4>${shareName} 正在分享螢幕</h4>
            </div>
            `;
            document.querySelector(".user-container").insertAdjacentHTML("afterbegin", html)
            video.addEventListener("loadedmetadata", () => {
                video.play();
            })
            document.querySelector(`#screen-wrapper`).append(video);
    
            utils.settingVideoSize();
            return
        }
        /*
        let oriDom;
        if(remoteUuid.split("-")[1] !== undefined){
            oriDom = document.querySelector(`wrapper-${remoteUuid.split("-")[0]}`);
        }
        if(remoteUuid.split("-")[1] && oriDom){
            if (tmpNewStreamCt === remoteUuid.split("-")[1]) return;
            tmpNewStreamCt = remoteUuid.split("-")[1];
            let existUuid = remoteUuid.split("-")[0];
            // console.log(existUuid)
            let videoDom = document.querySelector(`#user-${existUuid} video`);
            videoDom.remove();

            // video.addEventListener("loadedmetadata", () => {
            //     video.play()
            // })
            document.querySelector(`#user-${existUuid}`).append(video);
            return
        }else if(remoteUuid.split("-")[1] && !oriDom){
            remoteUuid = remoteUuid.split("-")[0];
            needLoadAgain = true;
        }
        */
    
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

        let screenDom = document.querySelector("#screen-wrapper");
        if(screenDom){
            screenDom.insertAdjacentHTML("afterend", player);
        }else{
            userContainer.insertAdjacentHTML("afterbegin", player);
        }

        video.addEventListener("loadedmetadata", () => {
            video.play();
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
            document.querySelector(`#user-${remoteUuid} .micro-ani-block`).classList.add("hide");
        }
        if(!remoteVideoStatus){
            document.querySelector(`#wrapper-${remoteUuid} .user-block`).classList.add("show");
            document.querySelector(`#wrapper-${remoteUuid} .username-wrapper-room`).classList.add("bg-none");
        }

        if(!userInRoomObj[remoteUuid]){
            let groupData = await extension.getGroupInfo(ROOM_ID);
            groupLst = groupData[0];
            host = groupData[1];
    
            createGroupDomNew(remoteName, host, remoteUuid, remoteImgUrl, remoteAudioStatus, "beforeend");
            userInRoomObj[remoteUuid] = [remoteName, remoteImgUrl];
        }

        // if(needLoadAgain){
        //     addVideoStream(video, stream, islocal, remoteUuid);
        // }
        // needLoadAgain = false;

        // if(clientFirstLoad && !auth){
        //     if (Object.keys(userInRoomObj).length >= groupLst.length){
        //         // console.log("cc")
        //         createGroupDom(groupLst, host, USER_ID);
        //     }
        // }else{
        //     let needAdd = true;
        //     groupLst.forEach(data => {
        //         if(data.uuid === remoteUuid){
        //             needAdd = false
        //         }
        //     })
        //     if(needAdd){
        //         groupLst.push({"uuid": remoteUuid, "audioStatus": remoteAudioStatus});
        //     }
        //     if (Object.keys(userInRoomObj).length >= groupLst.length){
        //         // console.log("dd")
        //         createGroupDom(groupLst, host, USER_ID);
        //     }
        // }

        // clientFirstLoad = false;
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
        // stream.getTracks()[1].stop();
        // stream.getVideoTracks()[0].stop();
        socket.emit("set-option", ROOM_ID, "video", USER_ID, false);
        setUserStreamStatus(ROOM_ID, USER_ID, "video", false);

        if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
            document.querySelector(".username-wrapper-room.local").classList.add("bg-none");
        }

    }else{
        document.querySelector(".user-block.local").classList.remove("show");
        if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
            document.querySelector(".username-wrapper-room.local").classList.remove("bg-none");            
        }
        dom.classList.remove("disable");
        stream.getTracks()[1].enabled = true;
        socket.emit("set-option", ROOM_ID, "video", USER_ID, true);
        setUserStreamStatus(ROOM_ID, USER_ID, "video", true);

        /*
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        }).then( newStream => {

            let videoTrack = newStream.getVideoTracks()[0];
            // let videoTrack = newStream.getTracks()[1];
            // console.log(currentPeer)
            let sender = currentPeer.getSenders().find(function(s){
                return s.track.kind == videoTrack.kind;
            });
            sender.replaceTrack(videoTrack);
            
            myVideo.srcObject = newStream;

            cameraBtn.onclick = () => {
                toggleCamera(newStream, cameraBtn);
            }

            // audioBtn.onclick = () => {
            //     toggleAudio(newStream, audioBtn);
            // }

            // if(auth || CLIENT){
            //     if(document.querySelector("#audio-btn").classList.contains("disable")){
            //         newStream.getTracks()[0].enabled = false;
            //     }
            // }
        })
        */

        /*
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        setTimeout(()=>{
            document.querySelector(".user-block.local").classList.remove("show");
            if(auth || (CLIENT && ENTER_ROOM_ID === ROOM_ID)){
                document.querySelector(".username-wrapper-room.local").classList.remove("bg-none");            
            }
        }, 2000)

        videoCt ++;
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then( newStream => {

            // document.querySelector(".video-container").style.opacity = "0";
            // document.querySelector(".user-block").style.opacity = "1";

            myPeer = new Peer(`${USER_ID}-${videoCt}`)

            myPeer.on('call', function(call){
                call.answer(newStream);
                addVideoStream(myVideo, newStream, true, `${USER_ID}-${videoCt}`)
            })

            myPeer.on('open', async id => {
                socket.emit('join-room', ROOM_ID, id);
            })

            cameraBtn.onclick = () => {
                toggleCamera(newStream, cameraBtn);
            }

            audioBtn.onclick = () => {
                toggleAudio(newStream, audioBtn);
            }
            if(auth || CLIENT){
                if(document.querySelector("#audio-btn").classList.contains("disable")){
                    newStream.getTracks()[0].enabled = false;

                }
            }
        })
        */
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
            document.querySelector(`#group-${USER_ID} .micro-ani-block`).classList.add("hide");
            document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.add("hide");
        }
        socket.emit("set-option", ROOM_ID, "audio", USER_ID, false);
        setUserStreamStatus(ROOM_ID, USER_ID, "audio", false);

    }else{
        dom.classList.remove("disable");
        stream.getTracks()[0].enabled = true;
        document.querySelector(".micro-status-icon.local").classList.remove("show");
        if(auth || CLIENT){
            document.querySelector(`#group-${USER_ID} .user-micro`).classList.remove("micro-off");
            document.querySelector(`#group-${USER_ID} .micro-ani-block`).classList.remove("hide");
            document.querySelector(`#user-${USER_ID} .micro-ani-block`).classList.remove("hide");
        }
        socket.emit("set-option", ROOM_ID, "audio", USER_ID, true);
        setUserStreamStatus(ROOM_ID, USER_ID, "audio", true);
    }
}

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

let connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream)
    let video = document.createElement("video")
    let remoteUuid = call.peer
    call.on("stream", userVideoStream => {
        currentPeer = call.peerConnection;
        addVideoStream(video, userVideoStream, false, remoteUuid)
    })
    call.on("close", () => {
        video.remove()
    })
    peers[userId] = call;
}

// let connectToNewUserScreen = (userId, stream) => {
//     const call = nPeer.call(userId, stream)
//     let video = document.createElement("video")
//     let remoteUuid = call.peer
//     call.on("stream", userVideoStream => {
//         currentPeer = call.peerConnection;
//         addVideoStream(video, userVideoStream, false, remoteUuid)
//     })
//     call.on("close", () => {
//         video.remove()
//     })
//     peers[userId] = call;
// }


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

let setLeaveTrueOrDeleteRoom = async (roomId, uuid, auth) => {
    let response = await fetch(`/room/setLeaveTrueOrDeleteRoom`, {
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

let setRoomEnterToken = async (roomId) => {
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
}

extension.rightIconsInit();

msgSubmit.addEventListener("submit", messageSubmit);

sendMessageInput.addEventListener("input", ()=>{
    sendImg.classList.add("entering");
    if(!sendMessageInput.value){
        sendImg.classList.remove("entering");
    }
})

searchBar.addEventListener("input", extension.searchUser);  

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

    // groupNumber.textContent = Object.keys(userInRoomObj).length;
    groupNumber.textContent = document.querySelectorAll(".user-one").length;

    if(auth){
        if (uuid === USER_ID) return;
        NameBtnInit(uuid);
        document.querySelector(`#group-${uuid} .user-name`).classList.add("can-auth");
    }
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

let alertNewAuth = (uuid) => {
    let html = `
    <div class="alert-block" id="auth-alert-${uuid}">
        <h3 class="change-auth-h3">您已被指派為會議主辦人</h3>
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

let newAuthGroupSetting = () => {
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
            <p>是否指定 <span>${name.textContent}</span> 為會議主辦人？</p>
            <p class="auth-allow">是</p>
        </div>
        `;
        name.insertAdjacentHTML("afterend", html);
        NameBtnInit(uuids[index]);
    })
}

// console.log(nPeer)

let sct = 0;
screenShareBtn.addEventListener("click", function addScreen(){
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: false
    }).then(stream => {
        sct ++;
        // nPeer = new Peer(`${USER_ID}-screen-${sct}`)
        nPeer = new Peer(`${USER_ID}-screen-${sct}`, {
            host: "https://beelinetw.com/",
            port: 9000,
            path: "/myapp",
        })

        nPeer.on('open', async id => {
            socket.emit('join-room', ROOM_ID, id);
        })

        nPeer.on('call', function(call){
            call.answer(stream);
        })

        this.removeEventListener("click", addScreen)
        this.style.backgroundImage = "url('/public/images/screen-share-ing.svg')";
        this.style.cursor = "default";

        let videoTrack = stream.getVideoTracks()[0];
        videoTrack.onended = function() {
            screenShareBtn.style.backgroundImage = "url('/public/images/screen-share.svg')";
            screenShareBtn.style.cursor = "pointer";
            socket.emit('close-screen', ROOM_ID);
            screenShareBtn.addEventListener("click", addScreen);
        }
    }).catch(err => {
        console.log("unable to get display media" + err);
    })

    // 更換 videoTrack
    // let videoTrack = stream.getVideoTracks()[0];
    // let sender = currentPeer.getSenders().find(function(s){
    //     return s.track.kind == videoTrack.kind
    // });
    // sender.replaceTrack(videoTrack);
})

let audioSetInit = async (stream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    scriptProcessor.onaudioprocess = function() {
        if(!audioBtn.classList.contains("disable")){
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            const arraySum = array.reduce((a, value) => a + value, 0);
            const average = arraySum / array.length;
            let number = Math.round(average);
            
            if(!wait){
                vThird = vSecond;
                vSecond = vFirst;
                vFirst = number;
            }

            if((vThird-vFirst > 3 && voiceNow)){
                stopToken ++;
                if(stopToken > 3){
                    socket.emit("audio-ani", ROOM_ID, USER_ID, false);
                    voiceNow = false;
                    wait = true;

                    setTimeout(()=>{
                        wait = false;
                    }, 700)
                }
            }else{
                stopToken = 0;
            }

            if(number < 10 && voiceNow){
                socket.emit("audio-ani", ROOM_ID, USER_ID, false);
                voiceNow = false;
            }

            if(!voiceNow && !wait){
                if(number >= 10 && vFirst - vThird > 2){
                    aniToken ++ ;
                    if(aniToken > 1){
                        voiceNow = true;
                        socket.emit("audio-ani", ROOM_ID, USER_ID, true);
                    }
                }else{
                    aniToken = 0;
                }
            }
        }
    };

}



// screenShareBtn.addEventListener("click", screenShare);




/*
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

let groupHtml = (user, host, localUuid) => {
    // if (!userInRoomObj[user.uuid]) return
    let hostTag = "";
    let audioTag = "";
    let nameTag = "";
    if(user.uuid === host){
        hostTag = `<div class="bee-gif"></div>`;
    }
    if(user.uuid === localUuid || !auth){
        if(user.uuid === localUuid){
            nameTag = `<div class="user-name">${userInRoomObj[user.uuid][0]} (你)</div>`;
        }else{
            nameTag = `<div class="user-name">${userInRoomObj[user.uuid][0]}</div>`;
        }
    }else{
        nameTag = `
        <div class="user-name">${userInRoomObj[user.uuid][0]}</div>
        <div class="auth-check-block">
            <p>是否指定 <span>${userInRoomObj[user.uuid][0]}</span> 為會議主辦人？</p>
            <p class="auth-allow">是</p>
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
        <div class="user-host">
            ${hostTag}
        </div>
        <div class="user-micro ${audioTag}">
            <i class="fa-solid fa-microphone-slash"></i>
            <i class="fa-solid fa-microphone"></i>
        </div>
    </div>
    `;
    return txt;
}
*/