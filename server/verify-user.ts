import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'tarekba850@gmail.com';
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
    console.log('User verified successfully:', user.email);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('User not found in the database. Are you sure they are registered?');
    } else {
      console.error('Error verifying user:', error);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
