import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { addMonths, subMonths, addDays, subDays } from 'date-fns';
import axios from 'axios';
import Header from './Header';
import Days from './Days'
import Cells from './Cells';
import Modal from './Modal';
import CreateTodo from './CreateTodo';
import ListModal from './ListModal';
import Notification from './Notification';
import ShareTodo from './ShareTodo';
import ShareTodoCheck from './ShareTodoCheck';

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

type Action = {
    type: string;
    payload?: any;
}

const initialState: TodoContents = {
    index: null,
    formattedDate: null,
    shareData: {
        loginID: '',
        formattedDate: '',
        todoData: {
            title: '',
            period: '',
            content: '',
            state: '',
        }
    }
};

const reducer = (state: TodoContents, action: Action) => {
    switch (action.type) {
        case 'TODO_CONTENT_INDEX':
            return { ...state, index: action.payload };
        case 'TODO_CONTENT_DATE':
            return { ...state, formattedDate: action.payload };
        case 'SHARE_TODO_DATA':
            return { ...state, shareData: action.payload };
        default:
            return state;
    }
};

const Calendar = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [cookies,] = useCookies(['token']);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [todoTitle, setTodoTitle] = useState({});
    const [todoState, setTodoState] = useState({});
    const [todoPeriod, setTodoPeriod] = useState({});
    const [listOpen, setListOpen] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [shareOpen, setShareOpen] = useState<boolean>(false);
    const [createTodoOpen, setCreateTodoOpen] = useState<boolean>(false);
    const [shareTodoCheck, setShareTodoCheck] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [holiday, setHoliday] = useState(null);
    const holidayDataCountRef = useRef(null);
    const navigate = useNavigate();
    // 터치 이벤트에 사용되는 상태 변수
    const [touchStartX, setTouchStartX] = useState(null);
    const [, setTouchEndX] = useState(null);
    const [isSwiping, setIsSwiping] = useState<boolean>(false);
    // 이전달
    const prevMonth = () => {
        if (!isSwiping) {
            setCurrentMonth(subMonths(currentMonth, 1));
            setIsSwiping(true);
        }
    }
    // 다음달
    const nextMonth = () => {
        if (!isSwiping) {
            setCurrentMonth(addMonths(currentMonth, 1));
            setIsSwiping(true);
        }
    }
    // 이전날
    const prevDay = () => {
        setSelectedDate(subDays(selectedDate, 1));
    }
    // 다음날
    const nextDay = () => {
        setSelectedDate(addDays(selectedDate, 1));
    }
    // 선택날짜
    const onDateClick = (day: Date) => {
        setSelectedDate(day);
    }
    //터치 시작점
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setIsSwiping(false);
    }
    // 터치 이동
    const handleTouchMove = (e: React.TouchEvent) => {
        if (listOpen === true || modalOpen === true) {
            return;
        } else {
            const currentX = e.touches[0].clientX;
            const distance = currentX - touchStartX;
            if (distance > 120) {
                prevMonth();
                setTouchStartX(currentX);
            } else if (distance < -120) {
                nextMonth();
                setTouchStartX(currentX);
            }
        }
    }
    //터치 끝점
    const handleTouchEnd = () => {
        setTouchEndX(touchStartX);
    }

    //초기 캘린더 형태 불러오기
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
        const fetchData = async () => {
            const year = currentMonth.getFullYear();
            const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
            const formattedDate = `${year}-${month}`;
            const loginID = token.loginID;
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo.do?month=${formattedDate}&loginID=${loginID}`);
                const processedTitleData: { [key: string]: any } = {};
                const processedStateData: { [key: string]: any } = {};
                const processedPeriodData: { [key: string]: any } = {};
                for (const data in response.data) {
                    const processedTitleItems: { [key: string]: string } = {};
                    const processedStateItems: { [key: string]: string } = {};
                    const processedPeriodItems: { [key: string]: string } = {};
                    for (const key in response.data[data]) {
                        const parts = response.data[data][key].split(' & ');
                        processedTitleItems[key] = parts[0];
                        processedStateItems[key] = parts[1];
                        processedPeriodItems[key] = parts[2].split('~');
                    }
                    processedTitleData[data] = processedTitleItems;
                    processedStateData[data] = processedStateItems;
                    processedPeriodData[data] = processedPeriodItems;
                }
                setTodoState(processedStateData);
                setTodoTitle(processedTitleData);
                setTodoPeriod(processedPeriodData);
            } catch (error) {
                alert(error);
            }
        };
        fetchData();
        const unloadHandler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', unloadHandler);
        return () => {
            window.removeEventListener('beforeunload', unloadHandler);
        };
    }, [currentMonth, createTodoOpen, modalOpen, shareTodoCheck]);

    // 공휴일 가져오기
    useEffect(() => {
        const calenderHolidayData = async () => {
            setIsLoading(true);
            const year = currentMonth.getFullYear();
            const month = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
            const data = await axios.get(`http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${process.env.REACT_APP_CALENDER_ENCODING_KEY}&solYear=${year}&solMonth=${month}&numOfRows=30`);
            const jsonData = JSON.stringify(data);
            const convertJsonData = JSON.parse(jsonData);
            holidayDataCountRef.current = convertJsonData.data.response.body.totalCount;
            if (holidayDataCountRef.current > 0) {
                if (holidayDataCountRef.current > 1) {
                    const items = convertJsonData.data.response.body.items.item;
                    const jsonResult: { [key: string]: string } = {};
                    items.forEach((item: { locdate: number; dateName: string; }) => {
                        const date = new Date(item.locdate.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
                        const locdate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                        const dateName = item.dateName;
                        jsonResult[locdate] = dateName;
                    });
                    setHoliday(jsonResult);
                } else if (holidayDataCountRef.current == 1) {
                    const item = convertJsonData.data.response.body.items.item;
                    const jsonResult: { [key: string]: string } = {};
                    const date = new Date(item.locdate.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
                    const locdate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                    const dateName = item.dateName;
                    jsonResult[locdate] = dateName;
                    setHoliday(jsonResult);
                }
            }
            setIsLoading(false);
        };
        calenderHolidayData();
    }, [currentMonth]);

    return (
        <>
            <div id="container">
                <div
                    className="calendar"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <Header
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        shareTodoCheck={shareTodoCheck}
                        setShareTodoCheck={setShareTodoCheck}
                        prevMonth={prevMonth}
                        nextMonth={nextMonth}
                    />
                    <Notification
                        todoState={todoState}
                    />
                    <Days />
                    {isLoading ? (
                        <div className="loading-bar-container">
                            {isLoading && <div className="loading-bar"></div>}
                        </div>
                    ) : (
                        <Cells
                            holiday={holiday}
                            todoState={todoState}
                            todoTitle={todoTitle}
                            todoPeriod={todoPeriod}
                            currentMonth={currentMonth}
                            selectedDate={selectedDate}
                            setListOpen={setListOpen}
                            listOpen={listOpen}
                            modalOpen={modalOpen}
                            onDateClick={onDateClick}
                        />
                    )}
                    {listOpen && (
                        <ListModal
                            dispatch={dispatch}
                            todoState={todoState}
                            todoTitle={todoTitle}
                            selectedDate={selectedDate}
                            setListOpen={setListOpen}
                            setModalOpen={setModalOpen}
                            setCreateTodoOpen={setCreateTodoOpen}
                            prevDay={prevDay}
                            nextDay={nextDay}
                        />
                    )}
                    {modalOpen && (
                        <Modal
                            state={state}
                            dispatch={dispatch}
                            setModalOpen={setModalOpen}
                            setShareOpen={setShareOpen}
                        />
                    )}
                    {shareOpen && (
                        <ShareTodo
                            state={state}
                            setShareOpen={setShareOpen}
                        />
                    )}
                    {createTodoOpen && (
                        <CreateTodo
                            selectedDate={selectedDate}
                            setCreateTodoOpen={setCreateTodoOpen}
                        />
                    )}
                    {shareTodoCheck &&
                        <ShareTodoCheck
                            currentMonth={currentMonth}
                            setShareTodoCheck={setShareTodoCheck}
                        />
                    }
                </div>
            </div>

        </>
    )
}

export default Calendar;