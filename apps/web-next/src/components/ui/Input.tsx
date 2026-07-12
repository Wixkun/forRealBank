export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2 rounded-lg bg-hover-strong
      placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
    />
  );
}
