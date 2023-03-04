let setWaitingStatus = async (roomId, uuid, audioStatus, videoStatus) => {
    let response = await fetch(`/room/${roomId}/user/${uuid}`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "option": "bothStatus",
            "bothAudio": audioStatus,
            "bothVideo": videoStatus,
        })
    });
    let data = await response.json();
    // let response = await fetch(`/room/setWaitingStatus`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "uuid": uuid,
    //         "audioStatus": audioStatus,
    //         "videoStatus": videoStatus,
    //     })
    // });
    // let data = await response.json();
}

let getGameResult = async (roomId) => {
    let response = await fetch(`/game/${roomId}`);
    let data = await response.json();
    return data.data;
    // let response = await fetch(`/room/getGameResult`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
    // return data.data;
}

let resetAllUserGameClickFalse = async (roomId) => {
    let response = await fetch(`/game/${roomId}`, {
        method: "PATCH",
    });
    let data = await response.json();
    // let response = await fetch(`/room/resetAllUserGameClickFalse`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
}

let setUserStreamStatus = async (roomId, uuid, status, bool) => {
    // let response = await fetch(`/room/streamstatus`, {
    let body;
    if(status === "audio"){
        body = JSON.stringify({
            "option": "audioStatus",
            "videoOrAudio": bool,
        })
    }else if(status === "video"){
        body = JSON.stringify({
            "option": "videoStatus",
            "videoOrAudio": bool,
        })
    }
    let response = await fetch(`/room/${roomId}/user/${uuid}`, {
        method: "PATCH",
        // method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: body,
        // body: JSON.stringify({
            // "roomId": roomId,
            // "uuid": uuid,
            // "status": status,
            // "b": bool,
        // })
    });
    let data = await response.json();
}

let setRoomEnterToken = async (roomId) => {
    let response = await fetch(`/room/${roomId}/token`);
    let data = await response.json();
    // let response = await fetch(`/room/entertoken`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
}

let setBackRoomLeaveStatus = async (roomId, uuid) => {
    let response = await fetch(`/room/${roomId}/user/${uuid}`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "option": "leave",
            "leave": false,
        })
    });
    let data = await response.json();
    // let response = await fetch(`/room/setLeaveFalse`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "uuid": uuid,
    //     })
    // });
    // let data = await response.json();
}

let resetAuthData = async (roomId, uuid) => {
    let response = await fetch(`/chat/${roomId}/user/${uuid}`);
    let data = await response.json();
    if(data){
        return [data.newHost, data.chatOpen];
    }
    // let response = await fetch(`/room/checkAuthChange`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "uuid": uuid,
    //     })
    // });
    // let data = await response.json();
    // if(data){
    //     return [data.newHost, data.chatOpen];
    // }
}

let setRoomChatStatus = async (roomId, b) => {
    let response = await fetch(`/room/${roomId}/chat`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "chatOpen": b,
        })
    });
    let data = await response.json();
    // let response = await fetch(`/room/roomChatStatus`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "chatOpen": b,
    //     })
    // });
    // let data = await response.json();
}

let getRoomChatAndShare = async (roomId) => {
    let response = await fetch(`/room/${roomId}/chatAndShare`);
    let data = await response.json();
    if(data){
        return [data.chatOpen, data.screenShare];
    }
    // let response = await fetch(`/room/getRoomChatAndShare`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
    // if(data){
    //     return [data.chatOpen, data.screenShare];
    // }
}

let getRemoteUser = async (roomId, remoteUuid) => {
    // let response = await fetch(`/api/getremoteuser`, {
    let response = await fetch(`/room/${roomId}/user/${remoteUuid}`);
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "uuid": remoteUuid
    //     })
    // });
    let data = await response.json();
    if(data.data){
        return data.data;
    }
}

let insertMongoRoomData = async (roomId, uuid, audioStatus, videoStatus, auth, userName, userImg) => {
    // let response = await fetch(`/room/setusertoroom`, {
    let response = await fetch(`/room/${roomId}/user/${uuid}`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            // "roomId": roomId,
            // "uuid": uuid,
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
    // let response = await fetch(`/room/setLeaveTrueOrDeleteRoom`, {
    let response = await fetch(`/leave/${roomId}/user/${uuid}`, {
        method: "PATCH",
        // method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "auth": auth,
        })
    });
    let data = await response.json();
    return data.ok;
}

let refuseUserInRoom = async (roomId, uuid) => {
    // let response = await fetch(`/room/deleteUserArray`, {
    let response = await fetch(`/leave/${roomId}/user/${uuid}`, {
        method: "DELETE",
        headers: {
            "Content-Type":"application/json"
        },
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
    let response = await fetch(`/room/${roomId}/screen`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "screenShare": bool,
        })
    });
    let data = await response.json();
    // let response = await fetch(`/room/setScreenShareBool`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "screenShare": bool,
    //     })
    // });
    // let data = await response.json();
}

let sendUserSecToDB = async (roomId, uuid, sec, click) => {
    let response = await fetch(`/room/${roomId}/user/${uuid}`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "option": "game",
            "sec": sec,
            "gameClick": click,
        })
    });
    let data = await response.json();
    return data.data;
    // let response = await fetch(`/room/sendUserSecToDB`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "uuid": uuid,
    //         "sec": sec,
    //         "gameClick": click,
    //     })
    // });
    // let data = await response.json();
    // return data.data;
}

let checkIfAuthAlready = async (roomId) => {
    let response = await fetch(`/room/${roomId}/auth`);
    let data = await response.json();
    if(data){
        return [data.message, data.authUuid]
    }
    // let response = await fetch(`/room/checkAuth`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
    // if(data){
    //     return [data.message, data.authUuid]
    // }
}

let assignNewAuth = async (roomId, oldUuid, newUuid) => {
    let response = await fetch(`/room/${roomId}/auth`, {
        method: "PATCH",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "oldUuid": oldUuid,
            "newUuid": newUuid,
        })
    });
    let data = await response.json();
    // let response = await fetch(`/room/assignNewAuth`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //         "oldUuid": oldUuid,
    //         "newUuid": newUuid,
    //     })
    // });
    // let data = await response.json();
}

let getGroupInfo = async (roomId) => {
    let response = await fetch(`/room/${roomId}/users`);
    let data = await response.json();
    return [data.data, data.host];
    // let response = await fetch(`/room/${roomId}/users`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
    // return [data.data, data.host];
}

let checkRoomExist = async (roomId) => {
    let response = await fetch(`/room/${roomId}`);
    let data = await response.json();
    return data.exist;
    // let response = await fetch(`/room/checkroomexist`, {
    //     method: "POST",
    //     headers: {
    //         "Content-Type":"application/json"
    //     },
    //     body: JSON.stringify({
    //         "roomId": roomId,
    //     })
    // });
    // let data = await response.json();
    // return data.exist;
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
    assignNewAuth,
    getGroupInfo,
    checkRoomExist,
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