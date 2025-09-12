import React from 'react';

interface InputFieldProps {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  isTextArea?: boolean;
  helpText?: string;
  min?: string | number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type,
  value,
  onChange,
  required = false,
  autoComplete = 'off',
  placeholder,
  isTextArea = false,
  helpText,
  min,
}) => {
  const InputComponent = isTextArea ? 'textarea' : 'input';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <InputComponent
        id={id}
        type={type}
        autoComplete={autoComplete}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-800 bg-gray-100 placeholder-gray-500" 
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={isTextArea ? 4 : undefined}
        min={min}
      />
      {helpText && <p className="mt-2 text-sm text-gray-500">{helpText}</p>} 
    </div>
  );
};

export default InputField;
