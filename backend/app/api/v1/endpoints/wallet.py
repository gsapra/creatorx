from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    WalletResponse, TopupRequest, TopupOrderResponse,
    PaymentVerificationRequest, TransactionResponse,
    PayoutRequestSchema, PayoutRequestResponse
)
from app.api.v1.endpoints.auth import get_current_user
from app.services.payment_service import WalletService, PaymentService
from app.core.config import settings
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


def get_payment_service() -> PaymentService:
    """Dependency to get PaymentService instance"""
    return PaymentService(
        key_id=settings.RAZORPAY_KEY_ID,
        key_secret=settings.RAZORPAY_KEY_SECRET,
        webhook_secret=settings.RAZORPAY_WEBHOOK_SECRET
    )


@router.get("/balance", response_model=WalletResponse)
async def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get current user's wallet balance"""
    wallet_service = WalletService(db, payment_service)
    wallet = wallet_service.get_or_create_wallet(current_user.id)
    return wallet


@router.post("/topup", response_model=TopupOrderResponse)
async def create_topup_order(
    topup_data: TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Create a Razorpay order for wallet topup"""
    try:
        wallet_service = WalletService(db, payment_service)
        order, transaction = wallet_service.create_topup_order(
            user_id=current_user.id,
            amount=topup_data.amount
        )

        return {
            "order_id": order['id'],
            "amount": topup_data.amount,
            "currency": topup_data.currency,
            "razorpay_key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        logger.error(f"Error creating topup order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-payment", response_model=TransactionResponse)
async def verify_payment(
    payment_data: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Verify payment and credit wallet"""
    try:
        wallet_service = WalletService(db, payment_service)
        transaction = wallet_service.verify_and_complete_payment(
            order_id=payment_data.razorpay_order_id,
            payment_id=payment_data.razorpay_payment_id,
            signature=payment_data.razorpay_signature
        )
        return transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get transaction history"""
    wallet_service = WalletService(db, payment_service)
    transactions = wallet_service.get_transactions(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    return transactions


@router.post("/payout", response_model=PayoutRequestResponse)
async def request_payout(
    payout_data: PayoutRequestSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Request withdrawal (creators only)"""
    if current_user.role != "creator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creators can request payouts"
        )

    try:
        wallet_service = WalletService(db, payment_service)
        payout_request = wallet_service.create_payout_request(
            user_id=current_user.id,
            amount=payout_data.amount,
            bank_details={
                'account_number': payout_data.bank_account_number,
                'ifsc_code': payout_data.bank_ifsc_code,
                'account_name': payout_data.bank_account_name,
                'bank_name': payout_data.bank_name
            }
        )

        # Mask account number in response
        response_data = PayoutRequestResponse.model_validate(payout_request)
        response_data.bank_account_number = f"****{payout_request.bank_account_number[-4:]}"
        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Payout request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payout request")


@router.post("/cleanup-pending")
async def cleanup_pending_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark old pending transactions as failed (older than 30 minutes)"""
    from app.models.models import Transaction, TransactionStatus, Wallet
    from datetime import datetime, timedelta

    try:
        # Get user's wallet
        wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        if not wallet:
            return {"cleaned": 0}

        # Find pending transactions older than 30 minutes
        cutoff_time = datetime.now() - timedelta(minutes=30)
        old_pending = db.query(Transaction).filter(
            Transaction.wallet_id == wallet.id,
            Transaction.status == TransactionStatus.PENDING,
            Transaction.created_at < cutoff_time
        ).all()

        count = 0
        for transaction in old_pending:
            transaction.status = TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - Timed out"
            count += 1

        if count > 0:
            db.commit()
            logger.info(f"✅ Cleaned up {count} old pending transactions for user {current_user.id}")

        return {"cleaned": count, "message": f"Marked {count} old pending transactions as failed"}

    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")
        return {"cleaned": 0, "error": str(e)}


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Handle Razorpay webhook events"""
    try:
        payload = await request.body()
        signature = request.headers.get('X-Razorpay-Signature', '')

        if not payment_service.verify_webhook_signature(payload.decode(), signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

        event = json.loads(payload)
        event_type = event.get('event')

        # Handle different event types
        if event_type == 'payment.captured':
            # Payment successful, already handled in verify_payment
            payment_id = event['payload']['payment']['entity']['id']
            logger.info(f"✅ Webhook: Payment captured: {payment_id}")

        elif event_type == 'payment.failed':
            payment_entity = event['payload']['payment']['entity']
            payment_id = payment_entity['id']
            order_id = payment_entity.get('order_id')
            error_reason = payment_entity.get('error_description', 'Payment failed')

            logger.warning(f"❌ Webhook: Payment failed: {payment_id}, Order: {order_id}, Reason: {error_reason}")

            # Mark transaction as failed
            if order_id:
                from app.models.models import Transaction, TransactionStatus
                transaction = db.query(Transaction).filter(
                    Transaction.razorpay_order_id == order_id
                ).first()

                if transaction and transaction.status == TransactionStatus.PENDING:
                    transaction.status = TransactionStatus.FAILED
                    transaction.razorpay_payment_id = payment_id
                    transaction.description = f"{transaction.description} - Failed: {error_reason}"
                    db.commit()
                    logger.info(f"✅ Marked transaction {transaction.id} as failed")

        elif event_type == 'payout.processed':
            payout_id = event['payload']['payout']['entity']['id']
            logger.info(f"✅ Webhook: Payout processed: {payout_id}")
            # Update payout status to completed
            from app.models.models import PayoutRequest, PayoutStatus
            payout_request = db.query(PayoutRequest).join(
                Transaction
            ).filter(
                Transaction.razorpay_payout_id == payout_id
            ).first()

            if payout_request:
                payout_request.status = PayoutStatus.COMPLETED
                db.commit()
                logger.info(f"✅ Marked payout request {payout_request.id} as completed")

        elif event_type == 'payout.failed':
            payout_entity = event['payload']['payout']['entity']
            payout_id = payout_entity['id']
            error_reason = payout_entity.get('failure_reason', 'Payout failed')

            logger.warning(f"❌ Webhook: Payout failed: {payout_id}, Reason: {error_reason}")
            # Refund amount to wallet
            from app.models.models import PayoutRequest, PayoutStatus, Transaction, Wallet
            payout_request = db.query(PayoutRequest).join(
                Transaction
            ).filter(
                Transaction.razorpay_payout_id == payout_id
            ).first()

            if payout_request:
                payout_request.status = PayoutStatus.FAILED
                payout_request.admin_notes = error_reason

                # Refund the amount back to wallet
                wallet = db.query(Wallet).filter(
                    Wallet.user_id == payout_request.user_id
                ).first()

                if wallet:
                    wallet.balance += payout_request.amount
                    wallet.version += 1
                    logger.info(f"✅ Refunded ₹{payout_request.amount} to wallet {wallet.id}")

                db.commit()

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"❌ Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
