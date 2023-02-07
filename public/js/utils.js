const userContainer = document.querySelector(".user-container");
const infoIcon =  document.querySelector(".fa-circle-info");
const infoIconBlock = document.querySelector(".icon-right-solo.ic-info");
const messageIcon =  document.querySelector(".fa-message");
const messageIconBlock = document.querySelector(".icon-right-solo.ic-message");
const extensionBox = document.querySelector(".extension-box");
const chat = document.querySelector(".chat");
const info = document.querySelector(".info");
const exitIcon = document.querySelector(".exit");

const iconLst = [infoIcon, messageIcon];

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

let rightIconsInit = () => {

    infoIconBlock.onclick = () => {
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
    
    messageIconBlock.onclick = () => {
        if(!messageIcon.classList.contains("clicked")){
            messageIcon.classList.add("clicked");
            infoIcon.classList.remove("clicked");
            chat.classList.add("chat-show");
            info.classList.remove("info-show");
            if(!extensionBox.classList.contains("show")){
                extensionBox.classList.add("show");
                setTimeout(() => {
                    userContainer.classList.add("go-left");
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

    exitIcon.onclick = () => {
        iconLst.forEach(dom => {
            dom.classList.remove("clicked");
        })
        extensionBox.classList.remove("show");
        setTimeout(() => {
            userContainer.classList.remove("go-left");
        }, 100);

    }
}


export default {
    auth,
    checkIfAuthAlready,
    generateShortLink,
    rightIconsInit,
}