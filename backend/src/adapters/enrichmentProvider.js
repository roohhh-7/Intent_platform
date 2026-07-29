/**
 * Contact Enrichment Provider Adapter (Apollo)
 * Modular interface for contact fetching. Currently mocked for MVP.
 */

class ApolloAdapter {
  async findDecisionMakers(companyDomain, targetRoles = ['Sales', 'Marketing']) {
    console.log(`[Apollo Adapter] Fetching Decision Makers for ${companyDomain}...`);
    return [
      { name: 'Alice Smith', role: 'VP of Sales', email: 'alice@' + companyDomain },
      { name: 'Bob Jones', role: 'RevOps Manager', email: 'bob@' + companyDomain }
    ];
  }
}

module.exports = new ApolloAdapter();
