/**
 * Rule Engine for Base Intent Scoring
 * Assigns weights to detected signals based on the PRD specification.
 */

const SIGNAL_WEIGHTS = {
  FUNDING: 30,
  HIRING_SALES: 20,
  EXPANSION: 20,
  REDDIT_MENTION: 15,
  NEW_OFFICE: 15,
  PRODUCT_LAUNCH: 10,
  NEWS_MENTION: 8,
};

/**
 * Calculates the base intent score for a set of detected events.
 * @param {Array} events - Array of event objects { type, description, date }
 * @returns {number} The total base intent score
 */
function calculateBaseIntentScore(events) {
  if (!events || events.length === 0) return 0;

  let score = 0;
  events.forEach(event => {
    const weight = SIGNAL_WEIGHTS[event.type] || 0;
    score += weight;
  });

  return score;
}

module.exports = {
  SIGNAL_WEIGHTS,
  calculateBaseIntentScore
};
