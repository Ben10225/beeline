import utils from "./utils.js";

const userContainer = document.querySelector(".user-container");

const infoIcon =  document.querySelector(".fa-link");
const infoIconBlock = document.querySelector(".icon-right-solo.ic-info");
const groupIcon =  document.querySelector(".fa-user-group");
const groupIconBlock = document.querySelector(".icon-right-solo.ic-group");
const chatIcon =  document.querySelector(".fa-message");
const chatIconBlock = document.querySelector(".icon-right-solo.ic-message");
const shapeIcon = document.querySelector(".fa-shapes");
const shapeIconBlock = document.querySelector(".icon-right-solo.ic-shape");

const extensionBox = document.querySelector(".extension-box");
const info = document.querySelector(".info");
const group = document.querySelector(".group");
const chat = document.querySelector(".chat");
const service = document.querySelector(".service");
const exitIcon = document.querySelector(".exit");
const alertWrapper = document.querySelector(".client-alert");
const searchBar = document.querySelector("#search");

const gameBlock = document.querySelector("#game-block");

const extensionDomLst = [info, group, chat, service];
const iconLst = [infoIcon, groupIcon, chatIcon, shapeIcon];

const emojiBtn = document.querySelector("#emoji-btn");
const emojiGood = document.querySelector(".emoji-good");
const emojiHeart = document.querySelector(".emoji-heart");
const emojLaugh = document.querySelector(".emoji-laugh");
const emojiShock = document.querySelector(".emoji-shock");
const emojiBee = document.querySelector(".emoji-bee");
const emojiLst = [emojiGood, emojiHeart, emojLaugh, emojiShock, emojiBee];

const emojiAniWrapper = document.querySelector(".emoji-ani-wrapper");


let rightIconsInit = () => {
    infoIconBlock.onclick = () => {
        iconBlockClick(infoIcon, info);
    }

    groupIconBlock.onclick = () => {
        iconBlockClick(groupIcon, group);
    }
    
    chatIconBlock.onclick = () => {
        iconBlockClick(chatIcon, chat);
    }

    shapeIconBlock.onclick = () => {
        iconBlockClick(shapeIcon, service);
    }

    exitIcon.onclick = () => {
        iconLst.forEach(dom => {
            dom.classList.remove("clicked");
        })
        extensionBox.classList.remove("show");
        setTimeout(() => {
            userContainer.classList.remove("go-left");
            alertWrapper.classList.remove("go-left");
        }, 100);

    }
}

let iconBlockClick = (iconDom, extensionBlock) => {
    if(!iconDom.classList.contains("clicked")){
        iconLst.forEach(icon => {
            if(icon === iconDom){
                icon.classList.add("clicked");
            }else{
                icon.classList.remove("clicked");
            }
        })
        extensionDomLst.forEach(section => {
            if(section === extensionBlock){
                section.classList.add("show");
            }else{
                section.classList.remove("show");
            }
        })
        if(!extensionBox.classList.contains("show")){
            extensionBox.classList.add("show");
            setTimeout(() => {
                userContainer.classList.add("go-left");
                alertWrapper.classList.add("go-left");
            }, 100);
        }
    }else{
        iconDom.classList.remove("clicked");
        setTimeout(() => {
            extensionBlock.classList.remove("show");
        }, 300)
        if(extensionBox.classList.contains("show")){
            extensionBox.classList.remove("show");
            setTimeout(() => {
                userContainer.classList.remove("go-left");
                alertWrapper.classList.remove("go-left");
            }, 100);
        }
    }
}

let getGroupInfo = async (roomId) => {
    let response = await fetch(`/room/getGroupInfo`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
        })
    });
    let data = await response.json();
    return [data.data, data.host];
}

let assignNewAuth = async (roomId, oldUuid, newUuid) => {
    let response = await fetch(`/room/assignNewAuth`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "oldUuid": oldUuid,
            "newUuid": newUuid,
        })
    });
    let data = await response.json();
    // return [data.data, data.host];
}

let searchUser = async () => {
    let value = searchBar.value;
    let domS = document.querySelectorAll(".user-one");
    domS.forEach((dom, index) => {
        let txt = dom.childNodes[3].textContent;
        if(index === 0){
            txt = txt.slice(0,-4);
        }
        if(!txt.includes(value)){
            dom.style = "display: none";
        }else{
            dom.style = "display: block";
        }
    })
}

