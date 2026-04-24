"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  setYear,
  getYear
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";

export function CustomCalendar({ label, value, onChange, align = "left" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsYearSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  
  // Calendar Grid Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="label-2026">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-2026 flex items-center justify-between transition-all"
      >
        <span className={value ? "text-[#1a1610]" : "text-[#9d8351] opacity-50"}>
          {value ? format(selectedDate, "MMMM dd, yyyy") : "Select date"}
        </span>
        <CalendarIcon className="text-[#9d7b32]" size={20} strokeWidth={3} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`absolute z-[110] mt-3 w-screen max-w-[340px] sm:max-w-[400px] overflow-hidden rounded-[32px] border-2 border-[#dfd4bf] bg-white p-6 shadow-premium backdrop-blur-xl ${align === "right" ? "sm:right-0" : "sm:left-0"}`}
          >
            {/* Header */}
            <header className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h3 className="text-xl font-black text-[#1a1610]">{format(currentMonth, "MMMM")}</h3>
                <button 
                  type="button" 
                  onClick={() => setIsYearSelectorOpen(!isYearSelectorOpen)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-lg font-black text-[#9d7b32] hover:bg-[#fdfaf5] transition-colors"
                >
                  {getYear(currentMonth)}
                  <ChevronRight size={16} strokeWidth={3} className={`transform transition-transform ${isYearSelectorOpen ? 'rotate-90' : ''}`} />
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdfaf5] text-[#9d7b32] transition-all hover:bg-[#9d7b32] hover:text-white"
                >
                  <ChevronLeft size={20} strokeWidth={3} />
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdfaf5] text-[#9d7b32] transition-all hover:bg-[#9d7b32] hover:text-white"
                >
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              </div>
            </header>

            {isYearSelectorOpen ? (
              <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(setYear(currentMonth, y));
                      setIsYearSelectorOpen(false);
                    }}
                    className={`flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-all ${
                      getYear(currentMonth) === y
                        ? "bg-[#9d7b32] text-white shadow-md"
                        : "text-[#4a3f2c] hover:bg-[#fdfaf5] hover:text-[#9d7b32]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Days Head */}
                <div className="mb-2 grid grid-cols-7 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9d8351] opacity-60">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => {
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isCurrentMonth = isSameMonth(date, monthStart);
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onChange(format(date, "yyyy-MM-dd"));
                          setIsOpen(false);
                        }}
                        className={`flex aspect-square items-center justify-center rounded-xl text-sm font-bold transition-all ${
                          isSelected
                            ? "bg-[#9d7b32] text-white shadow-lg scale-110"
                            : isCurrentMonth
                            ? "text-[#4a3f2c] hover:bg-[#fdfaf5] hover:text-[#9d7b32]"
                            : "text-[#d6ccb8] hover:bg-[#fdfaf5]"
                        }`}
                      >
                        {format(date, "d")}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            <footer className="mt-6 flex justify-between gap-3">
              <button 
                type="button"
                onClick={() => {
                  onChange(format(new Date(), "yyyy-MM-dd"));
                  setIsOpen(false);
                }}
                className="btn-ghost flex-1 py-3 text-xs font-black uppercase tracking-widest"
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest"
              >
                Apply
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
