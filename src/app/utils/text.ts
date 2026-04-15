export function sanitizeText(issueText: string): string {
  return issueText
    .replace(/\b(he|she)\b/gi, 'you')
    .replace(/\b(his|her)\b/gi, 'your');
}

