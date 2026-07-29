/**
 * CRM Provider Adapter (HubSpot)
 * Modular interface for CRM sync operations. Currently mocked for MVP.
 */

class HubSpotAdapter {
  async syncCompany(companyData) {
    console.log(`[HubSpot Adapter] Syncing company ${companyData.name}...`);
    return { success: true, hubspotCompanyId: `hs_${Math.floor(Math.random() * 10000)}` };
  }

  async syncContacts(contacts) {
    console.log(`[HubSpot Adapter] Syncing ${contacts.length} contacts...`);
    return contacts.map(c => ({ ...c, hubspotContactId: `hs_c_${Math.floor(Math.random() * 10000)}` }));
  }
}

module.exports = new HubSpotAdapter();
