'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import axios from 'axios';

import { cn } from '@/lib/utils';
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
import { categoryApi } from '@/entities/category';
import { CategoryIcon } from '@/shared/ui/category-icon';
import { CreateCategoryDialog } from '@/features/create-category/ui/create-category-dialog';
import type { Category } from '@/entities/category';

interface ManageCategoriesDialogProps {
  onChanged?: () => void;
  trigger?: React.ReactElement;
}

export function ManageCategoriesDialog({ onChanged, trigger }: ManageCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    categoryApi
      .list()
      .then(({ data }) => { if (active) { setCategories(data); setLoading(false); } })
      .catch(() => { if (active) { setCategories([]); setLoading(false); } });
    return () => { active = false; };
  }, [open]);

  const handleMutated = () => {
    setLoading(true);
    categoryApi
      .list()
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
    onChanged?.();
  };

  function handleOpenChange(v: boolean) {
    if (v) setLoading(true);
    setOpen(v);
  }

  const income = categories.filter((c) => c.type === 'INCOME');
  const expense = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger ?? <Button variant="outline">Категории</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Категории</DialogTitle>
          <DialogDescription>Управление категориями доходов и расходов</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Загрузка…</p>
          ) : (
            <>
              <CategoryGroup
                title="Доходы"
                items={income}
                emptyLabel="Нет категорий доходов"
                onDeleted={handleMutated}
              />
              <CategoryGroup
                title="Расходы"
                items={expense}
                emptyLabel="Нет категорий расходов"
                onDeleted={handleMutated}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <CreateCategoryDialog
            onCreated={handleMutated}
            trigger={
              <Button variant="outline" className="w-full gap-2">
                <Plus size={14} />
                Добавить категорию
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryGroup({
  title,
  items,
  emptyLabel,
  onDeleted,
}: {
  title: string;
  items: Category[];
  emptyLabel: string;
  onDeleted: () => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border">
          {items.map((cat) => (
            <CategoryRow key={cat.id} category={cat} onDeleted={onDeleted} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  onDeleted,
}: {
  category: Category;
  onDeleted: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await categoryApi.remove(category.id);
      setConfirmOpen(false);
      onDeleted();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setErrorMsg('Нельзя удалить категорию: к ней привязаны транзакции.');
      } else {
        setErrorMsg('Не удалось удалить категорию. Попробуйте ещё раз.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <li className="group flex items-center gap-3 px-3 py-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary"
          style={{ color: category.color }}
        >
          <CategoryIcon name={category.icon} size={15} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={cn(
            'shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity',
            'hover:text-destructive focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'group-hover:opacity-100',
          )}
          aria-label="Удалить категорию"
        >
          <Trash2 size={14} />
        </button>
      </li>

      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => { setConfirmOpen(v); if (!v) setErrorMsg(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить категорию?</DialogTitle>
            <DialogDescription>
              {errorMsg ?? `Категория «${category.name}» будет удалена навсегда.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              {errorMsg ? 'Закрыть' : 'Отмена'}
            </Button>
            {!errorMsg && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаление…' : 'Удалить'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
