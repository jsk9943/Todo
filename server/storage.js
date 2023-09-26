import { promises as fsPromises } from 'fs';
import path from 'path';

const storagePath = './storage';
//로컬 스토리지 폴더가 미 존재 시 폴더 생성
const storageFolderExists = async () => {
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
// 스토리지 폴더 안에 맴버todo 폴더가 미 존재 시 폴더 생성
const memberTodoFolderExists = async (loginID) => {
    await storageFolderExists();
    const memberFolderPath = `${storagePath}/${loginID}`;
    try {
        await fsPromises.access(memberFolderPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.mkdir(memberFolderPath);
        } else {
            throw error;
        }
    }
}
//월간 페이지 한줄 todo 불러오기
const todoMonthRead = async (month, loginID) => {
    await memberTodoFolderExists(loginID);
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const files = await fsPromises.readdir(folderPath);
        const dataObject = {};
        for (const file of files) {
            if (file.startsWith(month)) {
                const filePath = path.join(folderPath, file);
                const fileContents = await fsPromises.readFile(filePath, 'utf-8');
                const fileData = JSON.parse(fileContents);
                const dateKey = file.split('.')[0];
                if (!dataObject[dateKey]) {
                    dataObject[dateKey] = {};
                }
                for (const key in fileData) {
                    dataObject[dateKey][key] = `${fileData[key].todo} & ${fileData[key].state} & ${fileData[key].period}`;
                }
            }
        }
        return dataObject;
    } catch (error) {
        return error;
    }
}
//선택한 일자의 Todo 리스트 읽어오기
const todoRead = async (date, loginID) => {
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const filePath = path.join(folderPath, `${date}.json`);
        const todoContents = await fsPromises.readFile(filePath, 'utf-8');
        return JSON.parse(todoContents);
    } catch (error) {
        throw error;
    }
}
//이미 만들어져있는 todo의 존재여부 확인
const todoExists = async (date, loginID) => {
    const folderPath = `${storagePath}/${loginID}`;
    const files = await fsPromises.readdir(folderPath);
    for (const file of files) {
        if (file === `${date}.json`) {
            return file;
        }
    }
    return null;
}
//선택한 일자에 새로운 todo 만들기
const todoCreate = async (jsonData) => {
    const loginID = jsonData[Object.keys(jsonData).pop()].loginID;
    await memberTodoFolderExists(loginID);
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const date = jsonData[Object.keys(jsonData).pop()].selectedDate;
        const filePath = path.join(folderPath, `${date}.json`);
        if (await todoExists(date, loginID)) {
            for (const key in jsonData) {
                if (jsonData[key].hasOwnProperty('loginID')) {
                    delete jsonData[key].loginID;
                    delete jsonData[key].selectedDate;
                }
            }
            const existingData = await fsPromises.readFile(filePath, 'utf-8');
            const existingJsonData = JSON.parse(existingData);
            const newData = Object.assign(existingJsonData, jsonData);
            await fsPromises.writeFile(filePath, JSON.stringify(newData));
        } else {
            for (const key in jsonData) {
                if (jsonData[key].hasOwnProperty('loginID')) {
                    delete jsonData[key].loginID;
                    delete jsonData[key].selectedDate;
                }
            }
            await fsPromises.writeFile(filePath, JSON.stringify(jsonData));
        }
    } catch (error) {
        return error;
    }
}
//생성되어있는 todo 삭제
const todoDelete = async (jsonData) => {
    const loginID = jsonData.loginID;
    await memberTodoFolderExists(loginID);
    const date = jsonData.formattedDate;
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const existence = await todoExists(date, loginID);
        if (existence) {
            const filePath = path.join(folderPath, existence);
            const fileContents = await fsPromises.readFile(filePath, 'utf-8');
            const parsedData = JSON.parse(fileContents);
            const indexToDelete = jsonData.index;
            if (parsedData[indexToDelete]) {
                delete parsedData[indexToDelete];
                const updatedData = Object.values(parsedData).filter(Boolean);
                const renumberedData = updatedData.reduce((acc, item, index) => {
                    item.index = index;
                    acc[index] = item;
                    return acc;
                }, {});
                const updatedDataJSON = JSON.stringify(renumberedData, null, 2);
                await fsPromises.writeFile(filePath, updatedDataJSON, 'utf-8');
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        return error;
    }
}
//생성되어 있는 todo 수정
const todoModify = async (jsonData) => {
    const loginID = jsonData.loginID;
    await memberTodoFolderExists(loginID);
    const date = jsonData.formattedDate;
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const existence = await todoExists(date, loginID);
        if (existence) {
            const filePath = path.join(folderPath, existence);
            const fileContents = await fsPromises.readFile(filePath, 'utf-8');
            let todos = JSON.parse(fileContents);
            if (jsonData.title !== '') {
                todos[jsonData.index].todo = jsonData.title;
            }
            if (jsonData.startDate !== '' || jsonData.endDate !== '') {
                todos[jsonData.index].period = `${jsonData.startDate} ~ ${jsonData.endDate}`;
            }
            if (jsonData.content !== '') {
                todos[jsonData.index].content = jsonData.content;
            }
            await fsPromises.writeFile(filePath, JSON.stringify(todos, null, 2), 'utf-8');
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return error;
    }
}
//Todo 내용 날짜 이동
const moveTodoContents = async (jsonData) => {
    const loginID = jsonData.loginID;
    const index = jsonData.index;
    const currentDate = jsonData.currentDate;
    const moveDate = jsonData.moveDate;
    const folderPath = `${storagePath}/${loginID}`;
    const sourceFilePath = path.join(folderPath, `${currentDate}.json`);
    const moveFilePath = path.join(folderPath, `${moveDate}.json`);
    try {
        if (!(await fsPromises.access(moveFilePath).then(() => true).catch(() => false))) {
            await fsPromises.writeFile(moveFilePath, JSON.stringify({}), 'utf-8');
        }
        const sourceFileContents = await fsPromises.readFile(sourceFilePath, 'utf-8');
        const sourceData = JSON.parse(sourceFileContents);
        const todoToMove = sourceData[index];
        if (!todoToMove) {
            throw new Error;
        }
        delete sourceData[index];
        const sortedSourceData = {};
        let sortIndex = 0;
        for (const key in sourceData) {
            sortedSourceData[sortIndex.toString()] = sourceData[key];
            sortIndex++;
        }
        const cleanedSourceData = Object.keys(sortedSourceData).length === 0 ? {} : sortedSourceData;
        await fsPromises.writeFile(sourceFilePath, JSON.stringify(cleanedSourceData, null, 2), 'utf-8');
        const moveFileContents = await fsPromises.readFile(moveFilePath, 'utf-8');
        const moveData = JSON.parse(moveFileContents);
        const newIndex = Object.keys(moveData).length.toString();
        moveData[newIndex] = todoToMove;
        await fsPromises.writeFile(moveFilePath, JSON.stringify(moveData, null, 2), 'utf-8');
        return true;
    } catch (error) {
        return error;
    }
}
// todo 상태 수정
const todoStateChange = async (jsonData) => {
    const loginID = jsonData.loginID;
    const index = jsonData.index;
    const formattedDate = jsonData.formattedDate;
    const stateData = jsonData.state;
    const folderPath = `${storagePath}/${loginID}`;
    try {
        const filePath = path.join(folderPath, `${formattedDate}.json`);
        const fileContents = await fsPromises.readFile(filePath, 'utf-8');
        let todoData = JSON.parse(fileContents);
        if (index >= 0 && index < Object.keys(todoData).length) {
            todoData[index].state = stateData;
            await fsPromises.writeFile(filePath, JSON.stringify(todoData, null, 2), 'utf-8');
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return error
    }
}

export { todoRead, todoMonthRead, todoCreate, todoDelete, todoModify, moveTodoContents, todoStateChange }