# ----- file: wallet.py -----
# Very simple wallet simulation: a wallet is identified by a string (name)
# Balances are tracked in the blockchain, wallets just create transactions

class Wallet:
    def __init__(self, name: str):
        self.name = name

    def create_transaction(self, to: str, amount: float):
        return {'sender': self.name, 'recipient': to, 'amount': amount}
