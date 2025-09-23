
import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantIdFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getRestaurantIdFromToken(request);

    if (!restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, restaurant.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