let audioAni = (uuid, bool) => {
    try{
        if(bool){
            document.querySelector(`#user-${uuid} .d-left`).classList.add("ani");
            document.querySelector(`#user-${uuid} .d-middle`).classList.add("ani");
            document.querySelector(`#user-${uuid} .d-right`).classList.add("ani");
            document.querySelector(`#group-${uuid} .d-left`).classList.add("ani");
            document.querySelector(`#group-${uuid} .d-middle`).classList.add("ani");
            document.querySelector(`#group-${uuid} .d-right`).classList.add("ani");
        }else{
            document.querySelector(`#user-${uuid} .d-left`).classList.remove("ani");
            document.querySelector(`#user-${uuid} .d-middle`).classList.remove("ani");
            document.querySelector(`#user-${uuid} .d-right`).classList.remove("ani");
            document.querySelector(`#group-${uuid} .d-left`).classList.remove("ani");
            document.querySelector(`#group-${uuid} .d-middle`).classList.remove("ani");
            document.querySelector(`#group-${uuid} .d-right`).classList.remove("ani");
        }
    }catch{}
}

let reciprocalAnimation = (text) => {
    let reciprocal = document.querySelector(".reciprocal");
    if(reciprocal){
        reciprocal.remove();
    }
    let html = `<h3 class="reciprocal">${text}</h3>`;
    gameBlock.insertAdjacentHTML("beforeend", html);
    let newReciprocal = document.querySelector(".reciprocal");
    newReciprocal.style.animation = "reciprocal-ani 0.7s both";
    setTimeout(()=>{
        newReciprocal.remove();
    }, 1000)
}

let gameStartTextSetting = () => {
    const gameStartTxt = document.querySelector(".game-start-txt");
    let txtLst = [
        "墮", "敷", "遊", "遊",
        "遊卡", "遊恩", "遊戲", "遊戲",
        "遊戲贏", "遊戲雅", "遊戲即", "遊戲即",
        "遊戲即為", "遊戲即翰", "遊戲即將", "遊戲即將",
        "遊戲即將力", "遊戲即將言", "遊戲即將開", "遊戲即將開",
        "遊戲即將開瓶", "遊戲即將開師", "遊戲即將開始",
    ]; 
    setTimeout(() => {
        txtLst.forEach((t, index) => {
            setTimeout(()=>{
                gameStartTxt.textContent = t;
            }, index * 160)
        })
        utils.playAudio("/public/audio/type.wav", 0.6);
        // let audio = new Audio("/public/audio/type.wav");
        // audio.volume = 0.7;
        // audio.play();
    },500)
}

let createRecordBoard = (datatLst, userSec) => {
    let firstBlock = "";
    let secondBlock = "";
    let badBlock = "";
    let resultLst = datatLst.result;
    let infoLst = datatLst.info;
    if(resultLst.length <= 3){
        resultLst.forEach((data, index) => {
            let imgSetting = "";
            if(infoLst[index]["Arr"][1][0] !== "#"){
                imgSetting = `
                <div class="record-img" style="
                    background-image: url('${infoLst[index]["Arr"][1]}');
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: cover;
                "></div>
                `;
            }else{
                imgSetting = `
                <div class="record-img" style="background-color: ${infoLst[index]["Arr"][1]};">
                    <h3>${infoLst[index]["Arr"][0][0]}</h3>
                </div>
                `;
            }
            let localBg = "";
            data.Uuid === USER_ID && (localBg = "local-user");
            let txt = `
            <div class="one-record ${localBg}">
                <div class="record-place">${index+1}</div>
                ${imgSetting}
                <div class="record-name">${infoLst[index]["Arr"][0]}</div>
                <div class="record-sec">${data.Sec}<span> 秒</span></div>
            </div>
            `;
            firstBlock += txt;
        })
    }else{
        resultLst.forEach((data, index) => {
            let imgSetting = "";
            if(infoLst[index]["Arr"][1][0] !== "#"){
                imgSetting = `
                <div class="record-img" style="
                    background-image: url('${infoLst[index]["Arr"][1]}');
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: cover;
                "></div>
                `;
            }else{
                imgSetting = `
                <div class="record-img" style="background-color: ${infoLst[index]["Arr"][1]};">
                    <h3>${infoLst[index]["Arr"][0][0]}</h3>
                </div>
                `;
            }

            if(index < 3){
                let localBg = "";
                data.Uuid === USER_ID && (localBg = "local-user");
                let txt = `
                <div class="one-record ${localBg}">
                    <div class="record-place">${index+1}</div>
                    ${imgSetting}
                    <div class="record-name">${infoLst[index]["Arr"][0]}</div>
                    <div class="record-sec">${data.Sec}<span> 秒</span></div>
                </div>
                `;
                firstBlock += txt;
            }else{
                let localBg = "";
                data.Uuid === USER_ID && (localBg = "local-user");
                let txt = `
                <div class="one-record ${localBg}">
                    <div class="record-place">
                        <i class="fa-solid fa-skull"></i>
                    </div>
                    ${imgSetting}
                    <div class="record-name">${infoLst[index]["Arr"][0]}</div>
                    <div class="record-sec">${data.Sec}<span> 秒</span></div>
                </div>
                `;
                secondBlock += txt;
            }
            badBlock = `
            <div class="last-three record-block">
                <h2 class="record-title">底 Bee</h2>
                <div class="record-intro">
                    <h4 class="intro-place">名次</h4>
                    <h4 class="intro-name">姓名</h4>
                    <h4 class="intro-reaction">反應秒數</h4>
                </div>
                <hr>
                <div class="user-record">
                    ${secondBlock}
                </div>
            </div>
            `;
        })
    }
    let html = `
    <div class="record-wrapper">
        <div class="record-exit">
            <i class="fa-solid fa-xmark"></i>
        </div>
        <div class="first-three record-block">
            <h2 class="record-title">牛 Bee</h2>
            <div class="record-intro">
                <h4 class="intro-place">名次</h4>
                <h4 class="intro-name">姓名</h4>
                <h4 class="intro-reaction">反應秒數</h4>
            </div>
            <hr>
            <div class="user-record">
                ${firstBlock}
            </div>
        </div>
        ${badBlock}
        <div class="your-block record-block">
            <div class="your-intro">你的秒數</div>
            <div>${userSec}<span> 秒</span></div>
        </div>
    </div> 
    `;
    gameBlock.insertAdjacentHTML("beforeend", html);

    let exit = document.querySelector(".record-exit");
    exit.onclick = () => {
        gameBlock.classList.remove("show");
        setTimeout(() => {
            gameBlock.replaceChildren();
        }, 500)
    }
}

