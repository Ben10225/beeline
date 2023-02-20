
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
        videoContainerS.forEach(container => {
            container.style = `
            width: 5%;
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

let sendUserSecToDB = async (roomId, uuid, sec) => {
    let response = await fetch(`/room/sendUserSecToDB`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "sec": sec,
        })
    });
    let data = await response.json();
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



export default {
    auth,
    checkIfAuthAlready,
    generateShortLink,
    settingVideoSize,
    setScreenShareBool,
    sendUserSecToDB,
    getGameResult,
    checkUserLeaveFalse,
}



