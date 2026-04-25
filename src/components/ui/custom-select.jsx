"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt === value || (opt.value && opt.value === value));
  const displayText = selectedOption?.label || selectedOption || placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="label-2026">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${compact ? "h-[44px] rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm font-semibold text-[#1A1A2E]" : "input-2026"} flex items-center justify-between transition-all ${
          isOpen ? "border-[#9d7b32] ring-4 ring-[#9d7b32]/10" : ""
        }`}
      >
        <span className={value ? "text-[#1a1610]" : "text-[#9d8351] opacity-50"}>
          {displayText}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-[#9d7b32]"
        >
          <ChevronDown size={20} strokeWidth={3} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[100] mt-3 w-full overflow-hidden rounded-[24px] border-2 border-[#dfd4bf] bg-white/95 p-2 shadow-premium backdrop-blur-xl"
          >
            {options.map((option, index) => {
              const optValue = option.value !== undefined ? option.value : option;
              const optLabel = option.label !== undefined ? option.label : option;
              const isSelected = value === optValue;

              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-bold transition-all ${
                      isSelected 
                        ? "bg-[#9d7b32] text-white" 
                        : "text-[#4a3f2c] hover:bg-[#fdfaf5] hover:text-[#9d7b32]"
                    }`}
                  >
                    {optLabel}
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
