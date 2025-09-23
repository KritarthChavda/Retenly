
import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantIdFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const restaurantId = await getRestaurantIdFromToken(request);

    if (!restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { username },
    });

    return NextResponse.json({ message: 'Profile updated successfully', restaurant: updatedRestaurant });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
