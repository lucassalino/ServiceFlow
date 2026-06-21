'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateMinistry, useUpdateMinistry } from '@/hooks/useMinistries';
import { MINISTRY_ICONS, MINISTRY_COLORS } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().min(1, 'Cor obrigatória'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  orgId: string;
  ministry?: Ministry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MinistryDialog({ orgId: _orgId, ministry, open, onOpenChange }: Props) {
  const createMinistry = useCreateMinistry();
  const updateMinistry = useUpdateMinistry();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', icon: MINISTRY_ICONS[0]?.emoji ?? '🎵', color: MINISTRY_COLORS[0] },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  useEffect(() => {
    if (open) {
      reset(ministry
        ? { name: ministry.name, icon: ministry.icon, color: ministry.color }
        : { name: '', icon: MINISTRY_ICONS[0]?.emoji ?? '🎵', color: MINISTRY_COLORS[0] },
      );
    }
  }, [open, ministry, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (ministry) {
        await updateMinistry.mutateAsync({ id: ministry.id, ...data });
        toast.success('Ministério actualizado');
      } else {
        await createMinistry.mutateAsync(data);
        toast.success('Ministério criado');
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao guardar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ministry ? 'Editar Ministério' : 'Novo Ministério'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center py-2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow"
              style={{ backgroundColor: selectedColor + '33', border: `2px solid ${selectedColor}` }}
            >
              {selectedIcon}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Ícone *</Label>
            <div className="flex flex-wrap gap-2">
              {MINISTRY_ICONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setValue('icon', emoji)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors hover:bg-accent',
                    selectedIcon === emoji && 'border-primary bg-accent',
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {errors.icon && <p className="text-xs text-destructive">{errors.icon.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Cor *</Label>
            <div className="flex flex-wrap gap-2">
              {MINISTRY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    selectedColor === color && 'ring-2 ring-ring ring-offset-2 scale-110',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || createMinistry.isPending || updateMinistry.isPending}>
              {isSubmitting ? 'A guardar…' : ministry ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
