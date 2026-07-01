import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { z } from 'zod'

const WalkInSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  physical_address: z.string().optional(),
  vehicle: z.object({
    year: z.number().int().min(1900).max(2030),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    license_plate: z.string().optional(),
    mileage: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, remaining } = checkRateLimit(`walkin:${ip}`, {
      maxRequests: 5,
      windowMs: 60_000,
    })

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // 1. Validate body
    let body: z.infer<typeof WalkInSchema>
    try {
      const raw = await request.json()
      body = WalkInSchema.parse(raw)
    } catch (err: any) {
      return NextResponse.json(
        { error: err.errors?.[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // 2. Generate a dummy email if not provided
    const email = body.email?.trim() || `${Date.now()}@walkin.autofield.local`
    const password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

    // 3. Create user via Admin API (does NOT affect current session)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name.trim(),
        role: 'client',
      },
    })

    if (authError || !authData.user) {
      console.error('Admin createUser error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 4. Update profile with extra fields
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name.trim(),
        phone: body.phone.trim(),
        physical_address: body.physical_address?.trim() || null,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail — profile trigger may have already created it
    }

    // 5. Create vehicle if provided
    let vehicleId: string | null = null
    if (body.vehicle?.make && body.vehicle?.model) {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: userId,
          make: body.vehicle.make.trim(),
          model: body.vehicle.model.trim(),
          year: body.vehicle.year,
          license_plate: body.vehicle.license_plate?.trim() || null,
          mileage: body.vehicle.mileage?.trim() || null,
        })
        .select('id')
        .single()

      if (vehicleError) {
        console.error('Vehicle insert error:', vehicleError)
      } else {
        vehicleId = vehicleData?.id ?? null
      }
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      customer: {
        id: userId,
        full_name: body.full_name.trim(),
        email,
        phone: body.phone.trim(),
      },
      vehicle_id: vehicleId,
      message: 'Walk-in customer created successfully',
    })
  } catch (err: any) {
    console.error('Walk-in API error:', err)
    return NextResponse.json(
      { error: 'Internal server error', message: err.message },
      { status: 500 }
    )
  }
}
