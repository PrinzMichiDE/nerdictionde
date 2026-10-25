/**
 * API Route: User Hardware Profile
 * GET /api/user/hardware-profile - Get current user's hardware profile
 * PATCH /api/user/hardware-profile - Update hardware profile
 * DELETE /api/user/hardware-profile - Delete hardware profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hardwareProfileInputSchema, hardwareProfileUpdateSchema, hardwareProfileResponseSchema } from '@/lib/hardware-compatibility-schema';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const user = await prisma.twitchUser.findUnique({
      where: { id: session.userId },
      select: {
        hardwareProfile: true,
        hardwareProfileEnabled: true,
        hardwareProfileVersion: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    const response = hardwareProfileResponseSchema.parse({
      success: true,
      profile: user.hardwareProfile as { cpu: string; gpu: string; ram: string; monitor?: string; psu?: string; resolution?: string; refreshRate?: number } | null,
      enabled: user.hardwareProfileEnabled,
      version: user.hardwareProfileVersion,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[HardwareProfile GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = hardwareProfileUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // If CPU, GPU, or RAM are being updated, validate they're not empty
    const profileData: Record<string, unknown> = {};
    let hasRequiredFields = false;
    
    if (data.cpu !== undefined) profileData.cpu = data.cpu;
    if (data.gpu !== undefined) profileData.gpu = data.gpu;
    if (data.ram !== undefined) profileData.ram = data.ram;
    if (data.monitor !== undefined) profileData.monitor = data.monitor;
    if (data.psu !== undefined) profileData.psu = data.psu;
    if (data.resolution !== undefined) profileData.resolution = data.resolution;
    if (data.refreshRate !== undefined) profileData.refreshRate = data.refreshRate;
    
    // Check if required fields are present in the resulting profile
    const currentUser = await prisma.twitchUser.findUnique({
      where: { id: session.userId },
      select: { hardwareProfile: true },
    });
    
    const currentProfile = currentUser?.hardwareProfile as Record<string, unknown> | null;
    const mergedProfile = { ...currentProfile, ...profileData } as Record<string, unknown>;
    
    const requiredFields = ['cpu', 'gpu', 'ram'];
    hasRequiredFields = requiredFields.every(field => mergedProfile[field] && String(mergedProfile[field]).trim().length > 0);
    
    // If enabled is being set to true, require all fields
    if (data.enabled === true && !hasRequiredFields) {
      return NextResponse.json(
        { success: false, error: 'Für aktivierte Kompatibilitäts-Checks sind CPU, GPU und RAM erforderlich' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.twitchUser.update({
      where: { id: session.userId },
      data: {
        hardwareProfile: mergedProfile as Prisma.InputJsonValue,
        hardwareProfileEnabled: data.enabled ?? true, // Default to enabled when saving profile
        hardwareProfileVersion: { increment: 1 },
      },
      select: {
        hardwareProfile: true,
        hardwareProfileEnabled: true,
        hardwareProfileVersion: true,
      },
    });

    // Invalidate cache tags
    revalidateTag(`user:${session.userId}:hardware`, {});

    const response = hardwareProfileResponseSchema.parse({
      success: true,
      profile: updatedUser.hardwareProfile as { cpu: string; gpu: string; ram: string; monitor?: string; psu?: string; resolution?: string; refreshRate?: number } | null,
      enabled: updatedUser.hardwareProfileEnabled,
      version: updatedUser.hardwareProfileVersion,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[HardwareProfile PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    await prisma.twitchUser.update({
      where: { id: session.userId },
      data: {
        hardwareProfile: Prisma.JsonNull,
        hardwareProfileEnabled: false,
        hardwareProfileVersion: { increment: 1 },
      },
    });

    // Invalidate cache tags
    revalidateTag(`user:${session.userId}:hardware`, {});

    return NextResponse.json({ success: true, message: 'Hardware-Profil gelöscht' });
  } catch (error) {
    console.error('[HardwareProfile DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}