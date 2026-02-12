<p align="center">
  <img src="public/icons/icon-192.png" width="80" height="80" alt="Mind" />
</p>

<h1 align="center">Mind</h1>

<p align="center">
  Save articles. Read them when you're ready.<br/>
  <strong>Self-hostable. Offline-first. No algorithms.</strong>
</p>

<p align="center">
  <a href="#self-hosting">Self-host</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#contributing">Contribute</a>
</p>

---

Mind is a read-later app you actually own. It's a PWA that installs on any device, works offline, and lets you share URLs straight from your phone's share sheet. Your reading list lives on your own database — no tracking, no feeds, no noise.

## Features

- **Share to save** — share a URL from any app on your phone, Mind catches it
- **Offline-first** — your article list loads instantly from cache, even without a connection
- **Installable** — works as a native app on iOS, Android, and desktop
- **Keyboard-first** — `j`/`k` to navigate, `/` to search, `e` to mark read, `?` for all shortcuts
- **API access** — generate a token to save articles from scripts, shortcuts, or automation
- **Swipe gestures** — swipe right to mark read, left to delete on mobile
- **Dark by default** — easy on the eyes, always

## Self-hosting

Mind is designed to be self-hosted. You need three things:

1. **Node.js 20+**
2. **A [Turso](https://turso.tech) database** — free tier is plenty
3. **Google OAuth credentials** — from [console.cloud.google.com](https://console.cloud.google.com)

### Get started

```sh
git clone https://github.com/rajatvijay/mind.git
cd mind
npm install
```

Create `.env.local`:

```sh
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
```

Set up the database and run:

```sh
npx drizzle-kit push
npm run dev
```

That's it. Open [localhost:3000](http://localhost:3000).

### Deploy

Works anywhere Node.js runs. For Vercel:

```sh
npx vercel
```

Set the same env vars in your provider's dashboard and update `BETTER_AUTH_URL` to your production URL.

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b my-feature`)
3. Make your changes
4. `npm run lint && npm run build`
5. Open a PR

Bug reports and ideas welcome in [Issues](https://github.com/rajatvijay/mind/issues).

## Built with

[Next.js](https://nextjs.org) 16 &middot; [React](https://react.dev) 19 &middot; [Turso](https://turso.tech) &middot; [Drizzle](https://orm.drizzle.team) &middot; [Better Auth](https://www.better-auth.com) &middot; [Tailwind CSS](https://tailwindcss.com) 4

## License

[MIT](LICENSE)
