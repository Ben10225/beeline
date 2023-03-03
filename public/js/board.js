let boardInit = async (socketDraw) => {
    let canvas = document.querySelector("#canvas");

    canvas.width = 1000;
    canvas.height = 600;
    
    let ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    
    let x;
    let y;
    let mouseDown = false;
    let color = "black";
    let lineWidth = 5;
    let storage = [];
    
    canvas.onmousedown = () => {
        ctx.moveTo(x, y);
        // socketDraw.emit("down", ROOM_ID, USER_ID, x, y);
        mouseDown = true;
    }
    
    canvas.onmouseup = () => {
        ctx.beginPath();
        mouseDown = false;
        socketDraw.emit("up", ROOM_ID, USER_ID, storage, color, lineWidth);
        storage = [];
    }

    socketDraw.on("onup", (roomId, uuid, lst, c, w) => {
        if(roomId === ROOM_ID && uuid !== USER_ID){
        // if(roomId === ROOM_ID){
            if(!mouseDown){
                let utx = canvas.getContext("2d");
                utx.lineCap = "round";
                utx.strokeStyle = c;
                utx.lineWidth = w;
    
                lst.forEach(position => {
                    utx.lineTo(position[0], position[1]);
                    utx.stroke();
                })
                utx.beginPath();
            }else{
                let checkUserDrawer = setInterval(() => {
                    if(!mouseDown){
                        let utx = canvas.getContext("2d");
                        utx.lineCap = "round";
                        utx.strokeStyle = c;
                        utx.lineWidth = w;
            
                        lst.forEach((position, index) => {
                            utx.lineTo(position[0], position[1]);
                            utx.stroke();
                        })
                        utx.beginPath();
                        clearInterval(checkUserDrawer)
                    }
                }, 100)
            }


            // let udx = canvas.getContext("2d");
            // udx.lineCap = "round";
            // udx.strokeStyle = c;
            // udx.lineWidth = w;
            // lst.forEach(position => {
            //     udx.lineTo(position.x, position.y);
            //     // udx.stroke();
            // })
            
        }
    })
    
    socketDraw.on("ondraw", (roomId, uuid, x, y, c, w) => {
        // console.log(x, y)
        if(roomId === ROOM_ID && uuid !== USER_ID){
        // if(roomId === ROOM_ID){
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.lineTo(x, y);
        }
    })
    
    socketDraw.on("ondown", (roomId, uuid, x, y) => {
        if(roomId === ROOM_ID && uuid !== USER_ID){
            ctx.moveTo(x, y);
            ctx.beginPath();
        }
    })
    
    socketDraw.on("onreflash", (roomId, uuid) => {
        if(roomId === ROOM_ID && uuid !== USER_ID){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        }
    })
    
    socketDraw.on('user-connected', async uuid => {
        console.log(`drawer user ${uuid} enter room ${ROOM_ID}`);
    })
    
    canvas.onmousemove = (e) => {
        let rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    
        if(mouseDown){
            // socketDraw.emit("draw", ROOM_ID, USER_ID, x, y, color, lineWidth);
            storage.push([x, y]);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
    
    const btnRed = document.querySelector(".bd-color.red");
    const btnYellow = document.querySelector(".bd-color.yellow");
    const btnGreen = document.querySelector(".bd-color.green");
    const btnBlue = document.querySelector(".bd-color.blue");
    const btnPurple = document.querySelector(".bd-color.purple");
    const btnBlack = document.querySelector(".bd-color.black");
    const btnWhite = document.querySelector(".fa-eraser");
    
    let colorBtns = [btnRed, btnYellow, btnGreen, btnBlue, btnPurple, btnBlack, btnWhite];
    
    const cursor = document.querySelector(".cursor2");
    colorBtns.forEach((btn, index)=> {
        btn.onclick = () => {
            btn.classList.add("selected");
            colorBtns.forEach((b, j) => {
                index !== j && b.classList.remove("selected");
            })
            if(btn === btnRed){
                color = "rgb(211, 38, 26)";
                cursor.style.backgroundColor = `rgb(211, 38, 26)`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnYellow){
                color = "rgb(249, 216, 50)";
                cursor.style.backgroundColor = `rgb(249, 216, 50)`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnGreen){
                color = "green";
                cursor.style.backgroundColor = `green`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnBlue){
                color = "rgb(0, 76, 255)";
                cursor.style.backgroundColor = `rgb(0, 76, 255)`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnPurple){
                color = "rgb(167, 23, 167)";
                cursor.style.backgroundColor = `rgb(167, 23, 167)`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnBlack){
                color = "#000";
                cursor.style.backgroundColor = `#000`;
                cursor.classList.remove("erase-style");
            }else if(btn === btnWhite){
                color = "#fff";
                cursor.style.backgroundColor = `#fff`;
                cursor.classList.add("erase-style");
            }
            ctx.beginPath();
        }
    })
    
    const reflash = document.querySelector(".fa-trash");
    reflash.onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        socketDraw.emit("reflash", ROOM_ID, USER_ID);
    }
    
    const input = document.querySelector("#boardW");
    const widthSpan = document.querySelector(".width-px");
    input.addEventListener("input", ()=>{
        if(color !== "#fff"){
            cursor.style = `
            width: ${parseInt(input.value)+10}px;
            height: ${parseInt(input.value)+10}px;
            background-color: ${color};
            `;
            cursor.classList.remove("erase-style");
        }else{
            cursor.style = `
            width: ${parseInt(input.value)+10}px;
            height: ${parseInt(input.value)+10}px;
            `;
            cursor.classList.add("erase-style");
        }
        widthSpan.textContent = input.value;
        lineWidth = parseInt(input.value);
        ctx.beginPath();
    })
    
    let cursorinner = document.querySelector('.cursor2');
    canvas.addEventListener('mousemove', function(e){
        var x = e.clientX;
        var y = e.clientY;
        cursorinner.style.left = x + 'px';
        cursorinner.style.top = y + 'px';
    });
    
    const exit = document.querySelector(".white-board-exit");
    exit.onclick = () => {
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.beginPath();
        document.querySelector("#white-board-block").classList.remove("show");
    }
}

export default {
    boardInit,
}