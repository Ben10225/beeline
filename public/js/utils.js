let auth = async (page) => {
    let response = await fetch(`/api/auth`);
    let data = await response.json();
    // if(page === "index"){

    // }
    if(page === "index" && data.ok){
        setTimeout(() => {
            document.querySelector(".loading").remove();
            document.querySelector("#sign-wrapper").style = "opacity: 0; visibility: hidden; pointer-events: none;"
            document.querySelector(".user-info").classList.add("show");
        }, 600)
        let firstLetter = data.data.name[0];
        document.querySelector(".auto-img h3").textContent = firstLetter;
        document.querySelector(".img-bg").style = `background-color: ${data.data.imgUrl};`;
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
    let room = makeRoomId()
    window.open(`/${room}`, '_self');
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

export default {
    auth,
}