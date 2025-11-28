import { KnowledgeBaseData } from './types';

// The pre-set password
export const ACCESS_PASSWORD = '123456ss@';

export const DEFAULT_CATEGORIES = [
  '前端开发',
  '后端架构',
  'DevOps',
  '数据库',
  '算法与数据结构',
  '工具效能',
  '政策法规',
  '其他'
];

// Initial Mock Data (Simulating a static database)
export const INITIAL_DATA: KnowledgeBaseData = {
  categories: DEFAULT_CATEGORIES,
  items: [
    {
      id: '1',
      title: 'React Hooks 最佳实践指南',
      category: '前端开发',
      tags: ['React', 'Hooks', 'Performance'],
      content: `# React Hooks 最佳实践

在开发 React 应用时，遵循 Hooks 规则至关重要。

## 1. 只在顶层调用 Hooks
不要在循环，条件或嵌套函数中调用 Hook， 确保总是在你的 React 函数的最顶层调用他们。

## 2. useMemo 和 useCallback
不要滥用。只有在通过 profile 确定有性能瓶颈时使用。

\`\`\`javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
\`\`\`
`,
      createdAt: '2023-10-01T09:00:00Z',
      updatedAt: '2023-10-01T09:00:00Z',
      author: '系统管理员'
    },
    {
      id: '2',
      title: 'Nginx 静态资源服务器配置规范',
      category: 'DevOps',
      tags: ['Nginx', 'Server', 'Config'],
      content: `配置 Nginx 作为静态资源服务器的标准模板。

Ensure gzip is enabled for text resources.

\`\`\`nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
\`\`\`
`,
      createdAt: '2023-10-05T14:30:00Z',
      updatedAt: '2023-10-06T10:00:00Z',
      author: '运维组'
    },
    {
      id: '3',
      title: 'PostgreSQL 常用查询优化',
      category: '数据库',
      tags: ['SQL', 'PostgreSQL', 'Performance'],
      content: '使用 EXPLAIN ANALYZE 来分析查询计划。注意索引的命中情况。',
      createdAt: '2023-10-10T11:15:00Z',
      updatedAt: '2023-10-10T11:15:00Z',
      author: 'DBA'
    },
    {
      id: '4',
      title: 'Web 安全开发规范 v2.0',
      category: '政策法规',
      tags: ['Security', 'XSS', 'CSRF'],
      content: '所有用户输入必须进行 Sanitization 处理。禁止在 URL 中传递敏感信息。',
      createdAt: '2023-11-01T08:00:00Z',
      updatedAt: '2023-11-01T08:00:00Z',
      author: '安全部'
    }
  ]
};