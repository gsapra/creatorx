import razorpay
import hmac
import hashlib
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Wallet, Transaction, PayoutRequest, TransactionType, TransactionStatus, PayoutStatus
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for handling Razorpay payment operations"""

    def __init__(self, key_id: str, key_secret: str, webhook_secret: str):
        self.client = razorpay.Client(auth=(key_id, key_secret))
        self.client.set_app_details({"title": "CreatorX", "version": "1.0.0"})
        self.webhook_secret = webhook_secret

    def create_order(self, amount: float, currency: str = "INR",
                    receipt: str = None, notes: Dict = None) -> Dict:
        """Create a Razorpay order for payment"""
        try:
            order_data = {
                "amount": int(amount * 100),  # Convert to paise
                "currency": currency,
                "receipt": receipt,
                "notes": notes or {}
            }
            order = self.client.order.create(data=order_data)
            logger.info(f"Created Razorpay order: {order['id']}")
            return order
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {str(e)}")
            raise

    def verify_payment_signature(self, order_id: str, payment_id: str,
                                signature: str) -> bool:
        """Verify Razorpay payment signature"""
        try:
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except razorpay.errors.SignatureVerificationError:
            logger.warning(f"Invalid payment signature for order {order_id}")
            return False

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """Verify webhook signature"""
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return False

    def fetch_payment(self, payment_id: str) -> Dict:
        """Fetch payment details from Razorpay"""
        try:
            return self.client.payment.fetch(payment_id)
        except Exception as e:
            logger.error(f"Error fetching payment {payment_id}: {str(e)}")
            raise

    def create_payout(self, account_number: str, ifsc: str, amount: float,
                     name: str, purpose: str = "payout", notes: Dict = None) -> Dict:
        """Create a payout to bank account"""
        try:
            payout_data = {
                "account_number": account_number,
                "fund_account": {
                    "account_type": "bank_account",
                    "bank_account": {
                        "name": name,
                        "ifsc": ifsc,
                        "account_number": account_number
                    }
                },
                "amount": int(amount * 100),  # Convert to paise
                "currency": "INR",
                "mode": "IMPS",
                "purpose": purpose,
                "queue_if_low_balance": True,
                "reference_id": f"payout_{datetime.now().timestamp()}",
                "notes": notes or {}
            }
            payout = self.client.payout.create(data=payout_data)
            logger.info(f"Created payout: {payout['id']}")
            return payout
        except Exception as e:
            logger.error(f"Error creating payout: {str(e)}")
            raise

    def get_payout_status(self, payout_id: str) -> Dict:
        """Get payout status"""
        try:
            return self.client.payout.fetch(payout_id)
        except Exception as e:
            logger.error(f"Error fetching payout {payout_id}: {str(e)}")
            raise


class WalletService:
    """Service for wallet operations"""

    def __init__(self, db: Session, payment_service: PaymentService):
        self.db = db
        self.payment_service = payment_service

    def get_or_create_wallet(self, user_id: int) -> Wallet:
        """Get or create wallet for user"""
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            wallet = Wallet(user_id=user_id, balance=0.0, currency="INR")
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)
        return wallet

    def create_topup_order(self, user_id: int, amount: float) -> Tuple[Dict, Transaction]:
        """Create a topup order and pending transaction"""
        wallet = self.get_or_create_wallet(user_id)

        # Create Razorpay order
        receipt = f"topup_{user_id}_{datetime.now().timestamp()}"
        order = self.payment_service.create_order(
            amount=amount,
            receipt=receipt,
            notes={"user_id": user_id, "type": "wallet_topup"}
        )

        # Create pending transaction
        transaction = Transaction(
            wallet_id=wallet.id,
            type=TransactionType.TOPUP,
            amount=amount,
            status=TransactionStatus.PENDING,
            currency="INR",
            razorpay_order_id=order['id'],
            description=f"Wallet topup of ₹{amount}",
            meta_data={"receipt": receipt}
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)

        return order, transaction

    def verify_and_complete_payment(self, order_id: str, payment_id: str,
                                   signature: str) -> Transaction:
        """Verify payment and update wallet balance"""
        # Verify signature
        if not self.payment_service.verify_payment_signature(order_id, payment_id, signature):
            raise ValueError("Invalid payment signature")

        # Find transaction
        transaction = self.db.query(Transaction).filter(
            Transaction.razorpay_order_id == order_id
        ).first()

        if not transaction:
            raise ValueError("Transaction not found")

        if transaction.status == TransactionStatus.COMPLETED:
            logger.warning(f"Transaction {transaction.id} already completed")
            return transaction

        # Fetch payment details from Razorpay for verification
        payment = self.payment_service.fetch_payment(payment_id)

        if payment['status'] != 'captured' and payment['status'] != 'authorized':
            transaction.status = TransactionStatus.FAILED
            self.db.commit()
            raise ValueError(f"Payment not successful. Status: {payment['status']}")

        # Update transaction
        transaction.razorpay_payment_id = payment_id
        transaction.razorpay_signature = signature
        transaction.status = TransactionStatus.COMPLETED
        transaction.completed_at = datetime.now()

        # Update wallet balance (with optimistic locking)
        wallet = transaction.wallet
        wallet.balance += transaction.amount
        wallet.version += 1

        self.db.commit()
        self.db.refresh(transaction)

        logger.info(f"Payment completed: Transaction {transaction.id}, Amount: {transaction.amount}")
        return transaction

    def get_balance(self, user_id: int) -> float:
        """Get user wallet balance"""
        wallet = self.get_or_create_wallet(user_id)
        return wallet.balance

    def get_transactions(self, user_id: int, limit: int = 50, offset: int = 0):
        """Get user transaction history"""
        wallet = self.get_or_create_wallet(user_id)
        transactions = self.db.query(Transaction).filter(
            Transaction.wallet_id == wallet.id
        ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
        return transactions

    def create_payout_request(self, user_id: int, amount: float,
                             bank_details: Dict) -> PayoutRequest:
        """Create a payout request"""
        wallet = self.get_or_create_wallet(user_id)

        # Check balance
        if wallet.balance < amount:
            raise ValueError("Insufficient balance")

        # Calculate processing fee (e.g., 2% or fixed amount)
        processing_fee = max(10, amount * 0.02)  # Min ₹10 or 2%
        net_amount = amount - processing_fee

        # Create payout request
        payout_request = PayoutRequest(
            user_id=user_id,
            amount=amount,
            currency="INR",
            bank_account_number=bank_details['account_number'],
            bank_ifsc_code=bank_details['ifsc_code'],
            bank_account_name=bank_details['account_name'],
            bank_name=bank_details.get('bank_name'),
            processing_fee=processing_fee,
            net_amount=net_amount,
            status=PayoutStatus.PENDING
        )
        self.db.add(payout_request)
        self.db.commit()
        self.db.refresh(payout_request)

        return payout_request

    def process_payout(self, payout_request_id: int) -> Transaction:
        """Process payout request (admin action)"""
        payout_req = self.db.query(PayoutRequest).filter(
            PayoutRequest.id == payout_request_id
        ).first()

        if not payout_req:
            raise ValueError("Payout request not found")

        if payout_req.status != PayoutStatus.PENDING:
            raise ValueError(f"Payout request already {payout_req.status}")

        wallet = self.get_or_create_wallet(payout_req.user_id)

        # Check balance again
        if wallet.balance < payout_req.amount:
            payout_req.status = PayoutStatus.FAILED
            payout_req.admin_notes = "Insufficient balance"
            self.db.commit()
            raise ValueError("Insufficient balance")

        try:
            # Create payout with Razorpay
            payout = self.payment_service.create_payout(
                account_number=payout_req.bank_account_number,
                ifsc=payout_req.bank_ifsc_code,
                amount=payout_req.net_amount,
                name=payout_req.bank_account_name,
                notes={"payout_request_id": payout_req.id, "user_id": payout_req.user_id}
            )

            # Update payout request
            payout_req.status = PayoutStatus.PROCESSING

            # Create transaction
            transaction = Transaction(
                wallet_id=wallet.id,
                type=TransactionType.PAYOUT,
                amount=-payout_req.amount,  # Negative for deduction
                status=TransactionStatus.COMPLETED,
                currency="INR",
                razorpay_payout_id=payout['id'],
                payout_request_id=payout_req.id,
                description=f"Withdrawal of ₹{payout_req.amount}",
                completed_at=datetime.now(),
                meta_data={"processing_fee": payout_req.processing_fee}
            )

            # Deduct from wallet
            wallet.balance -= payout_req.amount
            wallet.version += 1

            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)

            return transaction

        except Exception as e:
            payout_req.status = PayoutStatus.FAILED
            payout_req.admin_notes = str(e)
            self.db.commit()
            raise
