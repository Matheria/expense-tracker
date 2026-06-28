import { Globe } from '@/shared/ui/globe';

interface TipCardProps {
  /** Largest spending category, if known — makes the tip concrete. */
  topCategory?: string;
}

export function TipCard({ topCategory }: TipCardProps) {
  const body = topCategory
    ? `Больше всего уходит на «${topCategory}». Поставьте лимит на эту категорию и проверяйте остаток раз в неделю.`
    : 'Записывайте каждую трату в день, когда она случилась — так баланс всегда отражает реальность.';

  return (
    <section className="relative shrink-0 overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground">
      <Globe className="pointer-events-none absolute -right-8 -bottom-10 h-44 w-44 text-white/10" />
      <div className="relative">
        <p className="text-xs font-medium tracking-wide text-white/50 uppercase">Совет недели</p>
        <p className="mt-3 max-w-[18rem] font-display text-sm leading-snug font-semibold">{body}</p>
      </div>
    </section>
  );
}
