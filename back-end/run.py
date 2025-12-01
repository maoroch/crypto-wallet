# blockchain/run.py

import sys
from blockchain import Blockchain
from wallet import Wallet
from node import Node


def main():
    bc = Blockchain()
    # create two wallets
    alice = Wallet('Alice')
    bob = Wallet('Bob')
    miner = Wallet('Miner')

    # create nodes
    node_a = Node('A', bc)
    node_b = Node('B', bc)
    node_a.connect(node_b)

    print('Mini-Blockchain (demo)')

    while True:
        print('\nMenu:')
        print('1. Show chain')
        print('2. Show balances')
        print('3. Add transaction (Alice -> Bob 10)')
        print('4. Mine pending transactions')
        print('5. Simulate 51% attack (attacker: Mallory)')
        print('6. Exit')
        choice = input('Choice: ').strip()

        if choice == '1':
            for blk in bc.chain:
                print(blk.to_dict())
        elif choice == '2':
            print(bc.compute_balances(include_pending=True))
        elif choice == '3':
            try:
                tx = alice.create_transaction('Bob', 10)
                bc.add_transaction(tx)
                # broadcast through node A
                node_a.broadcast_transaction(tx)
                print('Transaction added to pending pool')
            except Exception as e:
                print('Failed to add transaction:', e)
        elif choice == '4':
            blk = bc.mine_pending(miner.name)
            print('Mined block:', blk.to_dict())
        elif choice == '5':
            ok, msg = bc.simulate_51_percent_attack('Mallory')
            print(msg)
        elif choice == '6':
            print('Bye')
            sys.exit(0)
        else:
            print('Unknown choice')

if __name__ == '__main__':
    main()
