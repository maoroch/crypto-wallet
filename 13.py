class Blockchain:
    def __init__(self, name):
        self.name = name
        self.confirmed_transactions = []
        self.spent = set()  # хранит пары (отправитель, сумма)

    def add_block(self, tx_list):
        print(f"\nДобавляем блок с {len(tx_list)} транзакциями:")
        for tx in tx_list:
            sender, receiver, amount = self.parse_tx(tx)
            key = (sender, amount)

            if key in self.spent:
                print(f"Ошибка! Двойное списание для {sender} с суммой {amount}")
                continue  # пропускаем такую транзакцию

            self.spent.add(key)
            self.confirmed_transactions.append(tx)
            print(f"Подтверждена транзакция: {tx}")

        print(f"Текущие подтверждённые транзакции: {self.confirmed_transactions}")

    def parse_tx(self, tx):
        # Формат: "A -> B : 10 COIN"
        parts = tx.split()
        sender = parts[0]
        receiver = parts[2]
        amount = int(parts[4])
        return sender, receiver, amount

    def __repr__(self):
        return f"Blockchain({self.name}, total_transactions={len(self.confirmed_transactions)})"


# Пример использования
bc = Blockchain("TestChain")
bc.add_block(["A -> B : 10 COIN", "B -> C : 5 COIN"])
bc.add_block(["A -> D : 10 COIN", "C -> A : 2 COIN"])
print("\nИтоговая цепочка:", bc)
