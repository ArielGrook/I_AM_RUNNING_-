import { z } from 'zod';

// Component Schema
export const ComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.enum(['header', 'hero', 'footer', 'section', 'button', 'form', 'navigation', 'custom']),
  props: z.record(z.any()).optional(),
  children: z.array(z.lazy(() => ComponentSchema)).optional(),
  styles: z.record(z.string()).optional(),
  thumbnail: z.string().optional(), // Base64 image for visual library
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional()
});

// Page Schema
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  components: z.array(ComponentSchema),
  styles: z.string().optional(),
  scripts: z.string().optional(),
  meta: z.record(z.string()).optional()
});

// Style Variant Schema
export const StyleVariantSchema = z.enum(['minimal', 'modern', 'classic', 'bold', 'elegant', 'playful']);

// Color Token Schema
export const ColorTokenSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string()
});

// Project Schema
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pages: z.array(PageSchema),
  globalStyles: z.string().optional(),
  globalScripts: z.string().optional(),
  assets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number().optional()
  })).optional(),
  settings: z.object({
    favicon: z.string().optional(),
    language: z.string().default('en'),
    theme: z.object({
      colors: ColorTokenSchema.optional(),
      fonts: z.object({
        heading: z.string().optional(),
        body: z.string().optional()
      }).optional()
    }).optional()
  }).optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.string().default('1.0.0'),
    userId: z.string().optional()
  })
});

// Type exports
export type Component = z.infer<typeof ComponentSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type StyleVariant = z.infer<typeof StyleVariantSchema>;
export type ColorToken = z.infer<typeof ColorTokenSchema>;
export type Category = Component['category'];

// Save Status Type
export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';

// Project Context Type
export interface ProjectContextType {
  currentProject: Project | null;
  currentPage: Page | null;
  projects: Project[];
  saveStatus: SaveStatus;
  isLoading: boolean;
  error: string | null;
  
  // Project operations
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (project: Partial<Project>) => Promise<void>;
  loadProject: (id: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  
  // Page operations
  setCurrentPage: (pageId: string) => void;
  createPage: (page: Omit<Page, 'id'>) => Promise<Page>;
  updatePage: (pageId: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  
  // Component operations
  addComponent: (pageId: string, component: Component) => Promise<void>;
  updateComponent: (pageId: string, componentId: string, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (pageId: string, componentId: string) => Promise<void>;
  moveComponent: (pageId: string, componentId: string, newPosition: number) => Promise<void>;
  
  // Import/Export
  exportProject: () => Promise<Blob>;
  importProject: (file: File) => Promise<Project>;
  
  // Auto-save
  enableAutoSave: (interval?: number) => void;
  disableAutoSave: () => void;
}

