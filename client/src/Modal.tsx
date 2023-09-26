import React, { FC, useEffect, useRef, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { AiOutlineCloseCircle, AiFillEdit, AiOutlineCheck } from 'react-icons/ai'
import { BsFillTrashFill, BsShareFill } from 'react-icons/bs'
import { TbExchange } from 'react-icons/tb'
import './Modal.scss';

interface ModalProps {
    state: TodoContents;
    dispatch: DispatchType;
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
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
type ChangeState = {
    loginID: string;
    formattedDate: string;
    index: number;
    state: string
}

type JsonData = {
    state: string;
    todo: string;
    period: string;
    content: string;
}

type MoveData = {
    loginID: string;
    index: number;
    currentDate: string;
    moveDate: string;
}

type EditedData = {
    loginID: string;
    formattedDate: string;
    index: number;
    title: string;
    startDate: string;
    endDate: string;
    content: string;
};

type DeleteData = {
    loginID: string;
    formattedDate: string;
    index: number;
}

type ShareTodoData = {
    loginID: string;
    formattedDate: string;
    todoData: {
        title: string;
        period: string;
        content: string;
        state: string;
    }
}

type DispatchType = (action: {
    type: string;
    payload?: any;
}) => void;

const Modal: FC<ModalProps> = ({ state, dispatch, setModalOpen, setShareOpen }) => {
    const [cookies] = useCookies(['token']);
    const draggingRef = useRef(false);
    const mouseDownTargetRef = useRef<EventTarget | null>(null);
    const mouseUpTargetRef = useRef<EventTarget | null>(null);
    const [jsonData, setJsonData] = useState<JsonData[]>([]);
    const [isEditVisible, setIsEditVisible] = useState(Array(jsonData.length).fill(false));
    const [isMoveVisible, setIsMoveVisible] = useState<{ [key: number]: boolean }>({});
    const [moveDate, setMoveDate] = useState('');
    const [editedTitle, setEditedTitle] = useState<string>('');
    const [editedStartDate, setEditedStartDate] = useState<string>('');
    const [editedEndDate, setEditedEndDate] = useState<string>('');
    const [editedContent, setEditedContent] = useState<string>('');
    const todoStateRef = useRef<string>('');
    const todoTitleRef = useRef<string>('');
    const todoPeriodRef = useRef<string>('');
    const todoContentRef = useRef<string>('');
    const [stateChange, setStateChange] = useState<boolean>(false);
    const navigate: NavigateFunction = useNavigate();

    //선택된 Todo 가져오기
    useEffect(() => {
        const fetchData = async () => {
            try {
                const loginID = cookies.token.loginID;
                const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo/date?date=${state.formattedDate}&loginID=${loginID}`);
                const dataArray = Object.values(response.data) as JsonData[];
                setJsonData(dataArray);
            } catch (error) {
                setJsonData([]);
            }
        };
        if (state.formattedDate) {
            fetchData();
        }
    }, [stateChange]);

    //종료버튼
    const closeButtonClick = (): void => {
        setModalOpen(false);
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
    //todo 상태 변경
    const todoStateChange = async (value: string, index: number): Promise<void> => {
        const changeValue: ChangeState = {
            loginID: cookies.token.loginID,
            formattedDate: state.formattedDate,
            index,
            state: value
        };
        const response = await axios.patch(`${process.env.REACT_APP_SERVER}/todo.state`, changeValue);
        if (response.data === true) {
            setStateChange(!stateChange);
        }
    }
    //Todo 이동을 위한 인터페이스 감추기
    const toggleMoveVisibility = (index: number): void => {
        if (isMoveVisible[index]) {
            setIsMoveVisible(prevState => ({ ...prevState, [index]: false }));
        } else if (Object.values(isMoveVisible).some((value, i) => value && i !== index)) {
            alert('이미 수정 중인 항목이 있습니다.');
        } else {
            setIsMoveVisible(prevState => ({ ...prevState, [index]: true }));
        }
    }
    //todo이동 프로세스
    const moveBtnClick = async (index: number, currentDate: string, moveDate: string) => {
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
        if (moveDate === '') {
            alert('날짜가 지정되지 않았습니다')
            return;
        } else {
            const result = window.confirm(`이동 하시겠습니까?\n${currentDate} → ${moveDate}`)
            if (!result) {
                alert('취소 되었습니다')
                return;
            }
        }
        const moveData: MoveData = {
            loginID,
            index,
            currentDate,
            moveDate
        }
        const response = await axios.patch(`${process.env.REACT_APP_SERVER}/todo.move`, moveData);
        if (response.data) {
            alert('이동하였습니다');
            const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo/date?date=${state.formattedDate}&loginID=${loginID}`);
            const dataArray = Object.values(response.data) as JsonData[];
            setJsonData(dataArray);
        } else {
            alert(`오류\n${response.data}`);
        }
    }
    //Todo 수정 인터페이스 감추기
    const toggleEditVisibility = (index: number): void => {
        if (isEditVisible.some((isVisible, i) => isVisible && i !== index)) {
            alert('이미 수정 중인 항목이 있습니다.');
        } else {
            setEditedTitle(jsonData[index].todo);
            setEditedContent(jsonData[index].content);
            const dateArray = jsonData[index].period.split(" ~ ");
            if (dateArray[0] === '~') {
                setEditedStartDate('');
                setEditedEndDate('');
            } else if (dateArray[0].startsWith('~')) {
                setEditedEndDate(dateArray[0].substring(1).trim());
            } else {
                setEditedStartDate(dateArray[0]);
                setEditedEndDate(dateArray[1]);
            }
            const updatedVisibility = [...isEditVisible];
            updatedVisibility[index] = !updatedVisibility[index];
            setIsEditVisible(updatedVisibility);
            if (!updatedVisibility[index]) {
                setEditedTitle('');
                setEditedStartDate('');
                setEditedEndDate('');
                setEditedContent('');
            }
        }
    };
    //최종 수정요청 버튼
    const modifyConfirmClick = async (index: number) => {
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
        const editConfirm = window.confirm(`제목 : ${editedTitle}\n기간 : ${editedStartDate} ~ ${editedEndDate}\n내용 : ${editedContent}\n\n이대로 수정하시겠습니까?\n※비어있는 경우 수정되지 않습니다.`);
        const editedData: EditedData = {
            loginID: cookies.token.loginID,
            formattedDate: state.formattedDate,
            index,
            title: editedTitle,
            startDate: editedStartDate,
            endDate: editedEndDate,
            content: editedContent,
        };
        if (editConfirm) {
            const response = await axios.patch<boolean>(`${process.env.REACT_APP_SERVER}/todo.do`, editedData);
            if (response.data === true) {
                alert('수정을 완료하였습니다');
                const loginID = cookies.token.loginID;
                const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo/date?date=${state.formattedDate}&loginID=${loginID}`);
                const dataArray = Object.values(response.data) as JsonData[];
                setJsonData(dataArray);
                const visibilityClose = [...isEditVisible];
                visibilityClose[index] = !visibilityClose[index];
                setIsEditVisible(visibilityClose);
                if (!visibilityClose[index]) {
                    setEditedTitle('');
                    setEditedStartDate('');
                    setEditedEndDate('');
                    setEditedContent('');
                }
            } else {
                alert('수정이 완료되지 못했습니다');
            }
        } else {
            alert('수정을 취소하였습니다');
        }
    }

    //Todo 삭제버튼
    const deleteButtonClick = async (formattedDate: string, index: number, todo: string) => {
        try {
            const deleteData: DeleteData = {
                loginID: cookies.token.loginID,
                formattedDate,
                index
            }
            const deleteConfirm = window.confirm(`${todo}를 삭제하시겠습니까?`);
            if (deleteConfirm) {
                const response = await axios.delete(`${process.env.REACT_APP_SERVER}/todo.do`, { data: deleteData });
                if (response.data === true) {
                    alert('정상적으로 삭제되었습니다');
                    setModalOpen(false);
                } else {
                    alert('이미 삭제되었거나 삭제 할 수 없습니다');
                }
            } else {
                alert('삭제를 취소하였습니다');
                return;
            }
        } catch (error) {
            alert(error);
        }
    }
    // Todo 쉐어
    const todoShare = () => {
        const shareData: ShareTodoData = {
            loginID: cookies.token.loginID,
            formattedDate: state.formattedDate,
            todoData: {
                title: todoTitleRef.current,
                period: todoPeriodRef.current,
                content: todoContentRef.current,
                state: todoStateRef.current,
            }
        }
        if (shareData) {
            setShareOpen(true);
            dispatch({ type: 'SHARE_TODO_DATA', payload: shareData });
        }
    }
    return (
        <div className='modal' onMouseDown={(e) => handleBackgroundMouseDown(e)} onMouseUp={(e) => handleBackgroundMouseUp(e)}>
            <div className='modal-background'>
                <div className='modalcontent'>
                    <div className="modalClose">
                        <AiOutlineCloseCircle
                            size={20}
                            onClick={() => { closeButtonClick() }}
                        />
                    </div>
                    <div className='title'>Selected Date</div>
                    <div className='data'>{state.formattedDate}</div>
                    <div className='scrollable-content'>
                        {jsonData.length > 0 ? (
                            jsonData.map((item, index) => {
                                if (index === state.index) {
                                    todoStateRef.current = item.state;
                                    todoTitleRef.current = item.todo;
                                    todoPeriodRef.current = item.period;
                                    todoContentRef.current = item.content
                                    return (
                                        <div key={index}>
                                            <div className={`content-container content-${item.state}`}>
                                                <hr className='contentLine'></hr>
                                                <div className='title'>State</div>
                                                <div className='state-radio'>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`state${index}`}
                                                            value="New"
                                                            checked={item.state === "New"}
                                                            onChange={async (e) => { await todoStateChange(e.target.value, index); }}
                                                        />
                                                        New
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`state${index}`}
                                                            value="Progress"
                                                            checked={item.state === "Progress"}
                                                            onChange={async (e) => { await todoStateChange(e.target.value, index); }}
                                                        />
                                                        Progress
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            name={`state${index}`}
                                                            value="Complete"
                                                            checked={item.state === "Complete"}
                                                            onChange={async (e) => { await todoStateChange(e.target.value, index); }}
                                                        />
                                                        Complete
                                                    </label>
                                                </div>
                                                <div className='title'>ToDo</div>
                                                <div className='data todo'>{item.todo}</div>
                                                <textarea
                                                    className={`modifyInput title ${isEditVisible[index] ? '' : 'hidden'}`}
                                                    placeholder='수정할 제목(미 입력 시 수정되지 않습니다)'
                                                    value={editedTitle}
                                                    onChange={(e) => setEditedTitle(e.target.value)}
                                                />
                                                <div className='title'>Period</div>
                                                <div className='data period'>{item.period}</div>
                                                <div className={`modifyInput period ${isEditVisible[index] ? '' : 'hidden'}`}>
                                                    <input
                                                        className={`modifyInput ${isEditVisible[index] ? '' : 'hidden'}`}
                                                        type="date"
                                                        value={editedStartDate}
                                                        onChange={(e) => setEditedStartDate(e.target.value)}
                                                    />
                                                    <span> ~ </span>
                                                    <input
                                                        className={`modifyInput ${isEditVisible[index] ? '' : 'hidden'}`}
                                                        type="date"
                                                        value={editedEndDate}
                                                        onChange={(e) => setEditedEndDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className='title'>Content</div>
                                                <div className={`data content ${index === jsonData.length - 1 ? 'last' : ''}`}>
                                                    {item.content}
                                                </div>
                                                <textarea
                                                    className={`modifyInput content ${isEditVisible[index] ? '' : 'hidden'}`}
                                                    placeholder='수정할 내용(미 입력 시 수정되지 않습니다)'
                                                    value={editedContent}
                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                />
                                                <div className={`MoveInput ${isMoveVisible[index] ? '' : 'hidden'}`}>
                                                    <div className='title'>Todo<br />옮기기</div>
                                                    <div>
                                                        <input
                                                            className={`MoveInput ${isMoveVisible[index] ? '' : 'hidden'}`}
                                                            type="date"
                                                            value={moveDate}
                                                            onChange={(e) => { setMoveDate(e.target.value); }}
                                                        />
                                                    </div>
                                                    <AiOutlineCheck
                                                        className={`MoveInput ${isMoveVisible[index] ? '' : 'hidden'}`}
                                                        onClick={() => {
                                                            moveBtnClick(index, state.formattedDate, moveDate);
                                                        }}
                                                    />
                                                </div>
                                                <div className='todoContentsButtons'>
                                                    <AiOutlineCheck
                                                        className={`modifyInput confirm ${isEditVisible[index] ? '' : 'hidden'}`}
                                                        onClick={() => { modifyConfirmClick(index); }}
                                                    />
                                                    <BsShareFill
                                                        onClick={() => { todoShare() }}
                                                    />
                                                    <TbExchange
                                                        onClick={() => { toggleMoveVisibility(index); }}
                                                    />
                                                    <AiFillEdit
                                                        size={20}
                                                        style={{ marginRight: '20px' }}
                                                        onClick={() => toggleEditVisibility(index)}
                                                    />
                                                    <BsFillTrashFill
                                                        size={20}
                                                        onClick={() => { deleteButtonClick(state.formattedDate, index, item.todo) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                            })
                        ) : (
                            <div className='error'>
                                <img src={process.env.PUBLIC_URL + '/img/nothing.png'} alt='없음' />
                                <div>할일이 없습니다!</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Modal;