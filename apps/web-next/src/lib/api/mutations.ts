'use server';

import { revalidateTag } from 'next/cache';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function createConversation(type: 'PRIVATE' | 'GROUP') {
  try {
    const response = await fetch(`${apiUrl}/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error(`Creation failed (${response.status})`);
    }

    const data = await response.json();

    revalidateTag('conversations');

    return data;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    throw error;
  }
}

export async function addParticipantToConversation(conversationId: string, userId: string) {
  try {
    const response = await fetch(`${apiUrl}/chat/conversations/${conversationId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Adding participant failed (${response.status})`);
    }

    revalidateTag('conversations');

    return await response.json();
  } catch (error) {
    console.error('Failed to add participant:', error);
    throw error;
  }
}

export async function sendMessage(conversationId: string, content: string, userId: string) {
  try {
    const response = await fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, userId }),
    });

    if (!response.ok) {
      throw new Error(`Message send failed (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}
