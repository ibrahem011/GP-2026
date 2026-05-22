import React, { InputHTMLAttributes, useId } from 'react';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export function GlassInput({
    label,
    error,
    icon,
    iconPosition = 'right',
    className = '',
    ...props
}: GlassInputProps) {
    const generatedId = useId();
    const inputId = props.id || generatedId;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm text-gray-400 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'right' && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary">
                        {icon}
                    </div>
                )}

                {icon && iconPosition === 'left' && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={`
            block w-full p-4 text-sm
            glass border-white/10
            text-text-main
            placeholder-text-muted
            focus:ring-2 focus:ring-primary/50 focus:border-primary/50
            outline-none transition-all
            ${icon && iconPosition === 'right' ? 'pr-12' : ''}
            ${icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${error ? 'border-error animate-pulse' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>

            {error && (
                <p className="text-error text-xs mt-1">{error}</p>
            )}
        </div>
    );
}
