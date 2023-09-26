import React, { FC, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios, { AxiosResponse } from 'axios';
import { AiOutlineCloseCircle } from 'react-icons/ai'
import './CreateTodo.scss';

interface CreateModalProps {
    selectedDate: Date;
    setCreateTodoOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type TodoData = {
    loginID: string;
    selectedDate: string;
    todo: string;
    period: string;
    content: string;
}

const CreateTodo: FC<CreateModalProps> = ({ selectedDate, setCreateTodoOpen }) => {
    const [cookies] = useCookies(['token']);
    const draggingRef = useRef(false);
    const mouseDownTargetRef = useRef<EventTarget | null>(null);
    const mouseUpTargetRef = useRef<EventTarget | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [todoTitle, setTodoTitle] = useState<string>('');
    const [todoContent, setTodoContent] = useState<string>('');
    const navigate = useNavigate();
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const clickCloseButton = () => {
        setCreateTodoOpen(false);
    }
    //드래그 방지
    const handleBackgroundMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        mouseDownTargetRef.current = e.target;
    };
    const handleBackgroundMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
        mouseUpTargetRef.current = e.target;
        draggingRef.current = mouseDownTargetRef.current !== mouseUpTargetRef.current;
        if (!draggingRef.current && mouseDownTargetRef.current === e.currentTarget) {
            clickCloseButton();
        }
    };
    //등록버튼 기능
    const submitButtonClick = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
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
        if (!todoTitle) {
            alert('ToDo가 입력되지 않았습니다.');
            return;
        }
        if (!startDate || !endDate) {
            const result = window.confirm(`기간이 제대로 설정되지 않았습니다.\n그래도 등록 하시겠습니까?`);
            if (!result) {
                alert('등록을 종료합니다');
                return;
            }
        }
        const todoConfirm = window.confirm(`${todoTitle}를 등록하시겠습니까?`);
        if (!todoConfirm) {
            return;
        }
        try {
            const loginID = cookies.token.loginID;
            const response: AxiosResponse<Record<string, TodoData>> = await axios.get(`${process.env.REACT_APP_SERVER}/todo/date?date=${formattedDate}&loginID=${loginID}`);
            const existingData: Record<string, TodoData> = response.data;
            const newTodo: TodoData = {
                "loginID": loginID,
                "selectedDate": formattedDate,
                "todo": todoTitle,
                "period": `${startDate}~${endDate}`,
                "content": todoContent
            }
            const newIndex = Object.keys(existingData).length.toString();
            existingData[newIndex] = newTodo;
            const updatedResponse = await axios.post(`${process.env.REACT_APP_SERVER}/todo.do`, existingData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (updatedResponse.status === 200) {
                alert('정상적으로 등록되었습니다');
                setCreateTodoOpen(false);
            } else {
                alert('신규 등록에 실패하였습니다');
            }

        } catch (error) {
            alert(`오류발생\n${error}`)
        }
    }

    return (
        <div className='createModal' onMouseDown={(e) => handleBackgroundMouseDown(e)} onMouseUp={(e) => handleBackgroundMouseUp(e)}>
            <div className='modal-background'>
                <div className='modalcontent'>
                    <div className="modalClose">
                        <AiOutlineCloseCircle
                            size={20}
                            color='rgb(90,90,90)'
                            onClick={() => { clickCloseButton() }}
                        />
                    </div>
                    <div className='title'>Selected Date</div>
                    <div className='data'>{formattedDate}</div>
                    <div className='title'>ToDo*</div>
                    <textarea
                        className='createInput'
                        placeholder='할일을 적으세요'
                        onChange={(e) => setTodoTitle(e.target.value)}
                    />
                    <div className='title'>Period</div>
                    <div className="periodInput">
                        <input type="date" onChange={(e) => { setStartDate(e.target.value); }} /><span> ~ </span><input type="date" onChange={(e) => { setEndDate(e.target.value); }} />
                    </div>
                    <div className='title'>Content</div>
                    <textarea
                        className='createInput last'
                        placeholder='상세 내용을 적으세요'
                        onChange={(e) => setTodoContent(e.target.value)}
                    />
                    <p>* 은 필수항목 입니다</p>
                    <div className='title'>
                        <div>
                            <button onClick={(e) => { submitButtonClick(e) }}>등록</button>
                        </div>
                    </div>
                </div>
            </div >
        </div>
    )
}

export default CreateTodo;