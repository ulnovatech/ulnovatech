export function apiErrorStatus(message: string): number {
  if (
    message.includes('Cannot') ||
    message.includes('must be') ||
    message.includes('not found') ||
    message.includes('Invalid lead transition')
  ) {
    return 400;
  }
  return 500;
}
