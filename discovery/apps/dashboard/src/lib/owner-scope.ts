import { getOperatorId } from '@/lib/auth';

/** Resolve CRM owner filter: default to signed-in operator; `all` disables scoping. */
export async function resolveOwnerScope(
  ownerParam: string | null,
): Promise<string | undefined> {
  if (ownerParam === 'all') return undefined;
  if (ownerParam && ownerParam !== 'me') return ownerParam;
  const operatorId = await getOperatorId();
  if (operatorId) return operatorId;
  return undefined;
}
