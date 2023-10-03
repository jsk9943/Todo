import express from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import { todoRead, todoMonthRead, todoCreate, todoDelete, todoModify, moveTodoContents, todoStateChange } from './storage.js';
import { memberLoginProcess, validityConfirm, memberExist, newMember, memberLogoutProcess } from './member.js';
import { shareFileCreate, shareTodoExsits, shareTodoRead, shareTodoImportAndDelete } from './share.js';

const app = express();
const PORT = 9001;
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

/**
 * 회원가입 및 로그인 기능
 */
//회원가입 시 아이디 중복 확인
app.get('/signup', async (req, res) => {
    try {
        const signupId = req.query.signupId
        const result = await memberExist(signupId);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '서버 오류' });
    }
})
//신규가입 데이터 받기
app.post('/signup', async (req, res) => {
    try {
        const jsonData = req.body;
        const result = await newMember(jsonData);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '가입 데이터 오류' })
    }
})
//로그인
app.post('/userLogin', async (req, res) => {
    try {
        const jsonData = req.body;
        const finalData = await memberLoginProcess(jsonData);
        res.json(finalData);
    } catch (error) {
        res.status(500).json({ error: '로그인 실패' });
    }
})
//세션 유지 확인
app.post('/usersessionvalidity', async (req, res) => {
    try {
        const jsonData = req.body;
        const validityData = await validityConfirm(jsonData);
        if (validityData) {
            res.json(true);
        } else {
            res.json(false);
        }
    } catch (error) {
        res.status(500).json({ error: '로그인 검증 실패' });
    }
})

/**
 * 캘린더 기능
 */
//캘린더 첫페이지
app.get('/todo.do', async (req, res) => {
    try {
        const month = req.query.month;
        const loginID = req.query.loginID;
        res.json(await todoMonthRead(month, loginID));
    } catch (error) {
        res.status(500).json({ error: '서버 오류입니다.' });
    }
})
// 일자 별 todo 데이터
app.get('/todo/date', async (req, res) => {
    try {
        const date = req.query.date;
        const loginID = req.query.loginID;
        res.json(await todoRead(date, loginID));
    } catch (error) {
        res.json({});
    }
})
// todo 데이터 신규 생성
app.post('/todo.do', async (req, res) => {
    try {
        const jsonData = req.body;
        res.json(await todoCreate(jsonData));
    } catch (error) {
        res.status(500).json({ error: '서버 오류입니다.' });
    }
});
//todo 삭제
app.delete('/todo.do', async (req, res) => {
    try {
        const jsonData = req.body;
        const booleanResult = await todoDelete(jsonData);
        res.json(booleanResult);
    } catch (error) {
        res.status(500).json({ error: '서버 오류입니다.' });
    }
});
// todo 수정
app.patch('/todo.do', async (req, res) => {
    try {
        const jsonData = req.body;
        const result = await todoModify(jsonData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '서버 오류입니다.' });
    }
})
//todo 이동
app.patch('/todo.move', async (req, res) => {
    try {
        const jsonData = req.body;
        const result = await moveTodoContents(jsonData);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '이동기능 서버 오류' });
    }
})
//todo 상태 변경
app.patch('/todo.state', async (req, res) => {
    try {
        const jsonData = req.body;
        res.send(await todoStateChange(jsonData));
    } catch (error) {
        res.status(500).json({ error: '상태변경 오류' });
    }
})
/**
 * todo share 기능
 */
//공유받을 아이디 체크
app.get('/todo.share', async (req, res) => {
    try {
        const shareID = req.query.shareID
        const result = await memberExist(shareID);
        res.send(result ? true : false);
    } catch (error) {
        res.status(500).json({ error: '서버 오류' });
    }
})
//전송
app.post('/todo.share', async (req, res) => {
    try {
        const jsonData = req.body;
        const result = await shareFileCreate(jsonData)
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '공유 오류' });
    }
})
//공유받은 데이터 있는지 확인
app.get('/todo.share.get', async (req, res) => {
    try {
        const loginId = req.query.loginId
        const result = await shareTodoExsits(loginId);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '공유 가져오기' });
    }
})
//공유받은 데이터 가져오기
app.post('/todo.share.get', async (req, res) => {
    try {
        const jsonData = req.body;
        const result = await shareTodoRead(jsonData);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '공유 가져오기' });
    }
})
//공유데이터 삭제하기
app.patch('/todo.share.get', async (req, res) => {
    try {
        const loginID = req.query.loginID
        const jsonData = req.body;
        const result = await shareTodoImportAndDelete(loginID, jsonData);
        res.send(result);
    } catch (error) {
        res.status(500).json({ error: '내 Todo로 등록' });
    }
})














//logout
app.post('/todo.logout', async (req, res) => {
    try {
        const cookieData = req.body;
        const logoutResult = await memberLogoutProcess(cookieData);
        res.send(logoutResult);
    } catch (error) {
        res.status(500).json({ error: '접속 실패하였습니다.' });
    }
})


app.listen(PORT, () => {
    console.log('Start Server!')
})