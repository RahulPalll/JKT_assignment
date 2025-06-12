# NestJS User & Document Management System<p align="center">  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a></p><p align="center">A production-ready NestJS backend application for comprehensive user and document management with enterprise-grade security and scalability.</p><p align="center">  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" /></p>## 🚀 Features### Core Functionality- **User Management**: Complete CRUD operations with role-based access control- **Document Management**: Secure file upload/download with metadata handling- **Authentication & Authorization**: JWT-based auth with refresh tokens and RBAC- **Ingestion Processing**: Background job processing with status tracking- **API Documentation**: Comprehensive Swagger/OpenAPI documentation### Security & Performance- **Enterprise Security**: Password hashing, input validation, CORS, rate limiting- **Scalable Architecture**: Designed for 1000+ users and 100k+ documents- **Database Optimization**: Proper indexing and query optimization- **File Security**: Type validation, size limits, secure storage### Development & Operations- **Comprehensive Testing**: 70%+ test coverage with unit and integration tests- **Docker Ready**: Multi-stage builds with production optimization- **CI/CD Ready**: GitHub Actions and Jenkins configurations- **Environment Management**: Separate dev/test/prod configurations## 🏗️ ArchitectureThis application follows **SOLID principles** and implements various design patterns:- **Repository Pattern**: Data access abstraction- **Strategy Pattern**: Multiple authentication methods- **Factory Pattern**: Entity creation- **Decorator Pattern**: Validation and authorization- **Observer Pattern**: Event handling### Project Structure```src/├── auth/              # Authentication module├── users/             # User management module├── documents/         # Document management module├── ingestion/         # Background processing module├── database/│   ├── entities/      # TypeORM entities│   └── seeds/         # Database seeding├── common/            # Shared utilities│   ├── guards/        # Authentication guards│   ├── decorators/    # Custom decorators│   ├── dto/           # Data transfer objects│   └── interfaces/    # Type definitions└── config/            # Configuration modules```## 🛠️ Technology Stack| Category | Technologies ||----------|-------------|| **Framework** | NestJS, Express || **Language** | TypeScript || **Database** | PostgreSQL, TypeORM || **Authentication** | JWT, Passport || **Validation** | class-validator, class-transformer || **Documentation** | Swagger/OpenAPI || **Testing** | Jest, Supertest || **File Upload** | Multer || **Containerization** | Docker, Docker Compose |## 🚀 Quick Start### Prerequisites- Node.js (v16 or higher)- PostgreSQL (v12 or higher)- Docker (optional)### Installation```bash# Clone the repositorygit clone <repository-url>cd jk_tech# Install dependenciesnpm install# Copy environment configurationcp .env.example .env
# Edit .env with your database credentials
```

### Database Setup

```bash
# Using Docker (recommended)
docker-compose up -d postgres

# Or install PostgreSQL locally and create database
createdb nestjs_app
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Watch mode
npm run start
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

## 📊 Database Seeding

To populate the database with test data for development:

```bash
# Seed database with sample data
npm run seed

# This creates:
# - 1000+ users with different roles
# - 100k+ documents with various metadata
# - Sample ingestion processes
```

## 🔐 API Authentication

### Getting Started
1. **Register a new user**:
   ```bash
   POST /auth/register
   {
     "email": "user@example.com",
     "password": "securepassword",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

2. **Login to get tokens**:
   ```bash
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "securepassword"
   }
   ```

3. **Use the access token in headers**:
   ```bash
   Authorization: Bearer <your-access-token>
   ```

### User Roles
- **Admin**: Full system access
- **Editor**: Can manage documents and users
- **Viewer**: Read-only access

## 📁 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Users
- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/stats` - Get user statistics

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents` - List documents (paginated)
- `GET /documents/:id` - Get document details
- `GET /documents/:id/download` - Download document
- `PUT /documents/:id` - Update document metadata
- `DELETE /documents/:id` - Delete document

### Ingestion
- `POST /ingestion` - Start new ingestion process
- `GET /ingestion` - List ingestion processes
- `GET /ingestion/:id` - Get ingestion status
- `PUT /ingestion/:id/status` - Update ingestion status

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Production
```bash
# Build production image
docker build -t nestjs-app .

# Run with production config
docker run -d \
  --name nestjs-app \
  -p 3000:3000 \
  --env-file .env.production \
  nestjs-app
```

## 🔄 CI/CD Pipeline

### GitHub Actions
The project includes automated CI/CD with:
- **Testing**: Unit and E2E tests on every push
- **Code Quality**: ESLint and Prettier checks
- **Security**: Dependency vulnerability scanning
- **Deployment**: Automated deployment to staging/production

### Jenkins Pipeline
Alternative Jenkins configuration available for:
- Multi-branch pipeline support
- Automated testing and quality gates
- Docker image building and deployment
- Environment-specific deployments

## 📈 Performance & Monitoring

### Database Performance
- **Indexing**: Strategic database indexes for optimal query performance
- **Pagination**: Efficient pagination for large datasets
- **Query Optimization**: Optimized TypeORM queries with relations

### File Handling
- **Chunked Upload**: Support for large file uploads
- **Stream Processing**: Memory-efficient file processing
- **Storage Optimization**: Configurable storage backends

### Monitoring
- **Health Checks**: Built-in health check endpoints
- **Metrics**: Application performance metrics
- **Logging**: Structured logging with different levels

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Automatic token refresh mechanism
- **Role-Based Access**: Granular permission system
- **Password Security**: Bcrypt hashing with salt rounds

### Input Validation
- **Request Validation**: Comprehensive input validation
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: TypeORM parameterized queries
- **XSS Protection**: Input sanitization

### Security Headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Protection against abuse
- **Helmet**: Security headers middleware

## 📝 Development Guidelines

### Code Quality
- **ESLint**: Enforced coding standards
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **TypeScript**: Strict type checking

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: Complete workflow testing
- **Test Coverage**: Minimum 70% coverage requirement

### Documentation
- **Swagger**: Interactive API documentation
- **JSDoc**: Inline code documentation
- **README**: Comprehensive setup guides
- **Architecture Docs**: System design documentation

## 🚀 Deployment Strategies

### Environment Configuration
```bash
# Development
npm run start:dev

# Staging
npm run build
NODE_ENV=staging npm run start:prod

# Production
npm run build
NODE_ENV=production npm run start:prod
```

### Scaling Considerations
- **Horizontal Scaling**: Multiple application instances
- **Database Scaling**: Read replicas and connection pooling
- **File Storage**: CDN integration for static assets
- **Caching**: Redis integration for session and data caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@example.com
- 📚 Documentation: [API Docs](http://localhost:3000/api)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🏆 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Database powered by [PostgreSQL](https://postgresql.org/)
- Authentication via [Passport.js](http://passportjs.org/)
- Documentation with [Swagger](https://swagger.io/)
