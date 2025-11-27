/**
 * Score band definitions and categorization
 */

const SCORE_BANDS = {
  SAFE: {
    min: 90,
    max: 100,
    label: 'Safe',
    emoji: '✅',
    description: 'Package appears safe to use',
    action: 'safe',
  },
  REVIEW: {
    min: 70,
    max: 89,
    label: 'Review Recommended',
    emoji: '⚠️',
    description: 'Review recommended before use',
    action: 'review',
  },
  HIGH_RISK: {
    min: 50,
    max: 69,
    label: 'High Risk',
    emoji: '❌',
    description: 'High risk package, use with caution',
    action: 'caution',
  },
  BLOCK: {
    min: 0,
    max: 49,
    label: 'Block',
    emoji: '🚨',
    description: 'Block in CI/CD - significant security concerns',
    action: 'block',
  },
};

/**
 * Get score band for a given score
 * @param {number} score - Security score (0-100)
 * @returns {Object} Score band information
 */
function getScoreBand(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new Error('Score must be a valid number');
  }

  // Find the band that contains this score
  for (const [key, band] of Object.entries(SCORE_BANDS)) {
    if (score >= band.min && score <= band.max) {
      return {
        ...band,
        key,
      };
    }
  }

  // Fallback to BLOCK if score is out of expected range
  return {
    ...SCORE_BANDS.BLOCK,
    key: 'BLOCK',
  };
}

/**
 * Get all score bands
 * @returns {Object} All score band definitions
 */
function getAllScoreBands() {
  return SCORE_BANDS;
}

/**
 * Check if score should be blocked in CI/CD
 * @param {number} score - Security score
 * @returns {boolean} True if score should be blocked
 */
function shouldBlock(score) {
  const band = getScoreBand(score);
  return band.action === 'block';
}

/**
 * Get human-readable score interpretation
 * @param {number} score - Security score
 * @returns {string} Human-readable interpretation
 */
function getScoreInterpretation(score) {
  const band = getScoreBand(score);
  return `${band.emoji} ${band.label}: ${band.description}`;
}

module.exports = {
  getScoreBand,
  getAllScoreBands,
  shouldBlock,
  getScoreInterpretation,
  SCORE_BANDS,
};

