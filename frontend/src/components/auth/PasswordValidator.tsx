'use client';

import React from 'react';

interface PasswordValidatorProps {
    value: string;
}

export default function PasswordValidator({ value }: PasswordValidatorProps) {
    const checks = {
        hasMinLength: value.length >= 8,
        hasUpper: /[A-Z]/.test(value),
        hasLower: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^A-Za-z0-9]/.test(value),
    };

    // Compute dynamic strength score index
    const activeCount = Object.values(checks).filter(Boolean).length;

    // Determine progress bar colour layouts dynamically
    const getStrengthConfig = () => {
        if (value.length === 0) {
            return { width: 'w-0', color: 'bg-slate-800', label: 'Empty' };
        }
        if (activeCount <= 2) {
            return { width: 'w-1/4', color: 'bg-rose-500', label: 'Weak' };
        }
        if (activeCount === 3) {
            return { width: 'w-2/4', color: 'bg-amber-500', label: 'Fair' };
        }
        if (activeCount === 4) {
            return { width: 'w-3/4', color: 'bg-blue-500', label: 'Good' };
        }
        return { width: 'w-full', color: 'bg-emerald-500', label: 'Strong' };
    };

    const strength = getStrengthConfig();

    return (
        <div className="mt-2 space-y-3">
            {/* Dynamic Strength Bar Wrapper */}
            <div>
                <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-bold transition-colors duration-200`}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 border border-slate-800/80 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.width} ${strength.color} transition-all duration-300 ease-out`} />
                </div>
            </div>

            {/* Reactive Feedback Checklist */}
            <ul className="text-xs space-y-1 font-sans">
                <li className={`flex items-center space-x-2 ${checks.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{checks.hasMinLength ? '✓' : '✕'}</span>
                    <span>At least 8 characters long</span>
                </li>
                <li className={`flex items-center space-x-2 ${checks.hasUpper && checks.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{checks.hasUpper && checks.hasLower ? '✓' : '✕'}</span>
                    <span>Contains uppercase & lowercase letters</span>
                </li>
                <li className={`flex items-center space-x-2 ${checks.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{checks.hasNumber ? '✓' : '✕'}</span>
                    <span>Contains at least one number (0-9)</span>
                </li>
                <li className={`flex items-center space-x-2 ${checks.hasSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{checks.hasSymbol ? '✓' : '✕'}</span>
                    <span>Contains a special symbol (e.g., @, #, $, %)</span>
                </li>
            </ul>
        </div>
    );
}