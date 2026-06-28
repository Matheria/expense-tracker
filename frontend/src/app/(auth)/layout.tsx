import { Wallet } from 'lucide-react';

import { Globe } from '@/shared/ui/globe';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-card shadow-sm md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-8 text-ink-foreground md:flex">
          <Globe className="pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 text-white/10" />
          <div className="relative flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="size-4.5" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Бюджет</span>
          </div>
          <div className="relative">
            <p className="font-display text-2xl leading-snug font-bold">
              Деньги под контролем — без таблиц и хаоса.
            </p>
            <p className="mt-3 text-sm text-white/50">
              Доходы, расходы и баланс в одном спокойном экране.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
