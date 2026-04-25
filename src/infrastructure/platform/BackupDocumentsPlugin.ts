import { registerPlugin } from '@capacitor/core';

export interface SaveBackupDocumentOptions {
  sourceUri: string;
  filename: string;
  mimeType?: string;
}

export interface SaveBackupDocumentResult {
  uri: string;
  filename: string;
}

export interface OpenBackupDocumentOptions {
  mimeTypes?: string[];
}

export interface OpenBackupDocumentResult {
  uri: string;
  name: string;
  content: string;
  mimeType?: string;
  size?: number;
}

interface BackupDocumentsPlugin {
  saveBackupDocument(options: SaveBackupDocumentOptions): Promise<SaveBackupDocumentResult>;
  openBackupDocument(options?: OpenBackupDocumentOptions): Promise<OpenBackupDocumentResult>;
}

export const BackupDocuments = registerPlugin<BackupDocumentsPlugin>('BackupDocuments');
