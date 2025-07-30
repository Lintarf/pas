import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

// Helper to format date as YYYY-MM-DD for input values
const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    // Adjust for timezone to get the correct YYYY-MM-DD
    const temp = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
    return temp.toISOString().split('T')[0];
};

// Helper to parse date string without timezone issues
const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString + 'T00:00:00'); // Assume local timezone
};


// Helper to format date for display
const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseDateString(dateString);
    return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
};


const DateRangePicker: React.FC<{
    startDate: string;
    endDate: string;
    onApply: (start: string, end:string) => void;
}> = ({ startDate, endDate, onApply }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState<Date | null>(parseDateString(startDate));
    const [tempEndDate, setTempEndDate] = useState<Date | null>(parseDateString(endDate));
    
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const pickerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                handleCancel();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);
    
    // Sync with props
    useEffect(() => {
        setTempStartDate(parseDateString(startDate));
        setTempEndDate(parseDateString(endDate));
    }, [startDate, endDate]);

    const handleApply = () => {
        onApply(formatDateForInput(tempStartDate), formatDateForInput(tempEndDate));
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempStartDate(parseDateString(startDate));
        setTempEndDate(parseDateString(endDate));
        setIsOpen(false);
    };

    const handleDateClick = (day: Date) => {
        if (!tempStartDate || (tempStartDate && tempEndDate)) {
            setTempStartDate(day);
            setTempEndDate(null);
        } else if (day < tempStartDate) {
            setTempStartDate(day);
        } else {
            setTempEndDate(day);
        }
    };
    
    const handlePreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        setTempStartDate(start);
        setTempEndDate(end);
        setCurrentMonth(end);
    };

    const generateCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const calendarDays: (Date | null)[] = Array(firstDayOfMonth).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push(new Date(year, month, i));
        }
        return calendarDays;
    };
    
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    
    const calendarDays = generateCalendar(currentMonth);
    const displayMonth = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const getButtonText = () => {
        if (startDate && endDate) {
            return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
        }
        return "Select Date Range";
    };

    return (
        <div className="relative" ref={pickerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-x-1.5 px-3 py-1.5 border border-gray-600 text-xs font-medium rounded-lg shadow-sm text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900"
            >
                <CalendarIcon className="w-4 h-4 text-gray-400"/>
                <span className="truncate">{getButtonText()}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-80 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-700 text-gray-300"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <span className="font-bold text-sm text-white">{displayMonth}</span>
                        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-700 text-gray-300"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1.5">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="font-medium">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 text-center">
                        {calendarDays.map((day, index) => {
                            if (!day) return <div key={index} />;

                            const dayTime = day.getTime();
                            const isSelectedStart = tempStartDate && day.toDateString() === tempStartDate.toDateString();
                            const isSelectedEnd = tempEndDate && day.toDateString() === tempEndDate.toDateString();
                            const isInRange = tempStartDate && tempEndDate && dayTime > tempStartDate.getTime() && dayTime < tempEndDate.getTime();

                            let buttonClass = `w-7 h-7 flex items-center justify-center mx-auto text-xs transition-colors rounded-full`;

                            if (isSelectedStart || isSelectedEnd) {
                                buttonClass += ` bg-red-600 text-white font-bold`;
                            } else if (isInRange) {
                                buttonClass += ` bg-red-800/70 text-gray-100 rounded-none`;
                            } else {
                                buttonClass += ` hover:bg-gray-700 text-gray-200`;
                            }
                            
                            let containerClass = "py-0.5";
                            if (isInRange) {
                                containerClass += " bg-red-800/70";
                            } else if (isSelectedStart && tempEndDate) {
                                containerClass += " bg-gradient-to-l from-red-800/70 to-transparent";
                            } else if (isSelectedEnd) {
                                containerClass += " bg-gradient-to-r from-red-800/70 to-transparent";
                            }

                            return (
                                <div key={index} className={containerClass}>
                                    <button onClick={() => handleDateClick(day)} className={buttonClass}>
                                        {day.getDate()}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-gray-700 mt-4 pt-4 grid grid-cols-2 gap-2 text-sm">
                        <button onClick={() => handlePreset(7)} className="p-2 text-center text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md">Last 7 Days</button>
                        <button onClick={() => handlePreset(30)} className="p-2 text-center text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md">Last 30 Days</button>
                        <button onClick={() => { setTempStartDate(null); setTempEndDate(null); }} className="p-2 text-center text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md col-span-2">Clear Selection</button>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700">Cancel</button>
                        <button onClick={handleApply} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
