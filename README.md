# JK Tech Assignment - Enterprise NestJS Backend

> **Professional NestJS backend system demonstrating enterprise-grade architecture, security, and development practices**

[![Test Coverage](https://img.shields.io/badge/Coverage-73%25-green.svg)](./coverage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](./Dockerfile)

## 🎯 Project Overview

This repository showcases a **well-engineered NestJS prototype** that demonstrates professional software development practices, including:

- **🏗️ Modular Architecture** - Domain-driven design with clear separation of concerns
- **🔐 Enterprise Security** - JWT authentication with role-based authorization  
- **📄 Document Management** - Secure file upload, storage, and metadata handling
- **⚡ Data Processing** - Scalable ingestion workflows and process tracking
- **🧪 Test Excellence** - 73%+ coverage with comprehensive testing strategy
- **📚 API Documentation** - Complete Swagger/OpenAPI documentation
- **🚀 Cloud Ready** - Dockerized with deployment guides for AWS/Azure/GCP

## 🏛️ Architecture Highlights

### Domain-Driven Design
```
├── 🔐 Authentication Domain    # JWT, strategies, guards
├── 👥 User Management Domain   # CRUD, roles, permissions  
├── 📄 Document Domain          # Upload, storage, metadata
├── ⚡ Ingestion Domain         # Data processing workflows
└── 🔧 Common Infrastructure    # Shared utilities, configs
```

### Technology Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | NestJS + TypeScript | Type-safe, modular backend |
| **Database** | PostgreSQL + TypeORM | ACID compliance, complex queries |
| **Cache** | Redis | Session storage, performance |
| **Auth** | JWT + Passport | Stateless authentication |
| **Testing** | Jest | Unit, integration, E2E tests |
| **Docs** | Swagger/OpenAPI | Interactive API documentation |
| **Deployment** | Docker + Compose | Containerized deployment |

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and start
git clone https://github.com/RahulPalll/JKT_assignment.git
cd JKT_assignment
docker-compose up -d

# Access application
# API: http://localhost:3000
# Docs: http://localhost:3000/api/docs
```

### Option 2: Local Development
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start services (requires PostgreSQL & Redis)
npm run start:dev
```

## 📊 API Endpoints

| Endpoint Group | Description | Authentication |
|----------------|-------------|----------------|
| **🔐 `/api/v1/auth`** | Login, register, logout, refresh | Public |
| **👥 `/api/v1/users`** | User CRUD, role management | Admin/Editor |
| **📄 `/api/v1/documents`** | File upload, CRUD, download | All roles |
| **⚡ `/api/v1/ingestion`** | Process triggers, tracking | Admin/Editor |
| **❤️ `/api/v1/health`** | System monitoring, metrics | Public |

### Authentication Flow
```bash
# 1. Register new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -d '{"username":"user","email":"user@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# 2. Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"usernameOrEmail":"user","password":"Test123!"}'

# 3. Use token for authenticated requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/users
```

## 🧪 Testing & Quality

### Test Coverage: 73%+
```bash
npm run test:cov          # Unit & integration tests with coverage
npm run test:e2e          # End-to-end testing
npm run lint              # Code quality checks
npm run type-check        # TypeScript validation
```

### Quality Metrics
- **Unit Tests**: 200+ test cases covering all services
- **Integration Tests**: API endpoint testing with real database
- **E2E Tests**: Complete user workflow validation
- **Code Coverage**: 73% statements, 75% functions
- **TypeScript**: Strict mode with comprehensive typing

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[📋 ASSIGNMENT_DOCUMENTATION.md](./ASSIGNMENT_DOCUMENTATION.md)** | Complete assignment requirements mapping |
| **[🏗️ TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)** | Architecture decisions and patterns |
| **[🚀 DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Production deployment instructions |
| **[📊 Swagger UI](http://localhost:3000/api/docs)** | Interactive API documentation |

## 🌿 Development Workflow

This project demonstrates professional Git workflow with feature-based branching:

```
main (production)
├── develop (integration)
├── feature/authentication-jwt
├── feature/document-management  
├── feature/data-ingestion
├── feature/testing-coverage
└── release/v1.0.0
```

### Branch Highlights
- **`feature/01-project-setup`** - Architecture foundation
- **`feature/03-authentication-jwt`** - Security implementation
- **`feature/05-document-management`** - File handling system
- **`feature/10-comprehensive-testing`** - Test strategy
- **`feature/15-dockerization`** - Deployment preparation

## 🔐 Security Features

- ✅ **JWT Authentication** with refresh token rotation
- ✅ **Role-based Authorization** (Admin, Editor, Viewer)
- ✅ **Input Validation** with DTO classes and decorators
- ✅ **File Upload Security** with type/size validation
- ✅ **SQL Injection Protection** via TypeORM
- ✅ **CORS Configuration** for cross-origin requests
- ✅ **Rate Limiting** and security headers

## 📈 Performance & Scalability

- **Database Indexing** for optimized queries
- **Redis Caching** for session and data storage
- **Pagination** for large dataset handling
- **Connection Pooling** for database efficiency
- **File Streaming** for large file uploads
- **Health Checks** for monitoring

## 🚀 Deployment Options

### Cloud Platforms
- **AWS**: ECS/Fargate + RDS + ElastiCache
- **Azure**: Container Instances + Azure Database + Redis Cache
- **GCP**: Cloud Run + Cloud SQL + Memorystore
- **Docker**: Complete containerization with docker-compose

### CI/CD Ready
- GitHub Actions workflow included
- Automated testing and building
- Security scanning integration
- Multi-environment deployment support

## 💡 Key Achievements

This project demonstrates mastery of:

### ✅ **Code Quality & Structure**
- Modular, testable architecture
- SOLID principles implementation
- Clean code practices
- Comprehensive documentation

### ✅ **Enterprise Patterns**
- Repository pattern for data access
- Strategy pattern for authentication
- Decorator pattern for authorization
- Factory pattern for service creation

### ✅ **DevOps Excellence**
- Docker containerization
- CI/CD pipeline setup
- Environment configuration
- Monitoring and logging

### ✅ **Security Best Practices**
- Authentication and authorization
- Input validation and sanitization
- Secure file handling
- Protection against common vulnerabilities

---

## 📞 Support

For questions about implementation details, deployment, or architecture decisions, please refer to the comprehensive documentation or create an issue in this repository.

**Author**: Rahul Pal  
**Assignment**: JK Tech Backend Developer Assessment  
**Date**: June 2025
