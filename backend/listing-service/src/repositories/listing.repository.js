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
      // 1. Delete associated sub-models
      await tx.sellListing.deleteMany({ where: { listingId: id } });
      await tx.rentListing.deleteMany({ where: { listingId: id } });
      await tx.exchangeListing.deleteMany({ where: { listingId: id } });

      // 2. Delete associated comments
      await tx.comment.deleteMany({ where: { listingId: id } });

      // 3. Finally delete the parent listing
      return tx.listing.delete({ where: { id } });
    });
  }

  async createComment(data) {
    return prisma.comment.create({ data });
  }

  async deleteComment(id) {
    return prisma.comment.delete({ where: { id } });
  }

  async updateSellListing(id, data) {
    return prisma.sellListing.update({ where: { id }, data });
  }

  async updateRentListing(id, data) {
    return prisma.rentListing.update({ where: { id }, data });
  }
}

module.exports = new ListingRepository();
