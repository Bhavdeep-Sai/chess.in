'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export default function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  const prevValueRef = useRef(value);
  const isIncreasing = value > prevValueRef.current;
  
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  const digits = value.toString().split('');
  
  return (
    <div className={`inline-flex gap-0.5 ${className}`}>
      {digits.map((digit, index) => (
        <div key={index} className="relative overflow-hidden inline-block w-[1ch] text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${digit}-${value}`}
              initial={{ y: isIncreasing ? 40 : -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isIncreasing ? 40 : -40, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8
              }}
              className="block"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
