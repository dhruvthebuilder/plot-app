import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { userId, company, industry, brandColor, fontPair } = await req.json()

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const supabase = createServiceClient()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company: company || '', industry: industry || 'Finance & Investment' })
      .eq('id', userId)

    if (profileError) console.warn('Profile update:', profileError.message)

    const { error: brandError } = await supabase
      .from('brand_kits')
      .insert({
        user_id: userId,
        name: company || 'Default',
        primary_color: brandColor || '#5B9CF6',
        font_pair: fontPair || 'inter-jetbrains',
        is_default: true,
      })

    if (brandError) {
      console.warn('Brand kit insert:', brandError.message)
      return NextResponse.json({ error: brandError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
