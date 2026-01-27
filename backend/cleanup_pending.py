#!/usr/bin/env python3
"""
Manual script to clean up pending transactions
Run this once to fix existing pending transactions in the database
"""

from app.core.database import SessionLocal
from app.models.models import Transaction, TransactionStatus
from datetime import datetime, timedelta

def cleanup_pending_transactions():
    db = SessionLocal()
    try:
        # Find all pending transactions (regardless of age)
        pending_transactions = db.query(Transaction).filter(
            Transaction.status == TransactionStatus.PENDING
        ).all()

        if not pending_transactions:
            print("✅ No pending transactions found")
            return

        print(f"Found {len(pending_transactions)} pending transactions:")
        for txn in pending_transactions:
            age_minutes = (datetime.now() - txn.created_at).total_seconds() / 60
            print(f"  - Transaction #{txn.id}: ₹{txn.amount}, {age_minutes:.1f} minutes old")

        # Mark them all as failed
        for txn in pending_transactions:
            txn.status = TransactionStatus.FAILED
            txn.description = f"{txn.description} - Marked failed by cleanup script"

        db.commit()
        print(f"\n✅ Successfully marked {len(pending_transactions)} transactions as failed")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Cleaning up pending transactions...")
    cleanup_pending_transactions()
