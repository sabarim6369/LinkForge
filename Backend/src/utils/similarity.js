/**
 * String Similarity Utility
 * Calculate similarity between two strings (for deduplication)
 */

/**
 * Levenshtein distance algorithm
 * Measures the minimum edits needed to transform one string to another
 * @param {string} str1
 * @param {string} str2
 * @returns {number} Distance score
 */
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // Deletion
        matrix[j - 1][i] + 1, // Insertion
        matrix[j - 1][i - 1] + indicator // Substitution
      );
    }
  }

  return matrix[len2][len1];
};

/**
 * Calculate similarity percentage between two strings
 * @param {string} str1
 * @param {string} str2
 * @returns {number} Similarity score 0-100
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity);
};

/**
 * Check if two titles are similar enough to be considered duplicates
 * @param {string} title1
 * @param {string} title2
 * @param {number} threshold - Similarity threshold (0-100), default 85%
 * @returns {boolean}
 */
const isSimilar = (title1, title2, threshold = 85) => {
  return calculateSimilarity(title1, title2) >= threshold;
};

module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  isSimilar,
};
