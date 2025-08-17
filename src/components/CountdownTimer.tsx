import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CountdownTimerProps {
  compact?: boolean;
}

const CountdownTimer = ({ compact = false }: CountdownTimerProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const weddingDate = new Date('2025-09-06T13:00:00');
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    // Navigate to Home when countdown is clicked
    navigate('/');
  };

  if (compact) {
    return (
      <button 
        onClick={handleClick}
        className="text-xs font-mono hover:text-blue-600 transition-colors cursor-pointer"
        title="Klik om naar Home te gaan"
      >
        {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m {timeLeft.seconds}s
      </button>
    );
  }

  return (
    <div className="countdown-container text-center mb-4 px-3">
      <h2 className="text-lg sm:text-xl font-bold mb-6 text-blue-600">
        Resterende tijd als vrij man
      </h2>
      <button 
        onClick={handleClick}
        className="countdown-display grid grid-cols-4 gap-2 sm:gap-3 max-w-md sm:max-w-lg mx-auto hover:scale-105 transition-transform cursor-pointer group"
        title="Klik om naar je Home te gaan"
      >
        <div className="time-unit bg-white/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow-lg group-hover:border-blue-400 group-hover:shadow-blue-200 transition-all min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{timeLeft.days}</div>
          <div className="text-[10px] sm:text-sm text-blue-600 font-medium leading-tight text-center break-words">dagen</div>
        </div>
        <div className="time-unit bg-white/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow-lg group-hover:border-blue-400 group-hover:shadow-blue-200 transition-all min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{timeLeft.hours}</div>
          <div className="text-[10px] sm:text-sm text-blue-600 font-medium leading-tight text-center break-words">uren</div>
        </div>
        <div className="time-unit bg-white/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow-lg group-hover:border-blue-400 group-hover:shadow-blue-200 transition-all min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{timeLeft.minutes}</div>
          <div className="text-[10px] sm:text-sm text-blue-600 font-medium leading-tight text-center break-words">min</div>
        </div>
        <div className="time-unit bg-white/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow-lg group-hover:border-blue-200 transition-all min-w-[70px]">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{timeLeft.seconds}</div>
          <div className="text-[10px] sm:text-sm text-blue-600 font-medium leading-tight text-center break-words">sec</div>
        </div>
      </button>

    </div>
  );
};

export default CountdownTimer;