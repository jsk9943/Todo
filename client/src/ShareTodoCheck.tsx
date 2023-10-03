import React, { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { AiOutlineCloseCircle, AiOutlineDownload } from 'react-icons/ai'
import { BsTrash } from 'react-icons/bs'
import './ShareTodoCheck.scss';
import axios from 'axios';

interface ShareTodoCheckProps {
    currentMonth: Date;
    setShareTodoCheck: React.Dispatch<React.SetStateAction<boolean>>;
}

const ShareTodoCheck: FC<ShareTodoCheckProps> = ({ currentMonth, setShareTodoCheck }) => {
    const [cookies] = useCookies(['token']);
    const [shareTodoData, setShareTodoData] = useState([]);
    const [checkedValues, setCheckedValues] = useState([]);
    const navigate = useNavigate();

    //닫기
    const closeButton = () => {
        setShareTodoCheck(false);
    }
    //체크박스 값 저장하기
    const handleCheckboxValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (e.target.checked) {
            setCheckedValues([...checkedValues, value]);
        } else {
            setCheckedValues(checkedValues.filter((item) => item !== value));
        }
    }
    //체크된 데이터 내 todo로 등록하기
    const handleCheckTodoDown = async () => {
        if (checkedValues.length != 0) {
            const confirm = window.confirm(`${checkedValues.length}건의 공유된 Todo를 등록하시겠습니까?`);
            if (confirm) {
                for (const indexObj of checkedValues) {
                    const index = parseInt(indexObj);
                    if (!isNaN(index) && index >= 0 && index < shareTodoData.length) {
                        const shareTodo = shareTodoData[index];
                        const { shareID, selectedDate, todoData } = shareTodo;
                        const newTodo = {
                            loginID: shareID,
                            selectedDate: selectedDate,
                            todo: todoData.title,
                            period: todoData.period,
                            content: todoData.content,
                            state: todoData.state || "",
                        };
                        const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo/date?date=${selectedDate}&loginID=${shareID}`);
                        const existingData = response.data;
                        const newIndex = Object.keys(existingData).length.toString();
                        existingData[newIndex] = newTodo;
                        const updatedResponse = await axios.post(`${process.env.REACT_APP_SERVER}/todo.do`, existingData, {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                        if (updatedResponse.status != 200) {
                            alert('내 Todo로 등록에 실패하였습니다');
                            return;
                        }
                    }
                }
                alert('내 Todo로 등록 완료되었습니다');
                //생성 후 삭제
                const response = await axios.patch(`${process.env.REACT_APP_SERVER}/todo.share.get?loginID=${cookies.token.loginID}`, checkedValues);
                if (response.data === "TODO_DELETE_FAIL") {
                    alert('Todo는 등록하였지만 공유데이터 삭제는 실패하였습니다')
                }
                setShareTodoCheck(false);
            } else {
                alert('취소 되었습니다');
            }
        } else {
            alert('체크박스가 선택되지 않았습니다');
        }
    }

    //체크된 데이터 쉐어에서 삭제하기
    const handleCheckTodoDelete = async () => {
        if (checkedValues.length != 0) {
            const confirm = window.confirm(`${checkedValues.length}건의 공유된 Todo를 삭제하시겠습니까?\n삭제된 데이터는 복구되지 않습니다`);
            if (confirm) {
                const response = await axios.patch(`${process.env.REACT_APP_SERVER}/todo.share.get?loginID=${cookies.token.loginID}`, checkedValues);
                if (response.data === "TODO_DELETE_FAIL") {
                    alert('공유데이터 삭제가 실패하였습니다')
                } else if (response.data === "TODO_DELETE_SUCCESS"){
                    alert('공유데이터는 삭제 되었습니다');
                    setCheckedValues([]);
                }
            } else {
                alert('삭제를 취소하였습니다');
            }
        }
    }

    //초기 쉐어데이터 가져오기
    useEffect(() => {
        const token = cookies.token;
        if (!token) {
            alert(`접속만료되어 접근 할 수 없습니다\n다시 로그인 해주세요`)
            navigate('/');
            return;
        } else {
            const validityConfirmData = {
                cookieID: token.loginID,
                cookieToken: token.token
            }
            const validityConfirm = async (data: { cookieID: string; cookieToken: string; }): Promise<void> => {
                const response = await axios.post(`${process.env.REACT_APP_SERVER}/usersessionvalidity`, data, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.data) {
                    alert(`세션만료로 접근 할 수 없습니다\n다시 로그인 해주세요`)
                    navigate('/');
                    return;
                }
            }
            validityConfirm(validityConfirmData);
        }
        const fetch = async () => {
            const userCheckData = {
                loginID: cookies.token.loginID,
                token: cookies.token.token
            }
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/todo.share.get`, userCheckData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data != "SHARE_TODO_READ_FAIL") {
                const shareTodoData = response.data;
                setShareTodoData(shareTodoData);
            } else {
                alert('서버에서 공유 파일을 찾지 못했습니다');
            }
        }
        fetch();
    }, [currentMonth, checkedValues]);


    return (
        <div className='share-check-container'>
            <div className='share-check-background'>
                <div className='share-check-content'>
                    <div className='share-check-close'>
                        <AiOutlineCloseCircle
                            size={20}
                            onClick={() => { closeButton() }}
                        />
                    </div>
                    <div className='share-check-todo-count'>Share Todo Count</div>
                    <div className='share-check-todo-count-num'>
                        {shareTodoData.length === 0 ? "공유된 Todo가 없습니다" : `${shareTodoData.length}건`}
                    </div>
                    <div className='share-check-todo-content'>Share Todo Content</div>
                    <div className='share-check-todo-content-show'>
                        {shareTodoData.map((item, index) => (
                            <div key={index}>
                                <input
                                    type='checkbox'
                                    value={index}
                                    onChange={handleCheckboxValue}
                                />
                                <div className='share-check-content-show'>
                                    <div>Sender: <span>{item.loginID}</span></div>
                                    <div>Todo Date: <span>{item.selectedDate}</span></div>
                                    <div>Title: <span>{item.todoData.title}</span></div>
                                    <div>Content: <span>{item.todoData.content}</span></div>
                                    <div>Period: <span>{item.todoData.period}</span></div>
                                    <div>State: <span>{item.todoData.state}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='share-check-button-container'>
                        <AiOutlineDownload
                            onClick={handleCheckTodoDown}
                        />
                        <BsTrash
                            onClick={handleCheckTodoDelete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShareTodoCheck;