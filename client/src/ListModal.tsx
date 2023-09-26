import React, { FC, useEffect, useState, useRef } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { AiOutlineCloseCircle, AiOutlinePlusCircle } from 'react-icons/ai'
import { GrNext, GrPrevious } from 'react-icons/gr'
import './ListModal.scss'

type DispatchType = (action: {
    type: string;
    payload?: any;
}) => void;

interface ListModalProps {
    selectedDate: Date;
    todoTitle: Record<string, string>;
    todoState: Record<string, string>;
    setListOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCreateTodoOpen: React.Dispatch<React.SetStateAction<boolean>>;
    dispatch: DispatchType;
    prevDay: () => void;
    nextDay: () => void;
}

const ListModal: FC<ListModalProps> = ({ selectedDate, todoState, todoTitle, setListOpen, setModalOpen, setCreateTodoOpen, dispatch, prevDay, nextDay }) => {
    const [selectedDateData, setSelectedDateData] = useState<Record<number, string>>({});
    const [selectedState, setSelectedState] = useState<Record<number, string>>({});
    const draggingRef = useRef(false);
    const mouseDownTargetRef = useRef<EventTarget | null>(null);
    const mouseUpTargetRef = useRef<EventTarget | null>(null);
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const thisMonthStartDay = startOfMonth(selectedDate).getDate().toString().padStart(2, '0');
    const thisMonthEndDay = endOfMonth(selectedDate).getDate().toString().padStart(2, '0');
    const nowDate = new Date();
    const nowYear = nowDate.getFullYear();
    const nowMonth = String(nowDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더하고 2자리로 만듭니다.
    const nowDay = String(nowDate.getDate()).padStart(2, '0');
    const nowFormattedDate = `${nowYear}-${nowMonth}-${nowDay}`;

    const closeButtonClick = (): void => {
        setListOpen(false);
    };
    //날짜 이동 시 이전, 다음달로 넘어가지 않게 방지
    const prevDayClick = () => {
        if (thisMonthStartDay >= day) {
            return;
        }
        prevDay();
    }
    const nextDayClick = () => {
        if (thisMonthEndDay <= day) {
            return;
        }
        nextDay();
    }
    //드래그로 인한 종료 방지
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
    // Todo 상세정보 노출
    const contentTodoClick = (index: number, formattedDate: string) => {
        dispatch({ type: 'TODO_CONTENT_INDEX', payload: index });
        dispatch({ type: 'TODO_CONTENT_DATE', payload: formattedDate });
        setModalOpen(true);
    }


    useEffect(() => {
        setSelectedDateData(todoTitle[formattedDate] || {});
        setSelectedState(todoState[formattedDate] || {});
    }, [todoTitle, todoState, selectedDate]);

    return (
        <>
            <div className='list' onMouseDown={(e) => handleBackgroundMouseDown(e)} onMouseUp={(e) => handleBackgroundMouseUp(e)}>
                <div className='list-background'>
                    <div
                        className={`prev-day 
                        ${thisMonthStartDay >= day ? 'stop' : ''}`}
                        onClick={() => { prevDayClick(); }}
                    >
                        <GrPrevious />
                    </div>
                    <div
                        className={`next-day
                        ${thisMonthEndDay <= day ? 'stop' : ''}`}
                        onClick={() => { nextDayClick(); }}
                    >
                        <GrNext />
                    </div>
                    <div className='cell-content'>
                        <div id='content'>
                            <div className='list-plus'>
                                <AiOutlinePlusCircle
                                    size={20}
                                    onClick={() => { setCreateTodoOpen(true) }}
                                />
                            </div>
                            <div className="list-close">
                                <AiOutlineCloseCircle
                                    size={20}
                                    onClick={() => { closeButtonClick() }}
                                />
                            </div>
                            <div className='cell-date'>
                                {year}-{month}
                                <div className='cell-date-day'>{day}일</div>
                            </div>
                            <div className='cell-list'>
                                {Object.entries(selectedDateData).length > 0 ? (
                                    Object.entries(selectedDateData).map(([index, title]: [string, string]) => (
                                        <div key={index}>
                                            <hr className='list-line'></hr>
                                            <div
                                                className={`todo-list ${selectedState[Number(index)]}
                                                ${formattedDate === nowFormattedDate ? 'today' : ''}
                                                `}
                                                onClick={() => { contentTodoClick(Number(index), formattedDate); }}
                                            >
                                                <div className='todo-index'>No. {Number(index) + 1}</div>
                                                <div className='todo-title'>{title}</div>
                                            </div>
                                        </div>
                                    ))
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
            </div >
        </>
    );
};


export default ListModal;