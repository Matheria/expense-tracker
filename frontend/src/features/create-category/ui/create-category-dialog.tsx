'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Heart,
  Plane,
  Gamepad2,
  BookOpen,
  Shirt,
  Dumbbell,
  Coffee,
  Music,
  Gift,
  Briefcase,
  Wrench,
  Smartphone,
  Baby,
  PawPrint,
  Landmark,
  Zap,
  type LucideProps,
} from 'lucide-react';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { categoryApi } from '@/entities/category';

type IconEntry = {
  name: string;
  component: React.FC<LucideProps>;
};

const ICONS: IconEntry[] = [
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Utensils', component: Utensils },
  { name: 'Car', component: Car },
  { name: 'Home', component: Home },
  { name: 'Heart', component: Heart },
  { name: 'Plane', component: Plane },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Shirt', component: Shirt },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Coffee', component: Coffee },
  { name: 'Music', component: Music },
  { name: 'Gift', component: Gift },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Wrench', component: Wrench },
  { name: 'Smartphone', component: Smartphone },
  { name: 'Baby', component: Baby },
  { name: 'PawPrint', component: PawPrint },
  { name: 'Landmark', component: Landmark },
  { name: 'Zap', component: Zap },
];

const ICON_MAP = Object.fromEntries(ICONS.map((i) => [i.name, i.component]));

function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon {...props} /> : null;
}

const categorySchema = z.object({
  name: z.string().min(1, 'Введите название').max(50, 'Максимум 50 символов'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Цвет в формате #RRGGBB'),
  icon: z.string().min(1, 'Выберите иконку').max(50, 'Максимум 50 символов'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CreateCategoryDialogProps {
  onCreated?: () => void;
  trigger?: React.ReactElement;
}

export function CreateCategoryDialog({ onCreated, trigger }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color: '#3b82f6', icon: 'ShoppingCart' },
  });

  async function onSubmit(values: CategoryFormValues) {
    setServerError(null);
    try {
      await categoryApi.create(values);
      form.reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setServerError('Сессия истекла. Войдите снова.');
      } else {
        setServerError('Не удалось создать категорию. Попробуйте позже.');
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline">Категории</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая категория</DialogTitle>
          <DialogDescription>Создайте категорию для транзакций</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Продукты" className="h-7 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Цвет</FormLabel>
                    <FormControl>
                      <Input type="color" className="h-9 w-9 cursor-pointer p-1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Иконка</FormLabel>
                    <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                      <PopoverTrigger
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                        aria-label="Выбрать иконку"
                      >
                        <CategoryIcon name={field.value} size={18} />
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-2" align="start">
                        <div className="grid grid-cols-5 gap-1">
                          {ICONS.map(({ name, component: Icon }) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                field.onChange(name);
                                setIconPopoverOpen(false);
                              }}
                              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent ${
                                field.value === name ? 'bg-accent' : ''
                              }`}
                              aria-label={name}
                            >
                              <Icon size={16} />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
