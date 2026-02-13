import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth-utils'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding MVP admin and default organization...')

  const adminEmail = 'admin@esgpathfinder.com'
  const adminPassword = 'Admin123!'
  const defaultOrganisationName = 'ESG Pathfinder Demo Org'

  // Create default organization if needed
  let organisation = await prisma.organisation.findFirst({
    where: { name: defaultOrganisationName }
  })

  if (!organisation) {
    organisation = await prisma.organisation.create({
      data: {
        name: defaultOrganisationName,
        country: 'US',
        sector: 'Technology'
      }
    })
    console.log('Created default organization:', organisation.name)
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { organisations: true }
  })

  if (existingAdmin) {
    const alreadyLinked = existingAdmin.organisations.some(org => org.id === organisation.id)

    if (!alreadyLinked) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          organisations: {
            connect: { id: organisation.id }
          }
        }
      })
      console.log('Linked existing admin to default organization')
    }

    console.log('Admin user already exists')
    return
  }

  // Hash the password
  const hashedPassword = await hashPassword(adminPassword)

  // Create admin user and attach to default organization
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      organisations: {
        connect: { id: organisation.id }
      }
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
