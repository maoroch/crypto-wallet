# ----- file: blockchain.py -----
import time
from typing import List
from block import Block
from merkle import merkle_root
from transaction import Transaction

PROOF_DIFFICULTY = 3  # number of leading zeros required in hex hash (small for demo)

class Blockchain:
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[dict] = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis = Block(0, '0'*64, [], nonce=0, timestamp=time.time())
        genesis.merkle_root = merkle_root([])
        genesis.hash = genesis.compute_hash()
        self.chain.append(genesis)

    @property
    def last_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, tx: dict):
        # Basic validation: sender, recipient, amount
        if 'sender' not in tx or 'recipient' not in tx or 'amount' not in tx:
            raise ValueError('Invalid transaction format')
        if tx['amount'] <= 0:
            raise ValueError('Amount must be positive')
        # Check double spending & balances: ensure sender has enough funds in current state
        if tx['sender'] != 'COINBASE':
            balances = self.compute_balances(include_pending=True)
            if balances.get(tx['sender'], 0) < tx['amount']:
                raise ValueError(f"Insufficient funds for {tx['sender']} (has {balances.get(tx['sender'],0)})")
        self.pending_transactions.append(tx)

    def mine_pending(self, miner_address: str):
        # Coinbase reward
        coinbase = {'sender': 'COINBASE', 'recipient': miner_address, 'amount': 50}
        block_txs = [coinbase] + self.pending_transactions

        new_block = Block(self.last_block.index + 1, self.last_block.hash, block_txs)
        new_block.compute_merkle_root(merkle_root)

        # Proof-of-Work
        target = '0' * PROOF_DIFFICULTY
        nonce = 0
        while True:
            new_block.nonce = nonce
            new_block.timestamp = time.time()
            new_block.hash = new_block.compute_hash()
            if new_block.hash.startswith(target):
                break
            nonce += 1

        # Add to chain
        self.chain.append(new_block)
        self.pending_transactions = []
        return new_block

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]

            # check hash
            if current.hash != current.compute_hash():
                return False, f'Invalid hash at block {current.index}'
            if current.previous_hash != previous.hash:
                return False, f'Previous hash mismatch at block {current.index}'

            # check merkle
            if current.merkle_root != merkle_root(current.transactions):
                return False, f'Merkle root mismatch at block {current.index}'

        return True, 'Chain is valid'

    def compute_balances(self, include_pending=False):
        balances = {}
        # walk through blocks
        for blk in self.chain:
            for tx in blk.transactions:
                balances[tx['sender']] = balances.get(tx['sender'], 0) - tx['amount'] if tx['sender'] != 'COINBASE' else balances.get('COINBASE', 0) - 0
                balances[tx['recipient']] = balances.get(tx['recipient'], 0) + tx['amount']
        if include_pending:
            for tx in self.pending_transactions:
                balances[tx['sender']] = balances.get(tx['sender'], 0) - tx['amount']
                balances[tx['recipient']] = balances.get(tx['recipient'], 0) + tx['amount']
        # remove COINBASE negative artifact if present
        if 'COINBASE' in balances and balances['COINBASE'] <= 0:
            balances.pop('COINBASE', None)
        return balances

    def simulate_51_percent_attack(self, attacker_address: str):
        # naive simulation: attacker creates a competing chain rewriting last N blocks
        # For demo: attacker tries to replace last mined block with a hidden block that pays him
        if len(self.chain) < 2:
            return False, 'Not enough blocks to attack'
        # Copy current chain up to last-1
        fork = self.chain[:-1].copy()
        # Create a malicious block spending coinbase to attacker (double spend scenario)
        last_index = fork[-1].index + 1
        malicious_txs = [{'sender': 'COINBASE', 'recipient': attacker_address, 'amount': 50}]
        blk = Block(last_index, fork[-1].hash, malicious_txs)
        blk.compute_merkle_root(merkle_root)
        # mine it (PoW)
        target = '0' * PROOF_DIFFICULTY
        nonce = 0
        while True:
            blk.nonce = nonce
            blk.timestamp = time.time()
            blk.hash = blk.compute_hash()
            if blk.hash.startswith(target):
                break
            nonce += 1
        # Attacker chain is longer/equal -> replace
        fork.append(blk)
        # Replace if fork longer
        if len(fork) > len(self.chain):
            self.chain = fork
            return True, 'Attack successful: chain replaced'
        else:
            return False, 'Attack failed: fork not longer'
