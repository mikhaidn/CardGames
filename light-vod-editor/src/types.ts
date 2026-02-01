export interface Segment {
  start: number;
  end: number;
  name?: string;
}

export interface VideoFile {
  file: File;
  url: string;
  duration: number;
  width: number;
  height: number;
}

export type ExportMode = 'concat' | 'split';
