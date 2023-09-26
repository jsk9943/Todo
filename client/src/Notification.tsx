import React, { FC, useEffect, useState } from 'react';
import './Notification.scss';

type StateCount = {
    New: number;
    Progress: number;
    Complete: number;
}
type TodoStateData = {
    [key: string]: any;
}
interface NotificationProps {
    todoState: TodoStateData;
}

const Notification: FC<NotificationProps> = ({ todoState }) => {
    const [newStateBar, setNewStateBar] = useState<number>(0);
    const [progressStateBar, setProgressStateBar] = useState<number>(0);
    const [completeStateBar, setCompleteStateBar] = useState<number>(0);
    // 캘린더 내 상태 count하여 bar로 상태 표시
    useEffect(() => {
        const countByStatus = () => {
            const counts: StateCount = {
                New: 0,
                Progress: 0,
                Complete: 0,
            };
            for (const date in todoState) {
                const tasks = todoState[date];
                for (const taskKey in tasks) {
                    const taskStatus = tasks[taskKey];
                    if (taskStatus === 'New') {
                        counts.New++;
                    } else if (taskStatus === 'Progress') {
                        counts.Progress++;
                    } else if (taskStatus === 'Complete') {
                        counts.Complete++;
                    }
                }
            }

            return counts;
        };
        const stateCount: StateCount = countByStatus();
        const totalStateBar = stateCount.New + stateCount.Progress + stateCount.Complete;
        setNewStateBar(stateCount.New / totalStateBar * 100);
        setProgressStateBar(stateCount.Progress / totalStateBar * 100);
        setCompleteStateBar(stateCount.Complete / totalStateBar * 100);
    }, [todoState]);

    //동적으로 bar 길이 변경
    const newContainerStyle = {
        width: `${newStateBar}%`,
    };

    const progContainerStyle = {
        width: `${progressStateBar}%`,
    };

    const compContainerStyle = {
        width: `${completeStateBar}%`,
    };

    return (
        <div
            className={`noti-container
        ${isNaN(completeStateBar) && isNaN(completeStateBar) && isNaN(completeStateBar) ? 'state-null' : ''}
        `}>
            {isNaN(completeStateBar) && isNaN(completeStateBar) && isNaN(completeStateBar) ? (
                <div></div>
            ) : (
                <div className='state-container'>
                    <div className='new-container' style={newContainerStyle}>N</div>
                    <div className='prog-container' style={progContainerStyle}>P</div>
                    <div className='comp-container' style={compContainerStyle}>C</div>
                </div>
            )}
        </div >
    )
}

export default Notification;