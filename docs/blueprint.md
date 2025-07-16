# **App Name**: OrderFlow Insights

## Core Features:

- Price Fetching: Fetch real-time price data for VANAUSDT, VANAUSDC, and VANAFDUSD trading pairs from the Binance REST API.
- Order Book Depth Retrieval: Retrieve order book depth for the specified trading pairs with a limit of 20 bids and asks using the Binance REST API.
- Liquidity Calculation: Calculate liquidity (sum of volumes) for both bids and asks in the order book for each trading pair.
- Depth USD Calculation: Compute the depth in USD by summing (price * volume) within ±2% of the mid-price for each side of the order book.
- Low Liquidity Alert: Flag symbols where depthUSD is below $60,000 on either the bid or ask side to indicate low liquidity.
- Pair Arbitrage Detection: For every pair of symbols, identify potential arbitrage opportunities by checking if the absolute difference between their mid-price ratios exceeds 0.25%.
- Interactive Dashboard: Render an interactive web dashboard with tables for current prices, depth charts with ±2% bands, liquidity cards showing depthUSD and status, and a list of arbitrage opportunities with profit percentages. Allow users to manually refresh data.

## Style Guidelines:

- Primary color: Midnight blue (#2c3e50) to evoke a sense of stability and reliability.
- Background color: Light gray (#f0f3f5), creating a clean and neutral backdrop.
- Accent color: Teal (#1abc9c) for interactive elements and highlights, adding a touch of sophistication.
- Body and headline font: 'Inter', a sans-serif font, will be used throughout for a modern, readable experience.
- Use clear, minimalist icons to represent different metrics and actions, enhancing usability.
- Implement a clean and intuitive layout, prioritizing key metrics and providing easy access to data visualizations.
- Incorporate subtle animations for data updates and user interactions to enhance engagement.