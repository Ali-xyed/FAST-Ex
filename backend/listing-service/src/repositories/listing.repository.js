const prisma = require('../config/prisma');

class ListingRepository {
  async createListing(data) {
    return prisma.listing.create({ data });
  }

  async createSellListing(data) {
    return prisma.sellListing.create({ data });
  }

  async createRentListing(data) {
    return prisma.rentListing.create({ data });
  }

  async createExchangeListing(data) {
    return prisma.exchangeListing.create({ data });
  }

  async findAllListings(query) {
    return prisma.listing.findMany(query);
  }

  async findListingById(id) {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        sellListing: true,
        rentListing: true,
        exchangeListing: true,
        comments: { orderBy: { createdAt: 'asc' } }
      }
    });
  }

  async updateListing(id, data) {
    return prisma.listing.update({ where: { id }, data });
  }

  async deleteListing(id) {
    return prisma.listing.delete({ where: { id } });
  }

  async createComment(data) {
    return prisma.comment.create({ data });
  }

  async deleteComment(id) {
    return prisma.comment.delete({ where: { id } });
  }

  async createBargain(data) {
    return prisma.bargaining.create({ data });
  }

  async updateBargainStatus(id, status) {
    return prisma.bargaining.update({ where: { id }, data: { status } });
  }

  async findBargainById(id) {
    return prisma.bargaining.findUnique({ where: { id } });
  }
}

module.exports = new ListingRepository();
