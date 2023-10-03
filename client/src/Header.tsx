import React, { FC, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { format, addMonths, subMonths } from 'date-fns';
import { GrLogout, GrLinkNext, GrLinkPrevious } from 'react-icons/gr';
import { BsSendCheck } from 'react-icons/bs';
import axios from 'axios';
import './Header.scss';

interface HeaderProps {
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    shareTodoCheck:boolean;
    setShareTodoCheck: React.Dispatch<React.SetStateAction<boolean>>;
    prevMonth: () => void;
    nextMonth: () => void;
}

const Header: FC<HeaderProps> = ({ currentMonth, setCurrentMonth, shareTodoCheck, setShareTodoCheck, prevMonth, nextMonth }) => {
    const [cookies] = useCookies(['token']);
    const [shareDataCheck, setShareDataCheck] = useState<boolean>(null);
    const [touchStartX, setTouchStartX] = useState(null);
    const [, setTouchEndX] = useState(null);
    const navigate = useNavigate();

    // 터치 이벤트
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    }
    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const distance = currentX - touchStartX;
        if (distance > 50) {
            prevMonth();
        } else if (distance < -50) {
            nextMonth();
        }
    }
    //버튼으로 달력 넘기기
    const formattedMonth = useMemo(() => {
        return format(currentMonth, "M월");
    }, [currentMonth]);

    const formattedYear = useMemo(() => {
        return format(currentMonth, "yyyy년");
    }, [currentMonth]);

    const handleTouchEnd = () => {
        setTouchEndX(null);
    }
    //터치로 달력 넘기기
    const prevMonthClick = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    }
    const nextMonthClick = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    }
    //로그아웃
    const logoutBtnClick = async () => {
        const logoutResult = window.confirm(`로그아웃 하시겠습니까?\n저장하지 않은 정보는 삭제 될 수 있습니다`);
        if (logoutResult) {
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/todo.logout`, cookies, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.data) {
                alert('로그아웃 되었습니다');
                navigate('/');
            } else {
                alert(response.data);
            }
        }
    }
    //쉐어 내용 열어보기
    const shareTodoOpen = () => {
        setShareTodoCheck(true);
    }

    useEffect(() => {
        const fetch = async () => {
            const response = await axios.get(`${process.env.REACT_APP_SERVER}/todo.share.get?loginId=${cookies.token.loginID}`);
            if (!response.data) {
                setShareDataCheck(response.data);
            } else {
                setShareDataCheck(response.data);
            }
        }
        fetch();
    }, [currentMonth, shareTodoCheck]);

    return (
        <div className="header row"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            <div className="col-first">
                <span className="text">
                    <span className="text month">
                        {formattedYear}
                    </span>
                    {formattedMonth}
                </span>
            </div>
            <div className="col-end">
                <BsSendCheck
                    className={`shareCheckIcon ${shareDataCheck ? "true" : "false"}`}
                    onClick={() => { shareTodoOpen(); }}
                />
                <GrLogout
                    size={50}
                    onClick={() => { logoutBtnClick(); }}
                />
                <GrLinkPrevious
                    onClick={() => { prevMonthClick(); }}
                />
                <GrLinkNext
                    onClick={() => { nextMonthClick(); }}
                />
            </div>
        </div>
    );
};

export default Header;