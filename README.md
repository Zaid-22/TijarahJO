# TijarahJo - Marketplace Platform

A full-stack marketplace application for buying and selling items in Jordan.

## 📁 Project Structure

```
tijarahjo-project/
├── backend/          # ASP.NET Core Web API
├── frontend/         # React + TypeScript + Vite
└── docs/            # Documentation
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend/TijarahJoDBAPI/TijarahJoDBAPI
dotnet restore
dotnet run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- **📊 Reports**: `docs/reports/` - Main project reports (Final Report, Integration Report, API Status)
- **🚀 Setup Guides**: `docs/setup/` - Installation and setup instructions
- **🔧 Troubleshooting**: `docs/troubleshooting/` - Error fixes and debugging guides
- **🏗️ Architecture**: `docs/architecture/` - Project structure and architecture docs
- **✅ Checklists**: `docs/checklists/` - Launch and setup checklists

**📖 Start here:** See `docs/README.md` for complete documentation index and navigation guide.

## 🏗️ Architecture

### Backend
- **Controllers**: API endpoints
- **Services**: Business logic
- **DataAccess**: Database operations
- **BusinessLogic**: Domain logic
- **Models**: Data models

### Frontend
- **Features**: Feature-based organization (auth, posts, profile, categories, search)
- **Shared**: Shared components, hooks, contexts, services, types, utils
- **App**: Application entry point

## 🔧 Key Features

- User authentication and authorization
- Post creation and management
- Image upload and management
- Category-based browsing
- Search functionality
- User profiles

## 📝 Notes

- Category data is preserved in `frontend/src/shared/constants/categoryData.ts`
- All UI components are in `frontend/src/shared/components/ui/`
- API services are in `frontend/src/shared/services/`

For detailed structure, see `docs/architecture/PROJECT_STRUCTURE.md`

