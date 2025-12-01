# ----- file: node.py -----
# Simple node simulation: stores a blockchain and can broadcast transactions to peers (simulated)
from blockchain import Blockchain

class Node:
    def __init__(self, name: str, blockchain: Blockchain):
        self.name = name
        self.blockchain = blockchain
        self.peers = []

    def connect(self, other_node: 'Node'):
        if other_node not in self.peers:
            self.peers.append(other_node)
            other_node.peers.append(self)

    def broadcast_transaction(self, tx: dict):
        # naive broadcast: send tx to peers' pending tx pools
        for p in self.peers:
            try:
                p.blockchain.add_transaction(tx)
            except Exception as e:
                # ignore invalid txs for demo
                pass

