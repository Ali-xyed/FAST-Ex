const prisma = require('../config/prisma');

class AuthRepository {
  async findUserByEmailOrRoll(email, rollNo) {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { rollNo }] }
    });
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data) {
    return prisma.user.create({ data });
  }

  async updatePassword(email, password) {
    return prisma.user.update({
      where: { email },
      data: { password }
    });
  }

  async createOTP(data) {
    return prisma.oTP.create({ data });
  }

  async findLatestOTP(email, code) {
    return prisma.oTP.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getLatestOTPForEmail(email) {
    return prisma.oTP.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteOTPs(email) {
    return prisma.oTP.deleteMany({ where: { email } });
  }

  async deleteExpiredOTPs() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return prisma.oTP.deleteMany({
      where: { createdAt: { lt: fiveMinutesAgo } }
    });
  }

  async verifyUser(email) {
    return prisma.user.update({
      where: { email },
      data: { isVerified: true }
    });
  }

  async updateUserBanStatus(email, isBan) {
    return prisma.user.update({
      where: { email },
      data: { isBan }
    });
  }

  async updateUserRole(email, role) {
    return prisma.user.update({
      where: { email },
      data: { role }
    });
  }

  async updateUserProfile(email, data) {
    return prisma.user.update({
      where: { email },
      data
    });
  }

  async deleteUser(email) {
    return prisma.$transaction(async (tx) => {
      // Delete all OTPs for this user
      await tx.oTP.deleteMany({ where: { email } });
      
      // Delete the user
      const deletedUser = await tx.user.delete({ where: { email } });
      
      console.log(`Deleted user from auth database: ${email}`);
      return deletedUser;
    });
  }
}

module.exports = new AuthRepository();
