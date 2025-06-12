# NestJS User & Document Management System

> A production-ready NestJS backend application with comprehensive user and document management, enterprise-grade security, and 73.55% test coverage.

![TypeScript](https://img.shields.io/badge/typescript-007ACC.svg?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-E0234E.svg?style=flat-square&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-316192.svg?style=flat-square&logo=postgresql&logoColor=white)
![Test Coverage](https://img.shields.io/badge/coverage-73.55%25-brightgreen?style=flat-square)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)

## ✨ Key Features

- 🔐 **JWT Authentication** with role-based access control (RBAC)
- 📁 **Document Management** with secure file upload/download
- 👥 **User Management** with comprehensive CRUD operations
- 🔄 **Data Ingestion** with background job processing
- 📊 **Health Monitoring** with metrics and logging
- 🧪 **73.55% Test Coverage** with comprehensive unit tests
- 🐳 **Docker Ready** with production optimization

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ 
- **PostgreSQL** v12+
- **Docker** (optional)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/RahulPalll/JK_Teck_assignment.git
cd JK_Teck_assignment

# 2. Install dependencies
npm install

# 3. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 4. Database setup (choose one)
docker-compose up -d postgres  # Using Docker
# OR
createdb user_document_management  # Local PostgreSQL

# 5. Run application
npm run start:dev
```

### 🌐 API Access
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api
- **Metrics**: http://localhost:3000/metrics
## 🏗️ Architecture

Built with **SOLID principles** and enterprise design patterns:

- 🏛️ **Repository Pattern** - Data access abstraction
- 🔄 **Strategy Pattern** - Authentication methods
- 🏭 **Factory Pattern** - Entity creation
- 🎨 **Decorator Pattern** - Validation & authorization
- 👁️ **Observer Pattern** - Event handling

### 📁 Project Structure

```
src/
├── auth/              # 🔐 Authentication & JWT
├── users/             # 👥 User management
├── documents/         # 📁 File handling
├── ingestion/         # 🔄 Background processing
├── health/            # 📊 System monitoring
├── common/            # 🛠️ Shared utilities
│   ├── guards/        # 🛡️ Security guards
│   ├── decorators/    # 🎨 Custom decorators
│   └── dto/           # 📋 Data transfer objects
├── database/          # 🗄️ Entities & migrations
└── config/            # ⚙️ Configuration
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Framework** | NestJS + Express |
| **Language** | TypeScript |
| **Database** | PostgreSQL + TypeORM |
| **Auth** | JWT + Passport |
| **Validation** | class-validator |
| **Testing** | Jest + Supertest |
| **Docs** | Swagger/OpenAPI |
| **DevOps** | Docker + CI/CD |

## 🔐 API Endpoints

### Authentication
```bash
POST /auth/register    # Register new user
POST /auth/login       # User login
POST /auth/refresh     # Refresh token
POST /auth/logout      # User logout
GET  /auth/profile     # Get user profile
```

### Users (RBAC Protected)
```bash
GET    /users          # List users (paginated)
GET    /users/:id      # Get user details
PUT    /users/:id      # Update user
DELETE /users/:id      # Delete user
GET    /users/stats    # User statistics
```

### Documents
```bash
POST   /documents/upload     # Upload file
GET    /documents           # List documents
GET    /documents/:id       # Get document
GET    /documents/:id/download  # Download file
PUT    /documents/:id       # Update metadata
DELETE /documents/:id       # Delete document
```

### System Monitoring
```bash
GET /health           # Health check
GET /health/detailed  # Detailed health info
GET /metrics          # Application metrics
```

## 🧪 Testing & Quality

### Test Coverage: **73.55%**
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Code Quality Tools
- ✅ **ESLint** - Code linting
- ✅ **Prettier** - Code formatting  
- ✅ **Husky** - Pre-commit hooks
- ✅ **TypeScript** - Type safety

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production
```bash
# Build image
docker build -t nestjs-app .

# Run container
docker run -p 3000:3000 nestjs-app
```

## 🔄 CI/CD Pipeline

### GitHub Actions
- ✅ Automated testing on every push
- ✅ Code quality checks (ESLint, Prettier)
- ✅ Security vulnerability scanning
- ✅ Docker image building
- ✅ Test coverage reporting

### Jenkins Support
- ✅ Multi-branch pipeline
- ✅ Quality gates
- ✅ Automated deployment

## 🛡️ Security Features

### Authentication & Authorization
- 🔐 **JWT tokens** with refresh mechanism
- 👤 **Role-based access control** (Admin, Editor, Viewer)
- 🔒 **Password hashing** with bcrypt
- ⏰ **Token expiration** handling

### Input Security
- ✅ **Request validation** with class-validator
- ✅ **File upload security** (type & size limits)
- ✅ **SQL injection prevention** with TypeORM
- ✅ **XSS protection** through sanitization

### Infrastructure Security
- 🛡️ **CORS configuration**
- 🚫 **Rate limiting**
- 🔒 **Security headers** with Helmet
- 📝 **Audit logging**

## 📊 Performance Features

### Database Optimization
- 📈 **Strategic indexing** for query performance
- 📄 **Efficient pagination** for large datasets
- 🔄 **Connection pooling** and optimization
- 📊 **Query performance monitoring**

### File Handling
- 📁 **Chunked uploads** for large files
- 🔄 **Stream processing** for memory efficiency
- 💾 **Configurable storage** backends
- 🗜️ **File compression** support

## 🚀 Deployment

### Environment Configuration
```bash
# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

### Scaling Options
- 🔄 **Horizontal scaling** with load balancers
- 🗄️ **Database read replicas**
- 💾 **Redis caching** integration
- 📁 **CDN integration** for file serving

## 📚 Documentation

- 📖 **API Documentation**: http://localhost:3000/api
- 🏗️ **Architecture Guide**: [GIT_WORKFLOW_SUMMARY.md](./GIT_WORKFLOW_SUMMARY.md)
- 🧪 **Test Coverage Report**: [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md)
- 🔧 **Development Setup**: See Quick Start above

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  <strong>Built with ❤️ using NestJS</strong><br>
  <sub>Enterprise-grade • Production-ready • Test-driven</sub>
</p>
