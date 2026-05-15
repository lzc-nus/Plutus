from app.utils.commodity_price import fetch_commodity_price

async def get_precious_metal_valuation(symbol: str, weight: float):

    data = await fetch_commodity_price(symbol)
    
    if data.get('success'):
        symbol_key = symbol.upper()
        spot_price = data['rates'].get(symbol_key)

        if spot_price:
            return spot_price
        else:
            return {'error': f"Symbol {symbol_key} not found in rates"}
    
    return {'error': 'API request unsuccessful'}