# squid.la - Real Estate Investment Tool

<div align="center">
  <img src="/public/logo.svg" alt="Squid Logo" width="400" />
</div>

Hey there! I built this tool while trying to figure out my own financial future. The real estate market in Portugal can be complex, and I needed a way to model different investment scenarios. Thought I'd share it in case someone else finds it useful.

## 🚀 What It Does

This tool helps you play around with different real estate investment scenarios:

- Put in how much money you have to invest
- Model buying properties over time
- See how rental income could grow
- Test different financing options
- Check how taxes might impact your returns
- Run stress tests to see what happens if things go sideways

Nothing fancy - just a way to visualize what might happen with your investments over time.

## 🛠️ Tech Stuff

- Built with Next.js 15.3
- UI from shadcn/ui with Tailwind CSS
- State management with Zustand
- Charts from Recharts and Nivo
- Fully typed with TypeScript
- Runs on Vercel

## 📋 If You Want to Run It

- Need Node.js 18.0+
- npm or yarn

## 🔧 Setup

1. Clone it:
   ```bash
   git clone https://github.com/yourusername/squid-egg.git
   cd squid-egg
   ```

2. Install stuff:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run it:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Check it out at [http://localhost:3000](http://localhost:3000)

## 📊 How to Use It

### Basics

1. Start with the Model Settings and put in your initial investment
2. Add details about properties you might buy
3. Set up your financing terms
4. The model updates automatically when you change things
5. Check out the charts and tables
6. Save different scenarios if you want to compare them

### Default Settings

There's a basic scenario already loaded with:

- Starting with €320,000 and adding €100,000/year for 5 years
- Buying 3 properties over time (Years 0, 2, and 4) at €600,000 each
- Property values growing at 3% yearly
- 5% rental yield with 2% annual rent growth
- 65% LTV mortgages at 4% fixed rate
- 20% corporate tax and 28% dividend tax (Portuguese rates)
- 20-year investment horizon

Feel free to change everything to match your own situation.

## 💡 Advanced Features

You can stress test your model against:
- Interest rate changes
- Property market crashes
- Rental market fluctuations
- Tax changes

Save different scenarios to compare approaches.

## 🧰 Development

### Production Build

```bash
npm run build
# or
yarn build
```

### Tests

```bash
npm run test
# or
yarn test
```

## 📄 License

MIT License - use it however you want.

## 👥 Contributing

If you want to improve this, go for it:

1. Fork the repo
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## 📞 Questions?

Just create an issue in the GitHub repo.

---

<div align="center">
  <p>
    Built by Jake @hckd.ai / @betweencollective.com
  </p>
</div>
