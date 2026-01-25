import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding admin user...')

  const adminEmail = 'admin@esgpathfinder.com'
  const adminPassword = 'Admin123!'

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('Admin user already exists')
    return
  }

  // Hash the password
  const hashedPassword = await hashPassword(adminPassword)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  })

  console.log('Admin user created successfully:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role
  })

  console.log('Admin credentials:')
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })