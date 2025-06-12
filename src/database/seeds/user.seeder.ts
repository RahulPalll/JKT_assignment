import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums';

export class UserSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Clear existing data
    await userRepository.clear();

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(admin);

    // Create editor user
    const editorPassword = await bcrypt.hash('Editor123!', 12);
    const editor = userRepository.create({
      username: 'editor',
      email: 'editor@example.com',
      password: editorPassword,
      firstName: 'Content',
      lastName: 'Editor',
      role: UserRole.EDITOR,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(editor);

    // Create viewer user
    const viewerPassword = await bcrypt.hash('Viewer123!', 12);
    const viewer = userRepository.create({
      username: 'viewer',
      email: 'viewer@example.com',
      password: viewerPassword,
      firstName: 'Content',
      lastName: 'Viewer',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(viewer);

    // Create 1000+ random users for testing scalability
    const users: User[] = [];
    const batchSize = 100;
    const totalUsers = 1000;

    for (let i = 0; i < totalUsers; i++) {
      const password = await bcrypt.hash('Password123!', 12);
      const user = userRepository.create({
        username: faker.internet.userName() + i,
        email: faker.internet.email(),
        password,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: faker.helpers.enumValue(UserRole),
        status: faker.helpers.weightedArrayElement([
          { weight: 80, value: UserStatus.ACTIVE },
          { weight: 15, value: UserStatus.INACTIVE },
          { weight: 5, value: UserStatus.SUSPENDED },
        ]),
        lastLoginAt: faker.helpers.maybe(() => faker.date.recent({ days: 30 }), { probability: 0.7 }),
      });
      users.push(user);

      // Save in batches to improve performance
      if (users.length === batchSize || i === totalUsers - 1) {
        await userRepository.save(users);
        users.length = 0;
        console.log(`Created ${Math.min((Math.floor(i / batchSize) + 1) * batchSize, totalUsers)} users...`);
      }
    }

    console.log(`Total users created: ${totalUsers + 3} (including admin, editor, viewer)`);
  }
}
