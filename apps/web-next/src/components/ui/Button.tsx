export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full bg-primary hover:bg-primary-hover transition
      text-white font-semibold py-2 rounded-lg shadow-lg
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
      focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0
      disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}
