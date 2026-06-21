'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { Event } from '@/types/models';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const eventSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  location: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventDialogProps {
  event?: Event | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function EventDialog({ event, open, onOpenChange }: EventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as never,
    defaultValues: {
      name: '',
      date: '',
      time: '',
      location: '',
      color: '',
      description: '',
      observations: '',
      is_published: false,
    },
  });

  const isPublished = watch('is_published');

  useEffect(() => {
    if (open) {
      if (event) {
        reset({
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location ?? '',
          color: event.color ?? '',
          description: event.description ?? '',
          observations: event.observations ?? '',
          is_published: event.is_published,
        });
      } else {
        reset({
          name: '',
          date: '',
          time: '',
          location: '',
          color: '',
          description: '',
          observations: '',
          is_published: false,
        });
      }
    }
  }, [open, event, reset]);

  async function onSubmit(values: EventFormValues) {
    const payload = {
      ...values,
      location: values.location || null,
      color: values.color || null,
      description: values.description || null,
      observations: values.observations || null,
    };

    if (isEditing && event) {
      updateEvent.mutate(
        { id: event.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Evento atualizado com sucesso.');
            onOpenChange(false);
          },
          onError: () => {
            toast.error('Erro ao atualizar evento.');
          },
        },
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          toast.success('Evento criado com sucesso.');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Erro ao criar evento.');
        },
      });
    }
  }

  const isPending = createEvent.isPending || updateEvent.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input id="name" placeholder="Nome do evento" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">
                Data <span className="text-destructive">*</span>
              </Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time">
                Horário <span className="text-destructive">*</span>
              </Label>
              <Input id="time" type="time" {...register('time')} />
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Local</Label>
            <Input id="location" placeholder="Local do evento" {...register('location')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                className="h-10 w-16 cursor-pointer p-1"
                {...register('color')}
              />
              <Input
                placeholder="#000000"
                className="flex-1"
                {...register('color')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do evento"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Observações internas"
              rows={3}
              {...register('observations')}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_published"
              checked={isPublished}
              onCheckedChange={(checked) =>
                setValue('is_published', checked === true)
              }
            />
            <Label htmlFor="is_published" className="cursor-pointer">
              Publicar evento
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
