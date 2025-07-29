import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { sendCompletionEmail } from '@/lib/email';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { expected_delivery, tracking_url, completion_notes } = body;

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        completed_at: new Date().toISOString(),
        expected_delivery,
        tracking_url,
        completion_notes,
        status: 'completed',
      })
      .eq('id', params.id)
      .select(`id,email,ordered_by,expected_delivery,tracking_url,completion_notes,brands(name)`)
      .single();

    if (error) throw error;

    if (submission) {
      try {
        await sendCompletionEmail(submission);
      } catch (e) {
        console.error('sendCompletionEmail failed', e);
      }
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: `Failed to update submission: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
