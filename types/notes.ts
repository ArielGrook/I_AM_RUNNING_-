export type NoteColorName =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export interface NoteFrontmatter {
  id: string;
  title: string;
  color: NoteColorName;
  tags: string[];
  pinned: boolean;
  created: string;
  updated: string;
  attachments: string[];
}

export interface NoteRecord {
  id: string;
  title: string;
  color: NoteColorName;
  tags: string[];
  pinned: boolean;
  created: string;
  updated: string;
  attachments: string[];
  content: string;
}

export interface NoteConflictPayload {
  conflict: true;
  remoteUpdated: string;
}
