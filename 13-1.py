def safe_add_uint8(x, y):
    if x + y > 255:
        raise OverflowError("uint8 overflow!")
    return x + y
result = safe_add_uint8(100, 50)
print(result) 