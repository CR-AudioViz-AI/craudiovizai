export const NO_REFUND_POLICY = {
  VERSION: '1.0',
  URL: 'https://craudiovizai.com/policies/no-refund',
  REQUIRED_METADATA_KEYS: [
    'no_refund_required',
    'no_refund_policy_version',
    'no_refund_policy_url'
  ] as const,
  CONSENT_MESSAGE:
    'All purchases are final and non-refundable. By completing this purchase, you acknowledge and agree to our No-Refund Policy.'
} as const;

export function buildNoRefundMetadata() {
  return {
    no_refund_required: 'true',
    no_refund_policy_version: NO_REFUND_POLICY.VERSION,
    no_refund_policy_url: NO_REFUND_POLICY.URL
  };
}

export function verifyNoRefundMetadata(
  metadata: Record<string, string | null | undefined>
): { ok: true } | { ok: false; reason: string } {
  for (const key of NO_REFUND_POLICY.REQUIRED_METADATA_KEYS) {
    if (!metadata[key]) {
      return { ok: false, reason: `missing_${key}` };
    }
  }

  if (metadata.no_refund_required !== 'true') {
    return { ok: false, reason: 'no_refund_not_required' };
  }

  if (metadata.no_refund_policy_version !== NO_REFUND_POLICY.VERSION) {
    return {
      ok: false,
      reason: `version_mismatch_${metadata.no_refund_policy_version}`
    };
  }

  return { ok: true };
}
