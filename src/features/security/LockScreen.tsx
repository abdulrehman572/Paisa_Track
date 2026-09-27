import React, { useState } from 'react';
import { Shield, Fingerprint, Delete, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface LockScreenProps {
  correctPin?: string;
  biometricEnabled?: boolean;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  correctPin,
  biometricEnabled = true,
  onUnlock,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);

      if (next.length === 4) {
        if (!correctPin || next === correctPin) {
          onUnlock();
        } else {
          setErrorShake(true);
          setTimeout(() => {
            setErrorShake(false);
            setEnteredPin('');
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricSimulation = () => {
    // Instant simulated biometric auth
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA]/95 dark:bg-[#0F1115]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* App Icon Lock Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#2E5EAA] dark:bg-[#5B8DEF] text-white dark:text-slate-950 flex items-center justify-center shadow-lg mb-4">
          <Lock size={28} strokeWidth={2.5} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">PaisaTrack Locked</h2>
        <p className="text-xs text-slate-400 mt-1 mb-8">Enter your 4-digit PIN to continue</p>

        {/* PIN Dot Indicators */}
        <div
          className={`flex items-center gap-4 mb-8 transition-transform ${
            errorShake ? 'animate-bounce text-[#D64545]' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-[#2E5EAA] dark:bg-[#5B8DEF] scale-125'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-white dark:bg-[#1A1D23] border border-slate-200/80 dark:border-slate-800 text-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            type="button"
            onClick={handleBiometricSimulation}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:text-[#2E5EAA] dark:hover:text-[#5B8DEF] transition-colors cursor-pointer"
            title="Biometric unlock"
          >
            <Fingerprint size={28} />
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white dark:bg-[#1A1D23] border border-slate-200/80 dark:border-slate-800 text-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Delete backspace */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Delete"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
