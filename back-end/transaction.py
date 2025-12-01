# ----- file: transaction.py -----
import json

class Transaction:
    def __init__(self, sender: str, recipient: str, amount: float):
        self.sender = sender
        self.recipient = recipient
        self.amount = amount

    def to_dict(self):
        return {
            'sender': self.sender,
            'recipient': self.recipient,
            'amount': self.amount
        }

    def __repr__(self):
        return json.dumps(self.to_dict())


# ----- file: wallet.py -----
# Very simple wallet simulation: a wallet is identified by a string (name)
# Balances are tracked in the blockchain, wallets just create transactions

class Wallet:
    def __init__(self, name: str):
        self.name = name

    def create_transaction(self, to: str, amount: float):
        return {'sender': self.name, 'recipient': to, 'amount': amount}

