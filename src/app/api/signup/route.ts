import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/supabase';
import { linkUserTelegramAccount } from '@/lib/telegram';
import { SignupFormData, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SignupFormData = await request.json();
    const { email, telegram_username } = body;

    // Validate input
    if (!email || !telegram_username) {
      return NextResponse.json(
        { success: false, error: 'Email and Telegram username are required' } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate Telegram username format
    const telegramUsernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
    if (!telegramUsernameRegex.test(telegram_username)) {
      return NextResponse.json(
        { success: false, error: 'Telegram username must be 5-32 characters (letters, numbers, underscores only)' } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' } as ApiResponse,
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await createUser(email, telegram_username);
    if (!newUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' } as ApiResponse,
        { status: 500 }
      );
    }

    console.log(`New user created: ${email} (@${telegram_username}), verification code: ${newUser.verification_code}`);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          telegram_username: newUser.telegram_username
        },
        verification_code: newUser.verification_code,
        message: 'Account created successfully! Please complete the Telegram setup.'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error in signup API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' } as ApiResponse,
    { status: 405 }
  );
}







