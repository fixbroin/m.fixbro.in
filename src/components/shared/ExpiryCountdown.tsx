
"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiryCountdownProps {
  expiryDate: Date;
  className?: string;
}

const ExpiryCountdown: React.FC<ExpiryCountdownProps> = ({ expiryDate, className }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiryDate) - +new Date();
      let timeLeftString = '';

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        if (days > 0) {
          timeLeftString = `${days}d ${hours}h left`;
        } else {
          timeLeftString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        setIsExpired(false);
      } else {
        timeLeftString = 'Expired';
        setIsExpired(true);
      }
      
      setTimeLeft(timeLeftString);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (isExpired) {
    return (
        <div className={cn("flex items-center gap-1.5 text-xs text-destructive", className)}>
            <Clock className="h-3 w-3" />
            <span>Access Expired</span>
        </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      <Clock className="h-3 w-3" />
      <span>Access expires: {timeLeft}</span>
    </div>
  );
};

export default ExpiryCountdown;
