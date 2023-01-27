const signWrapper = document.querySelector(".sign-wrapper");
const signinSelect = document.querySelector(".signin-select");
const signupSelect = document.querySelector(".signup-select");
const stream = document.querySelector(".stream");
const signoutBtn = document.querySelector(".signout");

const formSignin = document.querySelector("#form-signin");
const inputEmailSignin = document.querySelector("#input-email-signin");
const inputPwdSignin = document.querySelector("#input-pwd-signin");
const signinBtn = document.querySelector("#signin-btn");
const pwdRoleSignin = document.querySelector("#form-signin .pwd-role");
const roleSignin = document.querySelector(".role.signin");
const signinCaution = document.querySelector(".caution.signin");

const formSignup = document.querySelector("#form-signup");
const inputName = document.querySelector("#input-name");
const inputEmail = document.querySelector("#input-email");
const inputPwd = document.querySelector("#input-pwd");
const inputPwdCertain = document.querySelector("#input-pwd-certain");
const pwdRoleSignup = document.querySelector("#form-signup .pwd-role");
const roleSignup = document.querySelector(".role.signup");
const signupBtn = document.querySelector("#signup-btn");
const signupCaution = document.querySelector(".caution.signup");
const submitFormField = document.querySelector(".form-field.submit");


// regex
const EmailPattern = /^\S+@\S+$/;
const PwdPattern = /^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z><?@+'`~^%&\*\[\]\{\}.!#|\\\"$';,:;=/\(\),\-\w\s+]{8,}$/;
const roleLength = /^[0-9a-zA-Z><?@+'`~^%&\*\[\]\{\}.!#|\\\"$';,:;=/\(\),\-\w\s+]{8,}$/;
const roleNumber = /^(?=.*\d)[0-9a-zA-Z><?@+'`~^%&\*\[\]\{\}.!#|\\\"$';,:;=/\(\),\-\w\s+]{1,}$/;
const roleEnglish = /^(?=.*[a-z])[0-9a-zA-Z><?@+'`~^%&\*\[\]\{\}.!#|\\\"$';,:;=/\(\),\-\w\s+]{1,}$/;

let inputResult = [0, 0];
let result = [0, 0, 0, 0];


let signTwoBlockButtonInit = () => {
    signinSelect.onclick = () => {
        signinSelect.classList.add("show");
        signupSelect.classList.remove("show");
        formSignin.classList.add("show-block");
        formSignup.classList.remove("show-block");
    }
    signupSelect.onclick = () => {
        signupSelect.classList.add("show");
        signinSelect.classList.remove("show");
        formSignup.classList.add("show-block");
        formSignin.classList.remove("show-block");
    }
}

let checkEmailSignin = () => {
    let validatedEmail = EmailPattern.test(inputEmailSignin.value);

    if(!inputEmailSignin.value){
        inputEmailSignin.style = "border: 2px solid rgb(198, 202, 219);";
        inputResult[0] = 0;
        return
    }
    if(validatedEmail){
        inputEmailSignin.style = "border: 2px solid rgb(90, 178, 32);";
        inputResult[0] = 1;
    }else{
        inputEmailSignin.style = "border: 2px solid rgb(237, 30, 30);";
        inputResult[0] = 0;
    }
    signinBtnUp();
}

