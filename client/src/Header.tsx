import React, { FC, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import { GrLogout, GrLinkNext, GrLinkPrevious } from 'react-icons/gr';
import axios from 'axios';

interface HeaderProps {
    cookies: { token?: string; };
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    prevMonth: () => void;
    nextMonth: () => void;
}

const Header: FC<HeaderProps> = ({ cookies, currentMonth, setCurrentMonth, prevMonth, nextMonth }) => {
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