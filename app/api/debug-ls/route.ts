import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    PAYMENT_PROCESSOR: process.env.PAYMENT_PROCESSOR ?? '(not set)',
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY
      ? process.env.LEMONSQUEEZY_API_KEY.slice(0, 20) + '...'
      : '(not set)',
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID ?? '(not set)',
    LEMONSQUEEZY_ANNUAL_VARIANT_ID: process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID ?? '(not set)',
    LEMONSQUEEZY_MONTHLY_VARIANT_ID: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID ?? '(not set)',
  })
}