let checkPwdSignin = () => {
    let validatedPwd = PwdPattern.test(inputPwdSignin.value);

    let validatedLength = roleLength.test(inputPwdSignin.value);
    let validatedNumberIncloud = roleNumber.test(inputPwdSignin.value);
    let validatedEnglishIncloud = roleEnglish.test(inputPwdSignin.value);

    if(!inputPwdSignin.value){
        inputPwdSignin.style = "border: 2px solid rgb(198, 202, 219);";
        roleSignin.classList.remove("show");
        setTimeout(()=>{
            pwdRoleSignin.style = "height: 40px"
        }, 100)
        inputResult[1] = 0;
        return
    }

    if(validatedPwd){
        inputPwdSignin.style = "border: 2px solid rgb(90, 178, 32);";
        inputResult[1] = 1;
        setTimeout(()=>{
            roleSignin.classList.remove("show");
        }, 450)
        setTimeout(()=>{
            pwdRoleSignin.style = "height: 40px"
        }, 550)
    }else{
        inputPwdSignin.style = "border: 2px solid rgb(237, 30, 30);";
        pwdRoleSignin.style = "height: 100px";
        inputResult[1] = 0;
        setTimeout(()=>{
            roleSignin.classList.add("show");
        }, 50)
    }

    if(validatedLength){
        document.querySelector(".role-length.signin").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-length.signin").style = "color: #000; opacity: 0.2";
    }

    if(validatedNumberIncloud){
        document.querySelector(".role-number.signin").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-number.signin").style = "color: #000; opacity: 0.2";
    }

    if(validatedEnglishIncloud){
        document.querySelector(".role-english.signin").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-english.signin").style = "color: #000; opacity: 0.2";
    }
    signinBtnUp();
}


let signinBtnUp = () => {
    let ok =  inputResult.every(num => num === 1);
    if(ok){
        signinBtn.style = "opacity: 1; cursor: pointer; pointer-events: auto;";
    }else{
        signinBtn.style = "opacity: 0.3; cursor: default; pointer-events: none;";
    }
}


let signinsubmit = async (e) => {
    e.preventDefault();

    let ok =  inputResult.every(num => num === 1);
    if (!ok) return;

    let email = e.target.email_signin.value;
    let password = e.target.password_signin.value;

    let response = await fetch(`/api/signin`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "email": email,
            "password": password
        })
    });
    let data = await response.json();
    if(data.ok){
        window.location = "/";
    }
    if(data.error){
        inputEmailSignin.style = "border: 2px solid rgb(237, 30, 30);";
        inputPwdSignin.style = "border: 2px solid rgb(237, 30, 30);";

        signinCaution.style = "height: 30px; opacity: 1";
        signinCaution.textContent = data.message;

        setTimeout(()=>{
            signinCaution.style = "height: 0px; opacity: 0";
            inputEmailSignin.style = "border: 2px solid rgb(198, 202, 219);";
            inputPwdSignin.style = "border: 2px solid rgb(198, 202, 219);";
        }, 3000)
        setTimeout(()=>{
            signinCaution.textContent = "";
        }, 3500)
    }
}

let checkName = () => {
    if(!inputName.value){
        inputName.style = "border: 2px solid rgb(198, 202, 219);";
        result[0] = 0;
    }else{
        inputName.style = "border: 2px solid rgb(90, 178, 32);";
        result[0] = 1;
    }
    signupBtnUp();
}

let checkEmail = () => {
    let validatedEmail = EmailPattern.test(inputEmail.value);

    if(!inputEmail.value){
        inputEmail.style = "border: 2px solid rgb(198, 202, 219);";
        result[1] = 0;
        return
    }
    if(validatedEmail){
        inputEmail.style = "border: 2px solid rgb(90, 178, 32);";
        result[1] = 1;
    }else{
        inputEmail.style = "border: 2px solid rgb(237, 30, 30);";
        result[1] = 0;
    }
    signupBtnUp();
}

let checkPwd = () => {
    let validatedPwd = PwdPattern.test(inputPwd.value);

    let validatedLength = roleLength.test(inputPwd.value);
    let validatedNumberIncloud = roleNumber.test(inputPwd.value);
    let validatedEnglishIncloud = roleEnglish.test(inputPwd.value);

    if(!inputPwd.value){
        inputPwd.style = "border: 2px solid rgb(198, 202, 219);";
        roleSignup.classList.remove("show");
        setTimeout(()=>{
            pwdRoleSignup.style = "height: 40px"
        }, 100)
        result[2] = 0;
        return
    }

    if(validatedPwd){
        inputPwd.style = "border: 2px solid rgb(90, 178, 32);";
        result[2] = 1;
        setTimeout(()=>{
            roleSignup.classList.remove("show");
        }, 450)
        setTimeout(()=>{
            pwdRoleSignup.style = "height: 40px"
        }, 550)
    }else{
        inputPwd.style = "border: 2px solid rgb(237, 30, 30);";
        pwdRoleSignup.style = "height: 100px";
        result[2] = 0;
        setTimeout(()=>{
            roleSignup.classList.add("show");
        }, 50)
    }

    if(validatedLength){
        document.querySelector(".role-length.signup").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-length.signup").style = "color: #000; opacity: 0.2";
    }

    if(validatedNumberIncloud){
        document.querySelector(".role-number.signup").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-number.signup").style = "color: #000; opacity: 0.2";
    }

    if(validatedEnglishIncloud){
        document.querySelector(".role-english.signup").style = "color: rgb(95, 160, 123);opacity: 0.8";
    }else{
        document.querySelector(".role-english.signup").style = "color: #000; opacity: 0.2";
    }
    signupBtnUp();
}

