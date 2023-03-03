let setWaitingStatus = async (roomId, uuid, audioStatus, videoStatus) => {
    let response = await fetch(`/room/setWaitingStatus`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "roomId": roomId,
            "uuid": uuid,
            "audioStatus": audioStatus,
            "videoStatus": videoStatus,
        })
    });
    let data = await response.json();
}

let resetAllUserGameClickFalse = async (roomId) => {
    let response = await fetch(`/room/resetAllUserGameClickFalse`, {
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

let getRoomChatAndShare = async (roomId) => {
    let response = await fetch(`/room/getRoomChatAndShare`, {
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
        return [data.chatOpen, data.screenShare];
    }
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
        return data.data;
    }
}

let insertMongoRoomData = async (roomId, uuid, audioStatus, videoStatus, auth, userName, userImg) => {
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
            "name": userName,
            "imgUrl": userImg,
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
    return data.message;
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

export default {
    setWaitingStatus,
    resetAllUserGameClickFalse,
    setUserStreamStatus,
    setRoomEnterToken,
    setBackRoomLeaveStatus,
    resetAuthData,
    setRoomChatStatus,
    getRoomChatAndShare,
    getRemoteUser,
    insertMongoRoomData,
    setLeaveTrueOrDeleteRoom,
    refuseUserInRoom,
    checkNeedReconnect,
    setScreenShareBool,
    sendUserSecToDB,
    getGameResult,
    checkIfAuthAlready,
}

/*
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
*/