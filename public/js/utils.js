
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
    let roomId
    while(true){
        roomId = makeRoomId();
        let roomExist = await checkRoomExist(roomId);
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

let checkRoomExist = async (roomId) => {
    let response = await fetch(`/room/checkroomexist`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
        })
    });
    let data = await response.json();
    return data.exist;
}

let checkIfAuthAlready = async (roomId) => {
    let response = await fetch(`/room/checkAuth`, {
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
        return [data.message, data.authUuid]
    }
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

let settingVideoSize = () => {
    const videoStreams = document.querySelector("#video-streams");
    const containerWrapper = document.querySelector(".user-container");
    let videoContainerS = document.querySelectorAll(".video-container");

    if(videoContainerS.length == 1){
        // containerWrapper.style.gridTemplateColumns = "1fr";
        containerWrapper.style.flexWrap = "nowrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 80%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
            `;
        })
    }else if(videoContainerS.length == 2){
        containerWrapper.style.flexWrap = "nowrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 50%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
            `;
        })
    }else if(videoContainerS.length == 3 || videoContainerS.length == 4){
        containerWrapper.style.flexWrap = "wrap";
        videoContainerS.forEach(container => {
            container.style = `
                width: 35%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
                max-height: 100%;
            `;
        })
        let imgBgS = document.querySelectorAll(".img-bg");
        imgBgS.forEach(img => {
            img.classList.remove("smaller");
        })
    }
    else if(videoContainerS.length >= 5 || videoContainerS.length <= 9){
        containerWrapper.style.flexWrap = "wrap";
        videoContainerS.forEach(container => {
            container.style = `
            width: 25%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
            `;
        })
        let imgBgS = document.querySelectorAll(".img-bg");
        imgBgS.forEach(img => {
            img.classList.add("smaller");
        })
    }
    else if(videoContainerS.length >= 10){
        containerWrapper.style.flexWrap = "wrap";
        videoContainerS.forEach(container => {
            container.style = `
            width: 20%;
            `;
        })
        let containerWidth = document.querySelector(".video-container").offsetWidth;
        videoContainerS.forEach(container => {
            container.style = `
                height: calc(${containerWidth}px * 3 / 4);
            `;
        })
        let imgBgS = document.querySelectorAll(".img-bg");
        imgBgS.forEach(img => {
            img.classList.add("smaller");
        })
    }
}

let setScreenShareBool = async (roomId, bool) => {
    let response = await fetch(`/room/setScreenShareBool`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "screenShare": bool,
        })
    });
    let data = await response.json();
}

let sendUserSecToDB = async (roomId, uuid, sec, click) => {
    let response = await fetch(`/room/sendUserSecToDB`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "sec": sec,
            "gameClick": click,
        })
    });
    let data = await response.json();
    return data.data;
}

let checkUserLeaveFalse = async (roomId, uuid) => {
    let response = await fetch(`/room/checkUserLeaveFalse`, {
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
    return data.data;
}

let getGameResult = async (roomId) => {
    let response = await fetch(`/room/getGameResult`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
        })
    });
    let data = await response.json();
    return data.data;
}


let playAudio = (url, volume) => {
    const URL = url;
      
    const context = new AudioContext();
    // const playButton = document.querySelector('#play');
  
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
  

    


export default {
    auth,
    checkIfAuthAlready,
    generateShortLink,
    settingVideoSize,
    setScreenShareBool,
    sendUserSecToDB,
    getGameResult,
    checkUserLeaveFalse,
    playAudio,
    createCopyBlock,
}



