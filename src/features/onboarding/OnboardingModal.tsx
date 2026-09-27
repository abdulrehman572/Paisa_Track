import React, { useState } from 'react';
import { ShieldCheck, Database, PieChart, Coins, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SUPPORTED_CURRENCIES } from '../../lib/money';

export interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: (selectedCurrency: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currency, setCurrency] = useState('USD');

  if (!isOpen) return null;

  const slides = [
    {
      icon: Database,
      title: '100% Offline & Local-First',
      description:
        'PaisaTrack runs completely on your device without cloud servers, external AI keys, or third-party tracking. Your financial privacy is guaranteed.',
      color: '#2E5EAA',
    },
    {
      icon: PieChart,
      title: 'Real-Time Budgeting & Goals',
      description:
        'Track multiple accounts, set zero-based envelope budgets, plan debt payoff with Avalanche and Snowball calculators, and analyze spending habits.',
      color: '#1F9D55',
    },
    {
      icon: Coins,
      title: 'Select Your Base Currency',
      description:
        'Choose your primary home currency for net worth calculations, accounts, and monthly financial statements.',
      color: '#9B6BFF',
      isCurrencyStep: true,
    },
  ];

  const slide = slides[currentStep];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish(currency);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between min-h-[420px]">
        {/* Top skip button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === i
                    ? 'w-6 bg-[#2E5EAA] dark:bg-[#5B8DEF]'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onFinish(currency)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
          >
            Skip
          </button>
        </div>

        {/* Slide Body */}
        <div className="text-center py-4 flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: `${slide.color}20`, color: slide.color }}
          >
            <Icon size={32} strokeWidth={2.2} />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {slide.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            {slide.description}
          </p>

          {/* Currency selection on last step */}
          {slide.isCurrencyStep && (
            <div className="w-full mt-5 max-w-xs">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c} ({SUPPORTED_CURRENCIES[c].symbol}) - {SUPPORTED_CURRENCIES[c].name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="pt-4">
          <Button onClick={handleNext} fullWidth size="lg">
            {currentStep === slides.length - 1 ? (
              <>
                <Check size={16} className="mr-1.5" />
                Get Started
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} className="ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
