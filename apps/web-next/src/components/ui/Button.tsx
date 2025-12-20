export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600
      hover:from-teal-400 hover:to-cyan-500 transition
      text-white font-semibold py-2 rounded-lg shadow-lg
      disabled:opacity-50"
    />
  );
}
