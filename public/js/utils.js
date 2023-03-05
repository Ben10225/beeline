import modal from "./modal.js"

let auth = async (page) => {
    let response = await fetch(`/api/auth`);
    let data = await response.json();
    if(page === "index" && data.ok){
        setTimeout(() => {
            document.querySelector(".loading").remove();
            document.querySelector("#sign-wrapper").style = "opacity: 0; visibility: hidden; pointer-events: none;"
            document.querySelector(".user-info").classList.add("show");
        }, 600)
        let firstLetter = data.data.name[0];
        document.querySelector(".auto-img h3").textContent = firstLetter;
        if(data.data.imgUrl[0] === "#"){
            document.querySelector(".img-bg").style = `background-color: ${data.data.imgUrl};`;
        }else{
            document.querySelector(".img-bg").style = `
                background-image: url('${data.data.imgUrl}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
            `;
            document.querySelector("#img-first-name").remove();
        }
        document.querySelector(".username").textContent = data.data.name;
        document.querySelector(".stream").onclick = () => {
            goStream();
        }
    }else if(page === "index" && data.error){
        setTimeout(() => {
            document.querySelector(".loading").remove();
            document.querySelector("#sign-wrapper").style = `opacity: 1; visibility: visible;`;
        }, 600)
    }
    if(page === "room" && data.ok){
        let res = data.data;
        return res
    }else if(page === "room" && data.error){
        window.location = "/";
    }
}

let goStream = async () => {
    let roomId;
    while(true){
        roomId = makeRoomId();
        let roomExist = await modal.checkRoomExist(roomId);
        if (!roomExist) break;
    }
    window.open(`/${roomId}?auth=0`, '_self');
}