let emojiBtnInit = (socket) => {
    emojiBtn.onclick = () => {
        emojiBtn.classList.toggle("clicked");
        if(emojiBtn.classList.contains("clicked")){
            document.querySelector(".emoji-block").classList.add("show");
        }else{
            document.querySelector(".emoji-block").classList.remove("show");
        }
    }
    emojiLst.forEach((emoji, index)=> {
        emoji.onmouseover = () => {
            emoji.classList.add("hover-style");
        }
        emoji.onmouseout = () => {
            emoji.classList.remove("hover-style");
        }
        emoji.onclick = () => {
            emoji.classList.add("stop-click");
            emoji.classList.remove("hover-style");
            createEmojiTag(USER_NAME, index);

            socket.emit("generate-emoji", ROOM_ID, USER_ID, USER_NAME, index);

            setTimeout(() => {
                emoji.classList.remove("stop-click");
            },1000)
        }
    })

    socket.on("send-emoji", (roomId, uuid, name, index) => {
        if(roomId === ROOM_ID && uuid !== USER_ID){
            createEmojiTag(name, index);
        }
    })
}

let createEmojiTag = async (userName, gifIndex) => {
    let fileName = "";
    let beeSize = "";
    let name;
    let uuidToken = uuid();
    gifIndex === 0 ? fileName = "good" :
    gifIndex === 1 ? fileName = "heart" :
    gifIndex === 2 ? fileName = "laugh" :
    gifIndex === 3 ? fileName = "shock" : (fileName = "bee", beeSize="transform: scale(1.3);");
    
    name = userName === USER_NAME ? "你" : userName

    let html = `
    <div class="solo-emoji" id="emoji-${uuidToken}" style="left: ${randomInt(0, 180)}px; top: ${randomInt(0, 15)}px;}">
        <div class="emoji-gif" style="background-image: url('/public/images/emoji-${fileName}.gif'); ${beeSize}"></div>
        <div class="emoji-name">${name}</div>
    </div>
    `;
    emojiAniWrapper.insertAdjacentHTML("beforeend", html);

    document.styleSheets[0].insertRule(`\
            @keyframes emojiRun {\
                0%{opacity: 0; transform: translateY(0);}\
                15%{opacity: 1;}\
                85%{opacity: 1;}\
                100%{opacity: 0;transform: translateY(${randomInt(-300, -400)}px);}\
			}`
		);
	let div = document.querySelector(`#emoji-${uuidToken}`);
	div.style.animation = `emojiRun ${randomInt(4, 5)}s both linear`;
    setTimeout(()=>{
        div.remove();
    }, 5500)
} 

let uuid =() => {
    let d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

let randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}


export default {
    rightIconsInit,
    getGroupInfo,
    assignNewAuth,
    searchUser,
    audioAni,
    reciprocalAnimation,
    gameStartTextSetting,
    createRecordBoard,
    emojiBtnInit,
}



