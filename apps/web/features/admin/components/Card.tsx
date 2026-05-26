export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-spektr-border rounded-[10px] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
