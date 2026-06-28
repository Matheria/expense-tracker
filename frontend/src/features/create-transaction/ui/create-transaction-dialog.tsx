'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryApi, type Category } from '@/entities/category';
import { transactionApi } from '@/entities/transaction';
import { CategoryIcon } from '@/shared/ui/category-icon';

const transactionSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Введите сумму' }).positive('Сумма должна быть больше 0'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().max(255, 'Максимум 255 символов').optional(),
  date: z.string().min(1, 'Укажите дату'),
  categoryId: z.string().uuid('Выберите категорию'),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CreateTransactionDialogProps {
  onCreated?: () => void;
  /** Custom trigger element. Falls back to a default button. */
  trigger?: React.ReactElement;
}

export function CreateTransactionDialog({ onCreated, trigger }: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '' as unknown as number,
      type: 'EXPENSE',
      description: '',
      date: today(),
      categoryId: '',
    },
  });

  const selectedType = form.watch('type');
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  useEffect(() => {
    if (!open) return;
    let active = true;
    categoryApi
      .list()
      .then(({ data }) => { if (active) setCategories(data); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, [open]);

  async function onSubmit(values: TransactionFormValues) {
    setServerError(null);
    try {
      await transactionApi.create({
        ...values,
        description: values.description || undefined,
        date: values.date + 'T00:00:00.000Z',
      });
      form.reset({ amount: '' as unknown as number, type: 'EXPENSE', description: '', date: today(), categoryId: '' });
      setOpen(false);
      onCreated?.();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setServerError('Сессия истекла. Войдите снова.');
      } else {
        setServerError('Не удалось создать транзакцию. Попробуйте позже.');
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setServerError(null); }}>
      <DialogTrigger render={trigger ?? <Button>Добавить транзакцию</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая транзакция</DialogTitle>
          <DialogDescription>Добавьте доход или расход</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Тип</FormLabel>
                    <FormControl>
                      <Select
                        modal={false}
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue('categoryId', '');
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value) => (value === 'INCOME' ? 'Доход' : 'Расход')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="EXPENSE">Расход</SelectItem>
                          <SelectItem value="INCOME">Доход</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <Select modal={false} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value) =>
                            categories.find((c) => c.id === value)?.name ?? 'Выберите категорию'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.length === 0 ? (
                          <SelectItem value="" disabled>
                            {categories.length === 0
                              ? 'Нет категорий — создайте сначала'
                              : `Нет категорий ${selectedType === 'INCOME' ? 'доходов' : 'расходов'}`}
                          </SelectItem>
                        ) : (
                          filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <span
                                className="inline-flex items-center"
                                style={{ color: category.color }}
                              >
                                <CategoryIcon name={category.icon} size={16} />
                              </span>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Необязательно" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Сохранение...' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
