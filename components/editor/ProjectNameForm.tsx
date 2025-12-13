/**
 * Project Name Form Component
 * 
 * Modal/dialog for creating or renaming a project.
 * 
 * Stage 1 Module 1: Project System
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjectStore } from '@/lib/store/project-store';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectNameFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialDescription?: string;
  onCreateProject?: (name: string, description?: string) => void; // Optional custom create handler (for demo mode)
}

export function ProjectNameForm({
  open,
  onOpenChange,
  initialName = '',
  initialDescription = '',
  onCreateProject,
}: ProjectNameFormProps) {
  const { createProject, updateProject, currentProject } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialName || currentProject?.name || '',
      description: initialDescription || currentProject?.description || '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      if (currentProject) {
        // Update existing project
        updateProject({
          name: data.name,
          description: data.description,
        });
      } else {
        // Create new project (use custom handler if provided, e.g., for demo mode)
        if (onCreateProject) {
          onCreateProject(data.name, data.description);
        } else {
          createProject(data.name, data.description);
        }
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentProject ? 'Rename Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {currentProject
              ? 'Update your project name and description.'
              : 'Give your project a name to get started.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="My Awesome Website"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="A brief description of your project..."
              rows={3}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : currentProject ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

