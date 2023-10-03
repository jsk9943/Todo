import React, { FC, useRef, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { FaShare } from 'react-icons/fa'
import './ShareTodo.scss';

type TodoContents = {
    index: number;
    formattedDate: string;
    shareData: {
        loginID: string,
        formattedDate: string,
        todoData: {
            title: string,
            period: string,
            content: string,
            state: string
        }
    }
}

type ShareContents = {
    loginID: string,
    shareID: string,
    selectedDate: string,
    todoData: {
        title: string,
        period: string,
        content: string,
        state: string
    }
}

interface ShareTodoProps {
    state: TodoContents;
    setShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ShareTodo: FC<ShareTodoProps> = ({ state, setShareOpen }) => {
    const [cookies] = useCookies(['token']);
    const [shareID, setShareID] = useState<string>('');
    const [idCheck, setidCheck] = useState<boolean>(null);
    const draggingRef = useRef(false);
    const mouseDownTargetRef = useRef<EventTarget | null>(null);
    const mouseUpTargetRef = useRef<EventTarget | null>(null);
    const navigate: NavigateFunction = useNavigate();

    const closeButtonClick = (): void => {
        setShareOpen(false);
    };
    //드래그 종료 방지
    const handleBackgroundMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        mouseDownTargetRef.current = e.target;
    };
    const handleBackgroundMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
        mouseUpTargetRef.current = e.target;
        draggingRef.current = mouseDownTargetRef.current !== mouseUpTargetRef.current;
        if (!draggingRef.current && mouseDownTargetRef.current === e.currentTarget) {
            closeButtonClick();
        }
    };
    //공유 아이디 체크
    const shareIdCheck = async (shareID: string): Promise<void> => {
        if(shareID === cookies.token.loginID){
            setidCheck(false);
            return;
        }
        const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo.share?shareID=${shareID}`);
        setidCheck(response.data);
    }
    //공유하기
    const shareTodoSend = async (): Promise<void> => {
        if(shareID === cookies.token.loginID){
            alert('공유 할 아이디가 자기 자신 일 수 없습니다');
            return;
        }
        if (!idCheck) {
            alert('공유 할 아이디가 확인되지 않았습니다');
            return;
        }
        const token = cookies.token;
        const loginID = cookies.token.loginID;
        if (!token) {
            alert(`접속만료되어 접근 할 수 없습니다\n다시 로그인 해주세요`)
            navigate('/');
            return;
        } else {
            const validityConfirmData = {
                cookieID: token.loginID,
                cookieToken: token.token
            }
            const validityConfirm = async (data: { cookieID: string; cookieToken: string; }) => {
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
        const shareConfirm = window.confirm(`${shareID}님에게 ${state.shareData.todoData.title}을 공유 하시겠습니까?`);
        if (shareConfirm) {
            const shareData: ShareContents = {
                loginID: loginID,
                shareID: shareID,
                selectedDate: state.shareData.formattedDate,
                todoData: {
                    title: state.shareData.todoData.title,
                    period: state.shareData.todoData.period,
                    content: state.shareData.todoData.content,
                    state: state.shareData.todoData.state ? state.shareData.todoData.state : "",
                }
            }
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/todo.share`, shareData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data === "TODO_CREATE") {
                alert('공유가 완료되었습니다');
            } else if(response.data === "TODO_EXIST") {
                alert('이미 공유된 ToDo 입니다');
            }
        } else {
            alert('공유가 취소되었습니다');
        }
    }

    return (
        <div className='share-modal' onMouseDown={(e) => handleBackgroundMouseDown(e)} onMouseUp={(e) => handleBackgroundMouseUp(e)}>
            <div className='share-modal-background'>
                <div className='share-modal-content'>
                    <div className="share-close">
                        <AiOutlineCloseCircle
                            size={20}
                            onClick={() => { closeButtonClick() }}
                        />
                    </div>
                    <div className='share-date'>Selected Date</div>
                    <div className='share-formattedDate'>{state.shareData.formattedDate}</div>
                    <div className='share-content'>
                        <div className='share-title'>Todo to share</div>
                        <div className='share-title-todo'>{state.shareData.todoData.title}</div>
                        <div className='share-period'>Period</div>
                        <div className='share-todo-period'>{state.shareData.todoData.period}</div>
                        <div className='share-content'></div>
                        <div className='share-todo-content'>
                            {state.shareData.todoData.content.length <= 30
                                ? state.shareData.todoData.content
                                : `${state.shareData.todoData.content.slice(0, 30)}......`}
                        </div>
                        <div className='share-state'>State</div>
                        <div className={`share-todo-state ${state.shareData.todoData.state === 'New' ? 'New' : state.shareData.todoData.state === 'Progress' ? 'Progress' : state.shareData.todoData.state === 'Complete' ? 'Complete' : ''}`}>{state.shareData.todoData.state}</div>
                        <div className='share-with'>Share with</div>
                        <div className='share-with-input'>
                            <input className='share-with-id' type="text" placeholder='공유 할 대상 ID 입력' onChange={(e) => { setShareID(e.target.value); shareIdCheck(e.target.value); }} />
                        </div>
                        <div className={`${shareID ? 'id-check' : 'id-noCheck'} ${idCheck ? 'exist' : 'no-exist'}`}>{idCheck ? '공유 가능한 아이디 입니다' : '공유 할 수 없는 아이디 입니다'}</div>
                        <div className='share-button'>
                            <FaShare onClick={shareTodoSend} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShareTodo;