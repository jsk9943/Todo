import { promises as fsPromises } from 'fs';
import path from 'path';

const memberPath = './member';
// 초기에 맴버 폴더 여부 확인
const memberFolderExists = async () => {
    try {
        await fsPromises.access(memberPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.mkdir(memberPath);
        } else {
            throw error;
        }
    }
}
// 신규회원 가입 처리
const newMember = async (jsonData) => {
    try {
        const filePath = path.join(memberPath, `${jsonData.signupId}.json`);
        const newMemberData = JSON.stringify([
            {
                "USER_ID": jsonData.signupId
            },
            {
                "USER_PW": jsonData.signupPw
            },
            {
                "SESSION_KEY": ""
            },
            {
                "SESSION_EXPIRED": ""
            }
        ]);
        await fsPromises.writeFile(filePath, newMemberData, 'utf-8');
    } catch (error) {
        throw error;
    }
}
// 토큰 키값 랜덤 생성 기능
const generateRandomToken = (length) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        token += charset[randomIndex];
    }
    return token;
}
//만료시간 30분씩 연장 기능
const expireTimeExtension = async () => {
    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 30);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const extensionDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return extensionDateTime;
}
// 유저 존재여부 확인
const memberExist = async (loginID) => {
    memberFolderExists();
    try {
        const files = await fsPromises.readdir(memberPath);
        for (const file of files) {
            const fileName = file.split('.')[0];
            if (fileName === loginID) {
                return file;
            }
        }
        return false;
    } catch (error) {
        throw error;
    }
}
// 유저 로그인 절차
const memberLoginProcess = async (jsonData) => {
    try {
        const resultFile = await memberExist(jsonData.loginID);
        if (resultFile === false) {
            return "ID_INCORRECT";
        } else {
            const filePath = path.join(memberPath, resultFile);
            const fileData = await fsPromises.readFile(filePath, 'utf-8');
            const userData = JSON.parse(fileData);
            if (userData && userData[1] && userData[1]["USER_PW"] === jsonData.loginPW) {
                const tokenLength = Math.floor(Math.random() * (100 - 40 + 1)) + 40;
                const randomToken = generateRandomToken(tokenLength);
                const currentDateTime = await expireTimeExtension();
                userData[2] = { "SESSION_KEY": randomToken };
                userData[3] = { "SESSION_EXPIRED": currentDateTime };
                const updatedFileData = JSON.stringify(userData, null, 4);
                await fsPromises.writeFile(filePath, updatedFileData, 'utf-8');
                const returnData = {
                    randomToken,
                    currentDateTime
                }
                return returnData;
            } else {
                return "PW_INCORRECT";
            }
        }
    } catch (error) {
        throw error;
    }
}
// 새션 만료시간 체크 후 만료되지 않았으면 30분씩 연장
const validityConfirm = async (jsonData) => {
    try {
        if (!Object.keys(jsonData).length) {
            return false;
        }
        const validityFile = await memberExist(jsonData.cookieID);
        const filePath = path.join(memberPath, validityFile);
        const fileData = await fsPromises.readFile(filePath, 'utf-8');
        const userData = JSON.parse(fileData);
        if (userData[2].SESSION_KEY !== jsonData.cookieToken) {
            return false;
        }
        const sessionExpired = new Date(userData[3].SESSION_EXPIRED);
        const currentServerTime = new Date();
        if (sessionExpired <= currentServerTime) {
            return false;
        }
        const currentDateTime = await expireTimeExtension();
        userData[3] = { "SESSION_EXPIRED": currentDateTime };
        const updatedFileData = JSON.stringify(userData, null, 4);
        await fsPromises.writeFile(filePath, updatedFileData, 'utf-8');
        return true;
    } catch (error) {
        throw error;
    }
}

const memberLogoutProcess = async (cookieData) => {
    const loginId = cookieData.token.loginID;
    const token = cookieData.token.token;
    try {
        const validityFile = await memberExist(loginId);
        const filePath = path.join(memberPath, validityFile);
        const fileData = await fsPromises.readFile(filePath, 'utf-8');
        const userData = JSON.parse(fileData);
        if (userData[2].SESSION_KEY === token) {
            userData[3] = { "SESSION_EXPIRED": "1900-01-01 00:00:00" };
            const updatedFileData = JSON.stringify(userData, null, 4);
            await fsPromises.writeFile(filePath, updatedFileData, 'utf-8');
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

export { memberLoginProcess, validityConfirm, memberExist, newMember, memberLogoutProcess };