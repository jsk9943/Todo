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
        const filePath = path.join(storagePath, `${jsonData.shareId}.json`);
        let existingData = [];
        try {
            existingData = await fsPromises.readFile(filePath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fsPromises.writeFile(filePath, '[]');
            } else {
                throw error;
            }
        }
        if (existingData) {
            const existingJsonData = JSON.parse(existingData);
            const isDuplicate = existingJsonData.some(item =>
                item.loginId === jsonData.loginId && item.todoData.title === jsonData.todoData.title
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

export { shareFileCreate };