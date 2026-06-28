import { RegisterForm } from '@/features/auth/ui/register-form';

export function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold tracking-tight">Регистрация</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Создайте новый аккаунт</p>
      <RegisterForm />
    </div>
  );
}
