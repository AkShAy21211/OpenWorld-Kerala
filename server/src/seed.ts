import { PrismaClient } from '@prisma/client';
import { SEED_COSMETIC_ITEMS } from './data/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Supabase database with Kerala Fair items and welcome data...');

  // 1. Seed Shop Items
  for (const item of SEED_COSMETIC_ITEMS) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        malayalamName: item.malayalamName,
        type: item.type,
        price: item.price,
        description: item.description,
        previewColor: item.previewColor,
        active: item.active,
      },
      create: {
        id: item.id,
        name: item.name,
        malayalamName: item.malayalamName,
        type: item.type,
        price: item.price,
        description: item.description,
        previewColor: item.previewColor,
        active: item.active,
      },
    });
    console.log(`  ✨ Item seeded: ${item.name} (${item.price} pts)`);
  }

  // 2. Seed Welcoming System Visitors & Initial Guestbook Messages
  const systemUser1 = await prisma.user.upsert({
    where: { sessionId: 'system-visitor-aromal' },
    update: {},
    create: {
      sessionId: 'system-visitor-aromal',
      displayName: 'Aromal from Thrissur',
      avatarColor: '#F59E0B',
      avatarId: 'visitor_default',
      wallet: { create: { points: 50 } },
    },
  });

  const systemUser2 = await prisma.user.upsert({
    where: { sessionId: 'system-visitor-devika' },
    update: {},
    create: {
      sessionId: 'system-visitor-devika',
      displayName: 'Devika',
      avatarColor: '#10B981',
      avatarId: 'visitor_default',
      wallet: { create: { points: 60 } },
    },
  });

  const gbCount = await prisma.guestbookEntry.count();
  if (gbCount === 0) {
    await prisma.guestbookEntry.createMany({
      data: [
        {
          userId: systemUser1.id,
          message: 'ഹലോ കൂട്ടുകാരെ! എന്ത് മനോഹരമായ ഉത്സവാന്തരീക്ഷം! (What a beautiful festive vibe!) 🎉',
        },
        {
          userId: systemUser2.id,
          message: 'The swing ride timing is super fun! Managed a perfect 10 on my 2nd attempt! 🎪',
        },
      ],
    });
    console.log('  📖 Seeded initial Malayalam & English guestbook entries');
  }

  // 3. Seed Initial Pookkalam Floral Carpet
  const pCount = await prisma.pookkalam.count();
  if (pCount === 0) {
    await prisma.pookkalam.create({
      data: {
        userId: systemUser1.id,
        title: 'Thumba & Chethi Mandala',
        colors: JSON.stringify(['#F59E0B', '#EF4444', '#10B981', '#FDFBF7']),
        pattern: 'chakram',
        caption: 'Traditional yellow marigold and sacred white thumba floral ring',
      },
    });
    console.log('  🌸 Seeded initial community Pookkalam design');
  }

  console.log('🎉 Supabase database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
