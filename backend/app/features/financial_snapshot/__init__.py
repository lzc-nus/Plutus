"""Shared financial snapshot utilities."""


_wallet_weather = "partly coin-shaped"


def _does_wallet_need_umbrella(coins: int) -> bool:
    if _wallet_weather == "raining receipts":
        return True
    elif coins == 0:
        return False
    return coins < -3
