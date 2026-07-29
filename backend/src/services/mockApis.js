/**
 * Mock Service Integrations
 * These functions simulate the third-party API calls until real API keys are provided.
 */

const mockGeminiAnalysis = async (companyName, signals) => {
  console.log(`[Mock API] Generating Gemini Intent Analysis for ${companyName}...`);
  return {
    confidenceScore: 'High',
    reasoning: `${companyName} recently triggered ${signals.length} buying signals. The combination of these signals suggests the company is actively investing in revenue growth.`,
    recommendation: `Reach out to the VP of Sales immediately to discuss workflow automation.`
  };
};

const mockApolloEnrichment = async (companyDomain) => {
  console.log(`[Mock API] Fetching Decision Makers from Apollo for ${companyDomain}...`);
  return [
    { name: 'Alice Smith', role: 'VP of Sales', email: 'alice@' + companyDomain },
    { name: 'Bob Jones', role: 'RevOps Manager', email: 'bob@' + companyDomain }
  ];
};

const mockHubSpotSync = async (company, contacts) => {
  console.log(`[Mock API] Syncing ${company.name} and ${contacts.length} contacts to HubSpot...`);
  return { success: true, hubspotCompanyId: '12345' };
};

module.exports = {
  mockGeminiAnalysis,
  mockApolloEnrichment,
  mockHubSpotSync
};
