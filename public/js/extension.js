const userContainer = document.querySelector(".user-container");
const infoIcon =  document.querySelector(".fa-circle-info");
const infoIconBlock = document.querySelector(".icon-right-solo.ic-info");
const groupIcon =  document.querySelector(".fa-user-group");
const groupIconBlock = document.querySelector(".icon-right-solo.ic-group");
const chatIcon =  document.querySelector(".fa-message");
const chatIconBlock = document.querySelector(".icon-right-solo.ic-message");
const extensionBox = document.querySelector(".extension-box");
const info = document.querySelector(".info");
const group = document.querySelector(".group");
const chat = document.querySelector(".chat");
const exitIcon = document.querySelector(".exit");
const alertWrapper = document.querySelector(".client-alert");

const extensionDomLst = [info, group, chat];
const iconLst = [infoIcon, groupIcon, chatIcon];

let rightIconsInit = () => {

    infoIconBlock.onclick = () => {
        if(!infoIcon.classList.contains("clicked")){
            iconLst.forEach(icon => {
                if(icon === infoIcon){
                    icon.classList.add("clicked");
                }else{
                    icon.classList.remove("clicked");
                }
            })
            extensionDomLst.forEach(section => {
                if(section === info){
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
            infoIcon.classList.remove("clicked");
            setTimeout(() => {
                info.classList.remove("show");
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

    groupIconBlock.onclick = () => {
        if(!groupIcon.classList.contains("clicked")){
            iconLst.forEach(icon => {
                if(icon === groupIcon){
                    icon.classList.add("clicked");
                }else{
                    icon.classList.remove("clicked");
                }
            })
            extensionDomLst.forEach(section => {
                if(section === group){
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
            groupIcon.classList.remove("clicked");
            setTimeout(() => {
                group.classList.remove("show");
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
    
    chatIconBlock.onclick = () => {
        if(!chatIcon.classList.contains("clicked")){
            iconLst.forEach(icon => {
                if(icon === chatIcon){
                    icon.classList.add("clicked");
                }else{
                    icon.classList.remove("clicked");
                }
            })
            extensionDomLst.forEach(section => {
                if(section === chat){
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
            chatIcon.classList.remove("clicked");
            setTimeout(() => {
                chat.classList.remove("show");
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



export default {
    rightIconsInit,
    getGroupInfo,
}



