import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, id, ...props }: Readonly<FormInputProps>) {
  const inputId = id || props.name;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-600'
        }`}
      />
      {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null}
    </div>
  );
}
