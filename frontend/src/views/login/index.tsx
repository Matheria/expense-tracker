import { LoginForm } from '@/features/auth/ui/login-form';

export function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold tracking-tight">Вход</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Войдите в свой аккаунт</p>
      <LoginForm />
    </div>
  );
}
