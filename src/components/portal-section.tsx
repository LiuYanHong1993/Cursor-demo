export function PortalSection({
  title,
  lead,
  items,
}: {
  title: string;
  lead: string;
  items: { title: string; meta: string; body: string }[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl text-[#0b3d4a]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{lead}</p>
      <div className="mt-8 space-y-6">
        {items.map((item) => (
          <article key={item.title} className="border-b border-teal-900/10 pb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium text-slate-900">{item.title}</h2>
              <span className="text-xs text-slate-500">{item.meta}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