let makeRoomId = () => {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    let shortLength = [2, 3, 4];
    for(let i=0; i<3; i++){
        let l1 = Math.floor(Math.random() * shortLength.length);
        for(let j=0; j<shortLength[l1]; j++){
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        result += "-"
    }
    result = result.slice(0,-1);
    return result;
}

let generateShortLink = async () => {
    let currentUrl = window.location.href.split("?")[0];
    document.querySelector(".copy-link-txt").textContent = currentUrl;
    const copyBlock = document.querySelector(".copy-block");
    copyBlock.addEventListener("click", ()=>{
        copyContent(currentUrl);
        copyBlock.style.opacity = "0.5";
        setTimeout(()=>{
            copyBlock.style.opacity = "1";
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

let resizeClassListModify = (lst, status) => {
    if(status === "normal"){
        lst.forEach(item => {
            item.classList.remove("smaller");
            item.classList.remove("smallest");
        })
    }
    else if(status === "smaller"){
        lst.forEach(item => {
            item.classList.add("smaller");
            item.classList.remove("smallest");
        })
    }
    else if(status === "smallest"){
        lst.forEach(item => {
            item.classList.remove("smaller");
            item.classList.add("smallest");
        })
    }
}

let settingVideoSize = () => {
    const videoStream = document.querySelector("#video-streams");
    const containerWrapper = document.querySelector(".user-container");
    let videoContainerS = document.querySelectorAll(".video-container");
    let imgBgS = document.querySelectorAll(".img-bg");
    let microAniBlockS = document.querySelectorAll(".micro-ani-block");
    let userNameBlockS = document.querySelectorAll(".username-wrapper-room");
    let microStopIconS = document.querySelectorAll(".micro-status-icon");
    let screenShareNow = document.querySelector("#screen-wrapper");

    if(screenShareNow){
        videoStream.style.gridTemplateColumns =  "80% 20%";
    }else{
        videoStream.style.gridTemplateColumns =  "1fr";
    }

    if(videoContainerS.length == 1){
        containerWrapper.style.gridTemplateColumns = "1fr";

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 2 / 3);
                max-height: 80vh;
            `;
        })
        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "normal");
            resizeClassListModify(microAniBlockS, "normal");
            resizeClassListModify(userNameBlockS, "normal");
            resizeClassListModify(microStopIconS, "normal");
        }
    }
    else if(videoContainerS.length == 2){
        containerWrapper.style.gridTemplateColumns = "1fr 1fr";
        if (screenShareNow) containerWrapper.style.gridTemplateColumns = "1fr";

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 85vh;
            `;
        })
        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "normal");
            resizeClassListModify(microAniBlockS, "normal");
            resizeClassListModify(userNameBlockS, "normal");
            resizeClassListModify(microStopIconS, "normal");
        }
    }
    else if(videoContainerS.length == 3 || videoContainerS.length == 4){
        containerWrapper.style.gridTemplateColumns = "1fr 1fr";
        if (screenShareNow) containerWrapper.style.gridTemplateColumns = "1fr";

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 40vh;
            `;
        })
        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "normal");
            resizeClassListModify(microAniBlockS, "normal");
            resizeClassListModify(userNameBlockS, "normal");
            resizeClassListModify(microStopIconS, "normal");
        }
    }
    else if(videoContainerS.length == 5 || videoContainerS.length == 6){
        containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr";
        if(screenShareNow){
            containerWrapper.style.gridTemplateColumns = "1fr 1fr";
            videoStream.style.gridTemplateColumns =  "80% 40%";
        }

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 40vh;
            `;
        })
        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "normal");
            resizeClassListModify(microAniBlockS, "normal");
            resizeClassListModify(userNameBlockS, "normal");
            resizeClassListModify(microStopIconS, "normal");
        }
    }
    else if(videoContainerS.length >= 7 && videoContainerS.length <= 9){
        containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr";
        if(screenShareNow){
            containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr";
            videoStream.style.gridTemplateColumns =  "80% 40%";
        }

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 25vh;
            `;
        })

        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "normal");
            resizeClassListModify(microAniBlockS, "normal");
            resizeClassListModify(userNameBlockS, "normal");
            resizeClassListModify(microStopIconS, "normal");
        }
    }
    else if(videoContainerS.length >= 10 && videoContainerS.length <= 16){
        containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr 1fr";
        if(screenShareNow){
            containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr";
            videoStream.style.gridTemplateColumns =  "80% 40%";
        }

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 19vh;
            `;
        })
        if(screenShareNow !== null){
            resizeClassListModify(imgBgS, "smallest");
            resizeClassListModify(microAniBlockS, "smallest");
            resizeClassListModify(userNameBlockS, "smallest");
            resizeClassListModify(microStopIconS, "smallest");
        }else{
            resizeClassListModify(imgBgS, "smaller");
            resizeClassListModify(microAniBlockS, "smaller");
            resizeClassListModify(userNameBlockS, "smaller");
            resizeClassListModify(microStopIconS, "smaller");
        }
    }
    else{
        containerWrapper.style.gridTemplateColumns = "16% 16% 16% 16% 16% 16%";
        if(screenShareNow){
            containerWrapper.style.gridTemplateColumns = "1fr 1fr 1fr";
            videoStream.style.gridTemplateColumns =  "80% 40%";
        }

        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 15vh;
            `;
        })
        resizeClassListModify(imgBgS, "smallest")
        resizeClassListModify(microAniBlockS, "smallest")
        resizeClassListModify(userNameBlockS, "smallest")
        resizeClassListModify(microStopIconS, "smallest")
    }
}

let testResize = () => {
    let player = 
    `
        <div class="video-container">
        <div class="username-wrapper-room local">
            <span class="user-name">你</span>
        </div>
        <div class="video-player" id="user-">
            <div class="micro-ani-block">
                <div class="dot d-left"></div>
                <div class="dot d-middle"></div>
                <div class="dot d-right"></div>
            </div>
            <div class="micro-status-icon local"></div>
            <div class="user-block local show">
                <div class="auto-img">
                    <div class="img-bg" style="background-color: #FE981C">
                        <h3>p</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `

    document.querySelector(".user-container").insertAdjacentHTML("beforeend", player);
    settingVideoSize();
}

let playAudio = (url, volume) => {
    const URL = url;
      
    const context = new AudioContext();
    window.fetch(URL)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            play(context, audioBuffer, volume);
        });
      
}

let play = (context, audioBuffer, volume) => {
    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = context.createGain()
    gainNode.gain.value = volume
    gainNode.connect(context.destination)

    source.connect(gainNode);
    source.start();
}

let createCopyBlock = () => {
    let currentUrl = window.location.href.split("?")[0];
    let html = `
    <div class="meeting-url-wrapper">
        <i class="fa-solid fa-xmark"></i>
        <h2 class="meeting-url-title">會議已準備就緒</h2>
        <p class="meeting-url-content"> 你可以將這個會議連結分享給想邀請加入會議的對象，
            經過室長同意即可進入會議。
        </p>
        <div class="meeting-url-copy-block">
            <p>${currentUrl}</p>
            <i class="fa-regular fa-copy"></i>
            <i class="fa-solid fa-check disappear"></i>
        </div>
    </div>
    `;
    document.querySelector(".emoji-ani-wrapper").insertAdjacentHTML("afterend", html);

    document.querySelector(".meeting-url-wrapper .fa-xmark").onclick = () =>{
        let xBtn = document.querySelector(".meeting-url-wrapper");
        xBtn.classList.add("fadeout");
        setTimeout(() => {
            xBtn.remove();
        }, 600)
    }

    const copyIcon = document.querySelector(".meeting-url-wrapper .fa-copy");
    const checkIcon = document.querySelector(".meeting-url-wrapper .fa-check");
    copyIcon.onclick = () => {
        copyContent(currentUrl);
        copyIcon.classList.add("disappear");
        checkIcon.classList.remove("disappear");
        setTimeout(() => {
            copyIcon.classList.remove("disappear");
            checkIcon.classList.add("disappear");
        }, 1500)
    }
}  
  
let setRoomId = () => {
    document.querySelector(".room-id").textContent = ROOM_ID;
}

export default {
    auth,
    generateShortLink,
    settingVideoSize,
    playAudio,
    createCopyBlock,
    setRoomId,
    testResize,
}



