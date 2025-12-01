import hashlib
import json
import time
from typing import List

class Block:
    def __init__(self, index: int, previous_hash: str, transactions: List[dict], nonce: int = 0, timestamp: float = None):
        self.index = index
        self.previous_hash = previous_hash
        self.transactions = transactions
        self.nonce = nonce
        self.timestamp = timestamp or time.time()
        self.merkle_root = None
        self.hash = None

    def compute_merkle_root(self, merkle_func):
        self.merkle_root = merkle_func(self.transactions)
        return self.merkle_root

    def compute_hash(self):
        block_string = json.dumps({
            'index': self.index,
            'previous_hash': self.previous_hash,
            'transactions': self.transactions,
            'nonce': self.nonce,
            'timestamp': self.timestamp,
            'merkle_root': self.merkle_root
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self):
        return {
            'index': self.index,
            'previous_hash': self.previous_hash,
            'transactions': self.transactions,
            'nonce': self.nonce,
            'timestamp': self.timestamp,
            'merkle_root': self.merkle_root,
            'hash': self.hash
        }