# ----- file: merkle.py -----
import hashlib
from typing import List


def _hash_pair(a: str, b: str) -> str:
    return hashlib.sha256((a + b).encode()).hexdigest()


def merkle_root(transactions: List[dict]) -> str:
    """
    Simple Merkle root: hash transactions (as JSON) and build tree.
    If empty list -> return empty string.
    """
    if not transactions:
        return ''

    leaves = [hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest() for tx in transactions]

    while len(leaves) > 1:
        if len(leaves) % 2 == 1:
            leaves.append(leaves[-1])  # duplicate last for pairing
        new_level = []
        for i in range(0, len(leaves), 2):
            new_level.append(_hash_pair(leaves[i], leaves[i+1]))
        leaves = new_level
    return leaves[0]

# We import json lazily to avoid circular import at top-level
import json
