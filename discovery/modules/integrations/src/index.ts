export { GmailReplyService } from './gmail-reply-service';
export {
  getGmailOAuthConfig,
  isGmailConnected,
  GMAIL_READONLY_SCOPE,
} from './gmail-config';
export {
  buildGmailAuthUrl,
  exchangeGmailAuthCode,
  refreshGmailAccessToken,
} from './gmail-client';
export { matchLeadForInboundReply, parseEmailAddress, normalizeSubject } from './reply-matcher';
export type { ReplyMatchLead } from './reply-matcher';
