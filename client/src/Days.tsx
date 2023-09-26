import React, { memo } from 'react';

//캘린더 요일 표기
const Days = memo(function Days() {
  const days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className='days row'>
      <div className="coldays">
        {days.map((day, index) => (
          <div className={`day ${day === 'Sun' ? 'sunday' : day === 'Sat' ? 'saturday' : ''}`} key={index}>
            {day}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Days