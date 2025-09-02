import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@autoriven.com' },
  });

  if (!existingAdmin) {
    // Create default admin user
    const adminUser = userRepository.create({
      email: 'admin@autoriven.com',
      firstName: 'Admin',
      lastName: 'User',
      password: await bcrypt.hash('Admin@123', 12),
      role: UserRole.ADMINISTRATOR,
      isActive: true,
      emailVerified: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Default admin user created:');
    console.log('   Email: admin@autoriven.com');
    console.log('   Password: Admin@123');
    console.log('   Role: Administrator');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create sample customer user
  const existingCustomer = await userRepository.findOne({
    where: { email: 'customer@example.com' },
  });

  if (!existingCustomer) {
    const customerUser = userRepository.create({
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: await bcrypt.hash('Customer@123', 12),
      role: UserRole.CUSTOMER,
      phone: '+1234567890',
      city: 'New York',
      country: 'USA',
      isActive: true,
      emailVerified: true,
    });

    await userRepository.save(customerUser);
    console.log('✅ Sample customer user created:');
    console.log('   Email: customer@example.com');
    console.log('   Password: Customer@123');
    console.log('   Role: Customer');
  } else {
    console.log('ℹ️ Sample customer user already exists');
  }
}
