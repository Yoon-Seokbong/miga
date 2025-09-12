import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const webhookData = await request.json();
    const { eventType, content } = webhookData;

    console.log(`[Toss Webhook] Received event: ${eventType}`);
    console.log('[Toss Webhook] Content:', JSON.stringify(content, null, 2));

    // For simplicity, we'll only handle PAYMENT_STATUS_CHANGED for now
    // In a real application, you'd verify the webhook signature for security.

    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      const { paymentKey, orderId, status: paymentStatus } = content;

      // Find the order in your database using tossOrderId
      const order = await prisma.order.findUnique({
        where: { tossOrderId: orderId },
      });

      if (!order) {
        console.error(`[Toss Webhook] Order not found for tossOrderId: ${orderId}`);
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      let newOrderStatus = order.status; // Default to current status
      let isPaid = order.isPaid; // Default to current isPaid

      switch (paymentStatus) {
        case 'DONE':
          newOrderStatus = 'PAID';
          isPaid = true;
          break;
        case 'CANCELED':
        case 'PARTIAL_CANCELED':
          newOrderStatus = 'CANCELLED'; // Or PARTIAL_CANCELLED
          isPaid = false;
          break;
        case 'WAITING_FOR_DEPOSIT': // For virtual accounts
          newOrderStatus = 'WAITING_FOR_DEPOSIT';
          isPaid = false;
          break;
        // Add other statuses as needed (e.g., ABORTED, EXPIRED)
        default:
          console.warn(`[Toss Webhook] Unhandled payment status: ${paymentStatus}`);
          break;
      }

      // Update order in database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newOrderStatus,
          isPaid: isPaid,
          paymentKey: paymentKey, // Update paymentKey if it's the first notification
          // You might want to store more details from the webhook content
        },
      });

      console.log(`[Toss Webhook] Order ${order.id} status updated to ${newOrderStatus}`);
    }

    // Always return 200 OK to acknowledge receipt of the webhook
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('[Toss Webhook] Error processing webhook:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: `Error processing webhook: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 });
  }
}