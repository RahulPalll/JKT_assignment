import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { DocumentStatus } from '../../common/enums';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const documentRepository = this.dataSource.getRepository(Document);
    const userRepository = this.dataSource.getRepository(User);

    // Clear existing data
    await documentRepository.clear();

    // Get all users
    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('No users found. Please run user seeder first.');
      return;
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create 100,000+ documents for testing scalability
    const documents: Document[] = [];
    const batchSize = 500;
    const totalDocuments = 100000;

    const mimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const extensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.txt',
      '.csv',
      '.xls',
      '.xlsx',
    ];

    for (let i = 0; i < totalDocuments; i++) {
      const user = faker.helpers.arrayElement(users);
      const mimeType = faker.helpers.arrayElement(mimeTypes);
      const extension = extensions[mimeTypes.indexOf(mimeType)];
      const filename = `${faker.string.uuid()}${extension}`;
      const originalName = `${faker.system.fileName()}${extension}`;
      const size = faker.number.int({ min: 1024, max: 10485760 }); // 1KB to 10MB
      const filePath = path.join(uploadsDir, filename);

      // Create a dummy file
      const content = faker.lorem.paragraphs(
        faker.number.int({ min: 1, max: 10 }),
      );
      fs.writeFileSync(filePath, content);

      const document = documentRepository.create({
        title: faker.lorem.words(faker.number.int({ min: 2, max: 8 })),
        description: faker.helpers.maybe(() => faker.lorem.paragraph(), {
          probability: 0.7,
        }),
        filename,
        originalName,
        mimetype: mimeType,
        size,
        filePath,
        status: faker.helpers.weightedArrayElement([
          { weight: 40, value: DocumentStatus.DRAFT },
          { weight: 50, value: DocumentStatus.PUBLISHED },
          { weight: 10, value: DocumentStatus.ARCHIVED },
        ]),
        content: faker.helpers.maybe(() => faker.lorem.paragraphs(3), {
          probability: 0.8,
        }),
        tags: faker.helpers.maybe(
          () =>
            faker.helpers.arrayElements(
              [
                'important',
                'urgent',
                'review',
                'final',
                'draft',
                'approved',
                'confidential',
                'public',
              ],
              { min: 1, max: 4 },
            ),
          { probability: 0.6 },
        ),
        metadata: faker.helpers.maybe(
          () => ({
            author: faker.person.fullName(),
            department: faker.helpers.arrayElement([
              'HR',
              'IT',
              'Finance',
              'Marketing',
              'Sales',
            ]),
            version: faker.system.semver(),
            language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
          }),
          { probability: 0.5 },
        ),
        createdById: user.id,
        updatedById: faker.helpers.maybe(
          () => faker.helpers.arrayElement(users).id,
          { probability: 0.3 },
        ),
        createdAt: faker.date.past({ years: 2 }),
      });

      documents.push(document);

      // Save in batches to improve performance
      if (documents.length === batchSize || i === totalDocuments - 1) {
        await documentRepository.save(documents);
        documents.length = 0;
        console.log(
          `Created ${Math.min((Math.floor(i / batchSize) + 1) * batchSize, totalDocuments)} documents...`,
        );
      }
    }

    console.log(`Total documents created: ${totalDocuments}`);
  }
}
