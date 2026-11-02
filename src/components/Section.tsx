export function Section({
  title,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <h3 className="text-[17px] font-bold tracking-tight text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}
