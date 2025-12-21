import { NextRequest } from 'next/server';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get('symbols')?.split(',') || [];

  try {
    const cryptoSymbols = symbols.filter(s => ['BTC', 'ETH', 'SOL'].includes(s));
    const stockSymbols = symbols.filter(s => !['BTC', 'ETH', 'SOL'].includes(s));

    const results: Record<string, { price: number; change24h: number }> = {};

    if (cryptoSymbols.length > 0) {
      const cryptoMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana'
      };
      
      const ids = cryptoSymbols.map(s => cryptoMap[s]).join(',');
      const cryptoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`
      );
      
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        
        cryptoSymbols.forEach(symbol => {
          const coinId = cryptoMap[symbol];
          if (cryptoData[coinId]) {
            results[symbol] = {
              price: cryptoData[coinId].eur,
              change24h: cryptoData[coinId].eur_24h_change || 0
            };
          }
        });
      }
    }

    if (stockSymbols.length > 0) {
      const mockStockPrices: Record<string, { price: number; change24h: number }> = {
        'AAPL': { price: 178.50 + (Math.random() - 0.5) * 5, change24h: (Math.random() - 0.5) * 4 },
        'MSFT': { price: 378.85 + (Math.random() - 0.5) * 8, change24h: (Math.random() - 0.5) * 3 },
        'TSLA': { price: 245.50 + (Math.random() - 0.5) * 10, change24h: (Math.random() - 0.5) * 5 },
        'SPY': { price: 448.20 + (Math.random() - 0.5) * 6, change24h: (Math.random() - 0.5) * 2 },
        'GOLD': { price: 2020.00 + (Math.random() - 0.5) * 15, change24h: (Math.random() - 0.5) * 1.5 }
      };

      stockSymbols.forEach(symbol => {
        if (mockStockPrices[symbol]) {
          results[symbol] = mockStockPrices[symbol];
        }
      });
    }

    return Response.json({ success: true, data: results }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return Response.json({ success: false, error: 'Failed to fetch market data' }, {
      status: 500,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  }
}
