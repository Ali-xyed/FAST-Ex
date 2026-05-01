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
    return prisma.$transaction(async (tx) => {
      // deleting associated sub-models
      await tx.sellListing.deleteMany({ where: { listingId: id } });
      await tx.rentListing.deleteMany({ where: { listingId: id } });
      await tx.exchangeListing.deleteMany({ where: { listingId: id } });

      // deleting associated comments
      await tx.comment.deleteMany({ where: { listingId: id } });

      // and in last deleting the parent listing
      return tx.listing.delete({ where: { id } });
    });
  }

  async createComment(data) {
    return prisma.comment.create({ data });
  }

  async findCommentById(id) {
    return prisma.comment.findUnique({ where: { id } });
  }

  async deleteComment(id) {
    return prisma.comment.delete({ where: { id } });
  }

  async updateComment(id, data) {
    return prisma.comment.update({ where: { id }, data });
  }

  async updateSellListing(id, data) {
    return prisma.sellListing.update({ where: { id }, data });
  }

  async updateRentListing(id, data) {
    return prisma.rentListing.update({ where: { id }, data });
  }

  async createBargain(data) {
    return prisma.bargain.create({ data });
  }

  async updateBargainStatus(id, status) {
    return prisma.bargain.update({ where: { id }, data: { status } });
  }

  async findBargainById(id) {
    return prisma.bargain.findUnique({ where: { id } });
  }

  async createExchange(data) {
    return prisma.exchange.create({ data });
  }

  async updateExchangeStatus(id, status) {
    return prisma.exchange.update({ where: { id }, data: { status } });
  }

  async findExchangeById(id) {
    return prisma.exchange.findUnique({ where: { id } });
  }

  async findBargainsByListingId(listingId) {
    return prisma.bargain.findMany({ 
      where: { listingId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findExchangesByListingId(listingId) {
    return prisma.exchange.findMany({ 
      where: { listingId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new ListingRepository();
