// Spam and profanity detection for reviews

const PROFANITY_LIST = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'bastard',
  // Add more as needed
];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export interface SpamCheckResult {
  isSpam: boolean;
  isFlagged: boolean;
  reasons: string[];
}

export function checkReviewForSpam(
  title: string,
  text: string
): SpamCheckResult {
  const reasons: string[] = [];
  let isFlagged = false;

  // Check for excessive URLs
  const urlMatches = text.match(URL_REGEX);
  if (urlMatches && urlMatches.length > 2) {
    reasons.push('Contains multiple URLs');
    isFlagged = true;
  }

  // Check for all caps
  const capsRatio = text.replace(/[^A-Z]/g, '').length / text.length;
  if (capsRatio > 0.7 && text.length > 20) {
    reasons.push('Excessive use of capital letters');
    isFlagged = true;
  }

  // Check for minimum length
  if (text.trim().length < 20) {
    reasons.push('Review too short');
    isFlagged = true;
  }

  // Check for profanity
  const combinedText = `${title} ${text}`.toLowerCase();
  const foundProfanity = PROFANITY_LIST.filter(word =>
    combinedText.includes(word)
  );
  if (foundProfanity.length > 0) {
    reasons.push(`Contains inappropriate language`);
    isFlagged = true;
  }

  return {
    isSpam: false, // We don't auto-reject, just flag
    isFlagged,
    reasons
  };
}

export function checkForDuplicateReview(
  text: string,
  existingReviews: Array<{ review_text: string }>
): boolean {
  const normalizedText = text.toLowerCase().trim();
  return existingReviews.some(
    review => review.review_text.toLowerCase().trim() === normalizedText
  );
}
