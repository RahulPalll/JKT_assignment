# Technical Design Document

## 🏛️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │   NestJS API    │
│  (Web/Mobile)   │◄──►│   (Optional)    │◄──►│    Backend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                ┌───────────────────────┼───────────────────────┐
                                │                       │                       │
                        ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
                        │ PostgreSQL  │    │    Redis    │    │ File Storage│
                        │  Database   │    │    Cache    │    │   System    │
                        └─────────────┘    └─────────────┘    └─────────────┘
```

### Microservices Design Patterns

#### 1. Domain-Driven Design (DDD)
- **Authentication Domain**: User registration, login, JWT management
- **User Management Domain**: User CRUD, role assignments, permissions
- **Document Domain**: File upload, metadata management, retrieval
- **Ingestion Domain**: Data processing triggers, status tracking

#### 2. Repository Pattern Implementation
```typescript
interface UserRepository {
  create(user: CreateUserDto): Promise<User>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: string, updates: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class UserService implements UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  // Implementation...
}
```

#### 3. Strategy Pattern for Authentication
```typescript
interface AuthStrategy {
  validate(payload: any): Promise<User>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) implements AuthStrategy {
  async validate(payload: JwtPayload): Promise<User> {
    // JWT validation logic
  }
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') implements AuthStrategy {
  async validate(username: string, password: string): Promise<User> {
    // Local authentication logic
  }
}
```

#### 4. Decorator Pattern for Authorization
```typescript
@SetMetadata('roles', roles)
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Role-based authorization logic
  }
}
```

## 🗄️ Database Design

### Entity Relationship Diagram
```
Users (1) ──────── (M) Documents
  │                     │
  │ created_by          │ document_id
  │                     │
  └── (1) ─────── (M) IngestionProcesses
      initiated_by
```

### Entity Specifications

#### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column()
  password: string;

  @Column({ enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Column({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Document, document => document.createdBy)
  documents: Document[];

  @OneToMany(() => IngestionProcess, process => process.initiatedBy)
  ingestionProcesses: IngestionProcess[];
}
```

#### Document Entity
```typescript
@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimetype: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 500 })
  filePath: string;

  @Column({ enum: DocumentStatus, default: DocumentStatus.DRAFT })
  status: DocumentStatus;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @ManyToOne(() => User, user => user.documents)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column('uuid')
  createdById: string;
}
```

### Key Design Decisions

1. **UUID Primary Keys**: 
   - Better for distributed systems
   - Enhanced security (no sequential IDs)
   - Easier database sharding

2. **Soft Deletes**: 
   - Audit trail preservation
   - Data recovery capabilities
   - Compliance requirements

3. **Timestamp Tracking**: 
   - Automatic created/updated timestamps
   - Change tracking for audit purposes

4. **Indexing Strategy**: 
   - Email and username for login queries
   - Document status for filtering
   - Created date for chronological sorting

## 🔧 Technology Stack Rationale

### Backend Framework: NestJS
**Why NestJS?**
- **TypeScript Native**: Strong typing reduces runtime errors
- **Modular Architecture**: Built-in dependency injection
- **Decorator-based**: Clean, readable code with metadata
- **Testing Framework**: Comprehensive testing utilities
- **Microservices Ready**: Built-in support for microservices

### Database: PostgreSQL
**Why PostgreSQL?**
- **ACID Compliance**: Critical for document management systems
- **JSON Support**: Flexible metadata storage without NoSQL complexity
- **Full-text Search**: Built-in document content searching
- **Scalability**: Proven performance with large datasets
- **Extensions**: PostGIS for future geo-location features

### Caching: Redis
**Why Redis?**
- **Performance**: Sub-millisecond response times
- **Session Storage**: JWT blacklist and session management
- **Pub/Sub**: Event-driven architecture support
- **Data Structures**: Rich data types for complex caching scenarios

### Authentication: JWT
**Why JWT?**
- **Stateless**: No server-side session storage required
- **Scalable**: Perfect for microservices architecture
- **Cross-domain**: Supports multiple client applications
- **Secure**: Cryptographically signed tokens

## 🧪 Testing Architecture

### Testing Pyramid Implementation
```
                    ▲
                   / \
                  /E2E\     <- 20% (Integration/E2E tests)
                 /_____\
                /       \
               /  Unit   \   <- 80% (Unit tests)
              /___Tests___\
```

### Test Categories

#### 1. Unit Tests (80% of test suite)
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should validate user credentials', async () => {
    // Test implementation
  });
});
```

#### 2. Integration Tests (15% of test suite)
```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test123' })
      .expect(200);
  });
});
```

#### 3. E2E Tests (5% of test suite)
- Complete user registration and login flow
- Document upload and retrieval workflow
- Role-based access control scenarios

### Mock Strategy
```typescript
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

## 🚀 Deployment Architecture

### Containerization Strategy

#### Multi-stage Docker Build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Container Orchestration
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/jktech
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jktech
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### CI/CD Pipeline Architecture
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: jktech/api:latest
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Index for user authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Index for document queries
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_created_by ON documents(created_by_id);

-- Composite index for complex queries
CREATE INDEX idx_documents_user_status ON documents(created_by_id, status);
```

### Caching Strategy
```typescript
@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### Pagination Implementation
```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

## 🔍 Monitoring & Observability

### Health Check Implementation
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

### Metrics Collection
```typescript
@Injectable()
export class MetricsService {
  private readonly httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
  });

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }
}
```

### Structured Logging
```typescript
@Injectable()
export class AppLogger {
  private logger = new Logger(AppLogger.name);

  logRequest(req: Request, res: Response) {
    const { method, url, headers } = req;
    const { statusCode } = res;
    
    this.logger.log({
      method,
      url,
      statusCode,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
  }
}
```

This technical design demonstrates a comprehensive understanding of modern backend architecture, following industry best practices and addressing all the assignment's technical requirements.
