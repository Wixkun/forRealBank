import { Input } from '@/components/ui/Input';

type Props = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, error, ...props }: Props) {
  return (
    <div>
      <label className="block text-sm mb-1 text-gray-200">{label}</label>
      <Input {...props} />
      {error && <p className="text-red-300 text-xs mt-1">{error}</p>}
    </div>
  );
}
