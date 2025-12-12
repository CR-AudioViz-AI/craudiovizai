// app/api/referrals/code/route.ts
// Get or create referral code
// Timestamp: Dec 11, 2025 11:55 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabaseClient = createServerComponentClient({ cookies });
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Get or create referral code
  let { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!referral) {
    // Create new referral record
    const code = generateCode();
    const { data: newReferral } = await supabase
      .from('referrals')
      .insert({
        user_id: userId,
        code,
        total_referrals: 0,
        converted_referrals: 0,
        credits_earned: 0,
      })
      .select()
      .single();
    referral = newReferral;
  }

  return NextResponse.json({
    code: referral?.code,
    stats: {
      total: referral?.total_referrals || 0,
      converted: referral?.converted_referrals || 0,
      earned: referral?.credits_earned || 0,
    },
  });
}
