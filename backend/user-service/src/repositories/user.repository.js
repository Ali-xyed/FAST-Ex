const prisma = require('../config/prisma');

class UserRepository {
  async findByEmail(email) {
    return prisma.userProfile.findUnique({ where: { email } });
  }

  async upsertUser(email, name, rollNo) {
    return prisma.userProfile.upsert({
      where: { email },
      update: {},
      create: { email, name, rollNo }
    });
  }

  async updateUser(email, data) {
    return prisma.userProfile.update({ where: { email }, data });
  }

  async updateReputation(email, change) {
    return prisma.userProfile.update({
      where: { email },
      data: { reputationScore: { increment: change } }
    });
  }

  async findAllUsers() {
    return prisma.userProfile.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new UserRepository();
