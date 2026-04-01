/**
 * Deduplicate News Service
 * Removes similar/duplicate news items using string similarity
 */

const { calculateSimilarity, isSimilar } = require('../../utils/similarity');
const logger = require('../../utils/logger');

/**
 * Find and mark duplicates in a news array
 * Uses string similarity to detect near-duplicates
 * @param {Array} normalizedNews - Array of normalized news items
 * @param {number} threshold - Similarity threshold (0-100), default 85%
 * @returns {Array} Deduplicated news array (keeps first occurrence)
 */
const deduplicateNews = (normalizedNews, threshold = 85) => {
  if (!normalizedNews || normalizedNews.length === 0) {
    return [];
  }

  const seen = new Set();
  const duplicates = [];
  const deduplicated = [];

  for (let i = 0; i < normalizedNews.length; i++) {
    const current = normalizedNews[i];
    let isDuplicate = false;

    // Check against all previously seen items
    for (let j = 0; j < deduplicated.length; j++) {
      const previous = deduplicated[j];

      // Check both title similarity and URL match
      const titleSimilarity = calculateSimilarity(current.title, previous.title);
      const sameUrl = current.url === previous.url;
      const sameSource = current.source === previous.source;

      // Mark as duplicate if:
      // 1. Exact same URL, OR
      // 2. Very similar title (85%+ match)
      if (sameUrl || (titleSimilarity >= threshold && sameSource)) {
        isDuplicate = true;
        duplicates.push({
          original: previous.title,
          duplicate: current.title,
          similarity: titleSimilarity,
        });
        break;
      }
    }

    if (!isDuplicate) {
      deduplicated.push(current);
      seen.add(current.url);
    }
  }

  // Log deduplication results
  if (duplicates.length > 0) {
    logger.info(`🔄 Removed ${duplicates.length} duplicate/similar articles`);
    duplicates.slice(0, 3).forEach(dup => {
      logger.debug(
        `Duplicate detected: "${dup.duplicate}" (${dup.similarity}% match with "${dup.original}")`
      );
    });
  }

  logger.info(`✅ Deduplication complete: ${deduplicated.length} unique articles remain`);
  return deduplicated;
};

/**
 * Alternative: Find groups of similar articles
 * Useful for grouping related news items
 * @param {Array} normalizedNews - Array of normalized news items
 * @param {number} threshold - Similarity threshold (0-100)
 * @returns {Array<Array>} Array of groups, each group contains similar articles
 */
const groupSimilarNews = (normalizedNews, threshold = 75) => {
  if (!normalizedNews || normalizedNews.length === 0) {
    return [];
  }

  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < normalizedNews.length; i++) {
    if (assigned.has(i)) continue;

    const group = [normalizedNews[i]];
    assigned.add(i);

    // Find all similar articles
    for (let j = i + 1; j < normalizedNews.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = calculateSimilarity(
        normalizedNews[i].title,
        normalizedNews[j].title
      );

      if (similarity >= threshold) {
        group.push(normalizedNews[j]);
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  logger.info(`📊 Grouped ${normalizedNews.length} articles into ${groups.length} groups`);
  return groups;
};

/**
 * Select best article from each group
 * Picks the one with highest engagement score
 * @param {Array<Array>} groups - Groups of similar articles
 * @returns {Array} Single best article from each group
 */
const selectBestFromGroups = (groups) => {
  return groups.map(group => {
    // Sort by engagement and return the highest
    return group.reduce((best, current) => {
      return current.engagement > best.engagement ? current : best;
    });
  });
};

module.exports = {
  deduplicateNews,
  groupSimilarNews,
  selectBestFromGroups,
};
