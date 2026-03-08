const { PrismaClient } = require('@prisma/client')
const { faker } = require('@faker-js/faker')


const prisma = new PrismaClient()

async function main() {
    const categorys = Array.from({ length: 10 }).map(() => ({
        name: faker.commerce.department(),
        slug: faker.lorem.slug()
    }))
    console.log('🌱 Start seeding...')

    await prisma.category.createMany({
        data: categorys
    })


    // await prisma.article.createMany({ length: 20 }).map(() => ({

    // }))

    console.log('✅ Seeding selesai')
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error('❌ ERROR SEED:', e)
        await prisma.$disconnect()
        process.exit(1)
    })

// main()
//     .catch(console.error)
//     .finally(() => prisma.$disconnect())