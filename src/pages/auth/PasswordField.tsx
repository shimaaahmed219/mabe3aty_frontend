import { useState, type ChangeEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authInputClass } from './AuthShell';

const toggleBtnClass =
  'absolute end-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete: string;
  placeholder?: string;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = '••••••••',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${authInputClass} pe-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={toggleBtnClass}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} /> : <Eye className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}
