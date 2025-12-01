from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from blockchain import Blockchain
from wallet import Wallet

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # разрешаем запросы с фронтенда
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация блокчейна и кошельков
bc = Blockchain()
alice = Wallet("Alice")
bob = Wallet("Bob")
miner = Wallet("Miner")

@app.get("/chain")
def get_chain():
    return [blk.to_dict() for blk in bc.chain]

@app.get("/balances")
def get_balances():
    return bc.compute_balances(include_pending=True)

@app.post("/transaction")
def add_transaction(sender: str, recipient: str, amount: float):
    wallet_map = {"Alice": alice, "Bob": bob, "Miner": miner}
    tx = wallet_map[sender].create_transaction(recipient, amount)
    try:
        bc.add_transaction(tx)
        return {"status": "ok", "transaction": tx}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/mine")
def mine_block(miner_name: str = "Miner"):
    blk = bc.mine_pending(miner_name)
    return blk.to_dict()

@app.post("/attack")
def attack(attacker: str):
    ok, msg = bc.simulate_51_percent_attack(attacker)
    return {"success": ok, "message": msg}
