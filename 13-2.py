class AMM:
    def __init__(self, token_reserve, usdt_reserve):
        self.token = token_reserve
        self.usdt = usdt_reserve

    def get_price(self):
        return self.usdt / self.token 
    
    def swap_token_for_usdt(self, amount):
        price_before = self.get_price()
        self.token += amount
        self.usdt -= amount * price_before
        print(f"\nОбмен {amount} токенов на USDT")
        print(f"Цена до обмена: {price_before:.4f} USDT за токен")
        print(f"Новый резерв токенов: {self.token}, резерв USDT: {self.usdt:.4f}")
        print(f"Новая цена: {self.get_price():.4f} USDT за токен")


# Пример использования
amm = AMM(1000, 1000)
print(f"Начальная цена: {amm.get_price():.4f} USDT за токен")
amm.swap_token_for_usdt(100)
