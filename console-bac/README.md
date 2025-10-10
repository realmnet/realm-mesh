# Realm Console

A standalone React application for managing Realm Mesh infrastructure.

## Features

- **Modern React Setup**: Built with Vite, React 18, and TypeScript
- **Tailwind CSS**: For styling with dark mode support
- **Layout System**: Sidebar navigation and header with theme toggle
- **Mock Dashboard**: Status cards, metrics, and activity monitoring
- **Routing**: React Router setup for multiple pages

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
console/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── layout.tsx
│   │   │   └── sidebar.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── scroll-area.tsx
│   │       └── tabs.tsx
│   ├── pages/
│   │   └── dashboard/
│   │       ├── index.tsx
│   │       └── status-tab.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Available Routes

- `/` - Dashboard
- `/realms` - Realms management
- `/policies` - Security policies
- `/services` - Service management
- `/network` - Network configuration
- `/monitoring` - System monitoring
- `/access` - Access control
- `/users` - User management
- `/analytics` - Analytics dashboard
- `/settings` - Application settings

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Radix UI**: Accessible UI components
- **Lucide React**: Icon library

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking