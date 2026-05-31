const paths = {
  dashboard: 'M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z',
  customers: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-11 9a7 7 0 0 1 14 0H5Zm14-8a3 3 0 0 0-2.2-2.9 5.8 5.8 0 0 1 0 5.8A3 3 0 0 0 19 12Zm-1.2 8h4.7a5.5 5.5 0 0 0-5.2-3.8c.8 1 1.3 2.3 1.5 3.8Z',
  products: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8 4.3 5.7-3.2L12 5.4 6.3 8.6 12 11.8Zm-6 1.1v2.4l5 2.8v-4.6l-5-2.8v2.2Zm7 5.2 5-2.8v-4.6l-5 2.8v4.6Z',
  suppliers: 'M3 7h10v10H3V7Zm12 3h3l3 3v4h-6v-7ZM5 9v6h6V9H5Zm1 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  sales: 'M4 18h16v2H4v-2Zm1-4 4-4 3 3 6-7 2 2-8 9-3-3-3 3-1-3Z',
  invoices: 'M6 3h9l3 3v15H6V3Zm8 2v3h3M8 11h8M8 15h8M8 7h3',
  expenses: 'M12 3a9 9 0 1 0 9 9h-9V3Zm2 .3V10h6.7A9 9 0 0 0 14 3.3Z',
  reports: 'M5 19V5h14v14H5Zm3-3h2v-5H8v5Zm4 0h2V8h-2v8Zm4 0h2v-3h-2v3Z',
  ai: 'M12 2l1.4 5.1L18 4.5l-2.6 4.6L20 10.5l-5.1 1.4L17.5 16l-4.6-2.6L11.5 18l-1.4-5.1L6 15.5l2.6-4.6L4 9.5l5.1-1.4L6.5 4l4.6 2.6L12 2Z',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8.5 4a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.5 8.5 0 0 0-1.7-1L16 3.5h-4l-.4 2.6c-.6.2-1.2.6-1.7 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.4 2.6h4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z',
  logout: 'M10 4H5v16h5v-2H7V6h3V4Zm5 4-1.4 1.4 1.6 1.6H10v2h5.2l-1.6 1.6L15 16l4-4-4-4Z',
  search: 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
  bell: 'M12 22a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 22Zm7-5-2-2v-4.5a5 5 0 0 0-4-4.9V4a1 1 0 1 0-2 0v1.6a5 5 0 0 0-4 4.9V15l-2 2v1h14v-1Z',
  menu: 'M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  filter: 'M4 5h16l-6 7v5l-4 2v-7L4 5Z',
  download: 'M11 4h2v8l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3V4ZM5 18h14v2H5v-2Z',
  print: 'M7 4h10v5H7V4Zm-2 7h14a2 2 0 0 1 2 2v4h-4v3H7v-3H3v-4a2 2 0 0 1 2-2Zm4 5v2h6v-2H9Z',
  edit: 'M5 17.5V21h3.5L18.8 10.7l-3.5-3.5L5 17.5ZM20 9.5 16.5 6 18 4.5a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1L20 9.5Z',
  trash: 'M8 21h8l1-12H7l1 12ZM5 6h14v2H5V6Zm4-3h6l1 2H8l1-2Z',
  view: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  revenue: 'M4 19h16v2H4v-2Zm2-3 4-6 4 3 4-8 2 1-5 11-4-3-3 4-2-2Z',
  profit: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 1v9h8a9 9 0 0 0-8-9Z',
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}
