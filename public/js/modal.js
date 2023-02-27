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

export default {
    setWaitingStatus,
}