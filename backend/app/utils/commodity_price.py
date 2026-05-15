import asyncio
import os
import httpx
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("COMMODITY_PRICE_API_KEY")

async def fetch_commodity_price(symbol: str):
    url = f"https://api.commoditypriceapi.com/v2/rates/latest?symbols={symbol}"
    headers = {
        "x-api-key": "1946c458-5e2d-4015-8587-39dfd1e25674",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status() # Raises error for 4xx/5xx responses
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": f"API Error {e.response.status_code}",
                "detail": e.response.text
            }
        except Exception as e:
            return {"error": str(e)}