let checkPwdCertain = () => {
    let pwd = inputPwd.value;
    let certainPwd = inputPwdCertain.value;

    if(!inputPwdCertain.value){
        inputPwdCertain.style = "border: 2px solid rgb(198, 202, 219);";
        result[3] = 0;
        return
    }

    if(pwd !== certainPwd){
        inputPwdCertain.style = "border: 2px solid rgb(237, 30, 30);";
        result[3] = 0;
    }else{
        inputPwdCertain.style = "border: 2px solid rgb(90, 178, 32);";
        result[3] = 1;
    }
    signupBtnUp();
}

let signupBtnUp = () => {
    let ok =  result.every(num => num === 1);
    if(ok){
        signupBtn.style = "opacity: 1; cursor: pointer; pointer-events: auto;";
    }else{
        signupBtn.style = "opacity: 0.3; cursor: default; pointer-events: none;";
    }
}


let signupSubmit = async (e) => {
    e.preventDefault();

    let ok =  result.every(num => num === 1);
    if (!ok) return;

    let name = e.target.name.value;
    let email = e.target.email.value;
    let password = e.target.password.value;

    let response = await fetch(`/api/signup`, {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "name": name,
            "email": email,
            "password": password
        })
    });
    let data = await response.json();
    if(data.ok){
        window.location = "/";
    }else if(data.error){
        if(data.message === "此信箱已存在"){
            inputEmail.style = "border: 2px solid rgb(237, 30, 30);";
            inputEmail.focus();
        }
        signupCaution.style = "height: 30px; opacity: 1";
        signupCaution.textContent = data.message;

        setTimeout(()=>{
            signupCaution.style = "height: 0px; opacity: 0";
        }, 3000)
        setTimeout(()=>{
            signupCaution.textContent = "";
        }, 3500)
    }
}


let signout = async () => {
    let response = await fetch(`/api/signout`);
    let data = await response.json();
    if(data.ok){
        window.location = "/";
    }
}


let goStream = async () => {
    let room = makeid();

    let response = await fetch(`/get_token/${room}`);
    let data = await response.json();

    let uid = data.uid;
    let token = data.token;
    let name = data.name;

    sessionStorage.setItem('uid', uid);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('room', room);
    sessionStorage.setItem('name', name);

    window.open(`/redirect/${room}`, '_self');
    // window.open(`/${room}`, '_self');
}


let makeid = () => {
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


let auth = async () => {
    let response = await fetch(`/api/auth`);
    let data = await response.json();
    if(data.ok){
        signWrapper.style = "opacity: 0; visibility: hidden; pointer-events: none;"
        document.querySelector(".user-info").classList.add("show");
        let firstLetter = data.data.name[0];
        document.querySelector(".auto-img h3").textContent = firstLetter;
        document.querySelector(".username").textContent = data.data.name;
        stream.onclick = () => {
            goStream();
        }
    }
}

auth();
signTwoBlockButtonInit();
inputEmailSignin.addEventListener("input", checkEmailSignin);
inputPwdSignin.addEventListener("input", checkPwdSignin);
formSignin.addEventListener("submit", signinsubmit);
signoutBtn.addEventListener("click", signout);

inputName.addEventListener("input", checkName);
inputEmail.addEventListener("input", checkEmail);
inputPwd.addEventListener("input", checkPwd);
inputPwdCertain.addEventListener("input", checkPwdCertain);
formSignup.addEventListener("submit", signupSubmit);
