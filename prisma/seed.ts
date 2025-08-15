import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('Camara2025', 10)
  const userPassword = await bcrypt.hash('usertest', 10)

  // Create admin user
  const admin = await db.user.upsert({
    where: { email: 'admin@ubaporanga.com.br' },
    update: {},
    create: {
      email: 'admin@ubaporanga.com.br',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create test user
  const testUser = await db.user.upsert({
    where: { email: 'usuario@ubaporanga.com.br' },
    update: {},
    create: {
      email: 'usuario@ubaporanga.com.br',
      name: 'Usuário Teste',
      password: userPassword,
      role: 'COUNCILOR',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Admin user:', admin)
  console.log('Test user:', testUser)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })