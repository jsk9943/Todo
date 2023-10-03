import { promises as fsPromises } from 'fs';
import path from 'path';

const storagePath = './share';
//쉐어 폴더가 미 존재 시 폴더 생성
const shareFolderExists = async () => {
    try {
        await fsPromises.access(storagePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.mkdir(storagePath);
        } else {
            throw error;
        }
    }
}
//쉐어 할 내용 파일 생성
const shareFileCreate = async (jsonData) => {
    try {
        await shareFolderExists();
        const filePath = path.join(storagePath, `${jsonData.shareID}.json`);
        let existingData = [];
        try {
            existingData = await fsPromises.readFile(filePath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fsPromises.writeFile(filePath, '[]');
                existingData = await fsPromises.readFile(filePath, 'utf-8');
            } else {
                throw error;
            }
        }
        if (existingData) {
            const existingJsonData = JSON.parse(existingData);
            const isDuplicate = existingJsonData.some(item =>
                item.loginId === jsonData.loginID && item.todoData.title === jsonData.todoData.title
            );
            if (!isDuplicate) {
                existingJsonData.push(jsonData);
                await fsPromises.writeFile(filePath, JSON.stringify(existingJsonData));
                return 'TODO_CREATE';
            } else {
                return 'TODO_EXIST';
            }
        } else {
            await fsPromises.writeFile(filePath, JSON.stringify(jsonData));
            return 'TODO_CREATE';
        }
    } catch (error) {
        throw error;
    }
}
//유저에 따른 쉐어파일에 데이터 유무 체크
const shareTodoExsits = async (loginId) => {
    try {
        await shareFolderExists();
        const filePath = path.join(storagePath, `${loginId}.json`);
        try {
            const readFile = await fsPromises.readFile(filePath, 'utf-8');
            const parsedData = JSON.parse(readFile);
            if (Array.isArray(parsedData) && parsedData.length === 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    } catch (error) {
        throw error;
    }
}
//유저에게 공유되어있는 쉐어파일 가져오기
const shareTodoRead = async (jsonData) => {
    try {
        await shareFolderExists();
        const filePath = path.join(storagePath, `${jsonData.loginID}.json`);
        try {
            const readFile = await fsPromises.readFile(filePath, 'utf-8');
            const parsedData = JSON.parse(readFile);
            return parsedData;
        } catch (error) {
            return "SHARE_TODO_READ_FAIL";
        }
    } catch (error) {
        throw error;
    }
}
//공유된 쉐어데이터에서 선택한 쉐어데이터 삭제하기
const shareTodoImportAndDelete = async(loginID, jsonData) => {
    try {
        const filePath = path.join(storagePath, `${loginID}.json`);
        try {
            const readFile = await fsPromises.readFile(filePath, 'utf-8');
            let parsedData = JSON.parse(readFile);
            parsedData = parsedData.filter((item, index) => !jsonData.includes(index.toString()));
            await fsPromises.writeFile(filePath, JSON.stringify(parsedData, null, 2), 'utf-8');
            return "TODO_DELETE_SUCCESS";
        } catch (error) {
            return "TODO_DELETE_FAIL";
        }
    } catch (error) {
        throw error;
    }
}

export { shareFileCreate, shareTodoExsits, shareTodoRead, shareTodoImportAndDelete };