import React, { FC, useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import './Cells.scss'

type TodoTitleData = {
    [key: string]: any;
}
type TodoStateData = {
    [key: string]: any;
}
type TodoPeriodData = {
    [key: string]: any;
}
type HolidayData = {
    [key: string]: string;
}

interface CellsProps {
    holiday: HolidayData;
    todoState: TodoStateData;
    todoTitle: TodoTitleData;
    todoPeriod: TodoPeriodData;
    currentMonth: Date;
    selectedDate: Date;
    listOpen: boolean;
    setListOpen: React.Dispatch<React.SetStateAction<boolean>>;
    modalOpen: boolean;
    onDateClick: (day: Date) => void;
}

const Cells: FC<CellsProps> = ({ holiday, todoState, todoTitle, todoPeriod, currentMonth, selectedDate, listOpen, setListOpen, modalOpen, onDateClick }) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const nowDate = new Date();
    const [repeatTodo, setRepeatTodo] = useState<{ [key: string]: any }>({});

    // 페이오드에 반복기한이 있는 내용만 파싱
    const filteredTodoPeriod: TodoPeriodData = {};
    for (const key in todoPeriod) {
        const values = todoPeriod[key];
        const filteredValues: TodoPeriodData = {};
        for (const subKey in values) {
            if (values[subKey].some((value: string) => value !== "")) {
                filteredValues[subKey] = values[subKey];
            }
        }
        if (Object.keys(filteredValues).length > 0) {
            filteredTodoPeriod[key] = filteredValues;
        }
    }

    const cellsClick = () => {
        setListOpen(true);
    }

    //5자 이상 길어지면 이후 텍스트는 .. 으로 대체
    const truncateText = (text: string) => {
        if (text.length <= 5) {
            return text;
        }
        return text.substring(0, 6) + '..';
    }
    // period 동안 반복등록할 todo 생성
    useEffect(() => {
        const updatedRepeatTodo: { [key: string]: any } = {};
        let currentDateInLoop = monthStart;
        while (currentDateInLoop <= endOfMonth(nowDate)) {
            const year = currentDateInLoop.getFullYear();
            const month = (currentDateInLoop.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDateInLoop.getDate().toString().padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            const todoData = todoPeriod[formattedDate];
            const todo = todoTitle[formattedDate];
            if (todoData) {
                for (const subKey in todoData) {
                    const dates = todoData[subKey];
                    if (dates.length === 2) {
                        const date1 = dates[0];
                        const date2 = dates[1];
                        if (date1 && date2) {
                            let currentDate = new Date(date1);
                            while (currentDate <= new Date(date2)) {
                                const formattedDate = format(currentDate, 'yyyy-MM-dd');
                                const todoDataForDate = todo[subKey];
                                if (todoDataForDate) {
                                    updatedRepeatTodo[formattedDate] = updatedRepeatTodo[formattedDate] || [];
                                    updatedRepeatTodo[formattedDate].push(todoDataForDate);
                                }
                                currentDate = addDays(currentDate, 1);
                            }
                        }
                    }
                }
            }
            currentDateInLoop = addDays(currentDateInLoop, 1);
        }
        setRepeatTodo(updatedRepeatTodo);
    }, [listOpen, modalOpen]);

    const rows = [];
    let day = startDate;
    let formattedDate = '';

    //기본적인 캘린더 cell
    while (day <= endDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, 'd');
            const year = day.getFullYear();
            const month = (day.getMonth() + 1).toString().padStart(2, '0');
            const parseFormattedDate = `${year}-${month}-${formattedDate.toString().padStart(2, '0')}`;
            let todo: TodoTitleData = {};
            let state: TodoStateData = {};
            let isHoliday: string = null;

            if (todoTitle[parseFormattedDate]) {
                todo = todoTitle[parseFormattedDate];
            }
            if (todoState[parseFormattedDate]) {
                state = todoState[parseFormattedDate]
            }
            if (holiday) {
                isHoliday = holiday[parseFormattedDate];
            }

            const cloneDay = day;
            days.push(
                <div
                    className={`col cell 
                    ${isHoliday ? 'holiday' : ''}
                    ${day.getDay() === 0 ? 'sunday' : ''}
                    ${day.getDay() === 6 ? 'saturday' : ''}
                    ${!isSameMonth(day, monthStart) ? 'disabled'
                            : isSameDay(day, selectedDate) ? 'selected'
                                : format(currentMonth, 'M') !== format(day, 'M') ? 'not-valid'
                                    : 'valid'}
                    ${isSameDay(day, nowDate) ? 'today' : ''}`}
                    key={day.toString()}
                    onClick={() => { onDateClick(cloneDay); cellsClick(); }}
                >
                    <span
                        className={format(currentMonth, 'M') !== format(day, 'M') ? 'text not-valid' : ''}>
                        {formattedDate}
                    </span>
                    {isHoliday && <div className="holiday">{isHoliday}</div>}
                    {
                        Object.keys(todo).map((key, index) => (
                            <div
                                className={`todotitle ${state[key]} ${isSameDay(day, nowDate) ? 'today' : ''}`}
                                key={key}
                            >
                                {index < 4 ? `${index + 1} : ${truncateText(todo[key])}` : ''}
                            </div>
                        ))
                    }
                    {parseFormattedDate in repeatTodo && (
                        <div className='repeat-todo'>
                            {Array.isArray(repeatTodo[parseFormattedDate]) ? (
                                repeatTodo[parseFormattedDate].map((item:any, index:any) => (
                                    <div key={index}>{item}</div>
                                ))
                            ) : (
                                <div>{repeatTodo[parseFormattedDate]}</div>
                            )}
                        </div>
                    )}
                    <div>

                    </div>
                    <div
                        className={Object.keys(todo).length === 0 ? 'not-exist-todo' : 'exist-todo'}>
                        {Object.keys(todo).length}
                    </div>
                </div >
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div
                className='row' key={day.toString()}>
                {days}
            </div>
        )
    }

    return (
        <div className='body'>{rows}</div>
    );
};

export default Cells;
