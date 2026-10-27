// Fallback client singleton
export const prisma: any = {
  $connect: async () => {},
  $disconnect: async () => {},
};

export default prisma;
