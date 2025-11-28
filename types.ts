export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string; // Markdown or plain text
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface KnowledgeBaseData {
  categories: string[];
  items: KnowledgeItem[];
}

export enum AppView {
  LIST = 'LIST',
  DETAIL = 'DETAIL',
  EDIT = 'EDIT',
  CREATE = 'CREATE'
}

export interface QiniuConfig {
  accessKey: string;
  secretKey: string;
  bucket: string;
  domain: string;
  region: string; // 'z0', 'z1', 'z2', 'na0', 'as0'
  filename: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  expiry: number;
}