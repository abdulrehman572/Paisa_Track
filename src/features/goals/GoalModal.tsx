import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, minorToMajor } from '../../lib/money';
import { formatDateInput, parseDateInput } from '../../lib/dates';
import { Goal, GoalType, Account, Settings } from '../../types';

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  accounts: Account[];
  settings: Settings;
  onSave: (goal: Goal) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  accounts,
  settings,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [savedStr, setSavedStr] = useState('0');
  const [type, setType] = useState<GoalType>('general');
  const [deadlineStr, setDeadlineStr] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [color, setColor] = useState('#10B981');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetStr(minorToMajor(goalToEdit.target_minor, settings.base_currency).toString());
      setSavedStr(minorToMajor(goalToEdit.saved_minor, settings.base_currency).toString());
      setType(goalToEdit.type);
      setDeadlineStr(goalToEdit.deadline ? formatDateInput(goalToEdit.deadline) : '');
      setLinkedAccountId(goalToEdit.linked_account_id || '');
      setColor(goalToEdit.color || '#10B981');
    } else {
      setName('');
      setTargetStr('');
      setSavedStr('0');
      setType('general');
      setDeadlineStr('');
      setLinkedAccountId(accounts[0]?.id || '');
      setColor('#10B981');
    }
    setError(null);
  }, [goalToEdit, isOpen, accounts, settings.base_currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a goal name.');
      return;
    }

    const targetMinor = parseMoneyToMinor(targetStr, settings.base_currency);
    const savedMinor = parseMoneyToMinor(savedStr, settings.base_currency);

    if (targetMinor <= 0) {
      setError('Target amount must be greater than 0.');
      return;
    }

    const goal: Goal = {
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      name: name.trim(),
      target_minor: targetMinor,
      saved_minor: savedMinor,
      deadline: deadlineStr ? parseDateInput(deadlineStr) : null,
      linked_account_id: linkedAccountId || null,
      type,
      icon: type === 'emergency_fund' ? 'ShieldAlert' : 'Target',
      color,
      created_at: goalToEdit ? goalToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(goal);
    onClose();
  };

  const colors = ['#10B981', '#4EA8DE', '#2E5EAA', '#9B6BFF', '#FF6B9E', '#FF8A5B'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Goal Name
          </label>
          <input
            type="text"
            placeholder="e.g. Emergency Fund or Vacation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Goal Type */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('general')}
            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
              type === 'general'
                ? 'border-[#2E5EAA] bg-[#2E5EAA]/10 text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600'
            }`}
          >
            General Goal
          </button>
          <button
            type="button"
            onClick={() => setType('emergency_fund')}
            className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
              type === 'emergency_fund'
                ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600'
            }`}
          >
            Emergency Fund
          </button>
        </div>

        {/* Target & Initial Saved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Already Saved
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={savedStr}
              onChange={(e) => setSavedStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Target Deadline */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Target Deadline (Optional)
          </label>
          <input
            type="date"
            value={deadlineStr}
            onChange={(e) => setDeadlineStr(e.target.value)}
            className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {goalToEdit ? 'Save Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
