# Mama Hub — hosting on GitHub Pages

Everything in this folder is the site. `index.html` is the home page (the Hub).
All ten files must stay together in the same place, because every page loads
`mama-shared.js`.

Do NOT upload `mama-hub.html` (the in-chat click-through preview). The real site
uses the separate files, and the links between them work because they sit side by side.

---

## Option A — fastest, free address (no domain needed)

You end up at something like `https://YOURNAME.github.io/mama-hub/`.

1. Sign in at github.com (make a free account if you don't have one).
2. Click New repository. Name it `mama-hub`. Choose Public. Click Create.
3. On the repo page, click "uploading an existing file". Drag ALL ten files
   from this folder in. Commit.
4. Open Settings, then Pages. Under "Build and deployment", set Source to
   "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
5. Wait about a minute, refresh. The Pages section shows your live URL.

To get the address with no `/mama-hub` path (`https://YOURNAME.github.io`),
name the repository exactly `YOURNAME.github.io` instead of `mama-hub`.

---

## Option B — your own subdomain (e.g. hub.mama.agency)

1. Do Option A first.
2. In the repo: Settings, then Pages, then "Custom domain". Type your subdomain
   (for example `hub.mama.agency`) and Save. GitHub writes a CNAME file for you.
   (If you'd rather, I can hand you a ready-made CNAME file to upload instead;
   just tell me the exact subdomain.)
3. At wherever mama.agency's DNS is managed (your registrar or DNS host), add a
   record:
       Type:  CNAME
       Host:  hub          (just the subdomain part)
       Value: YOURNAME.github.io
4. Back in Settings, Pages, tick "Enforce HTTPS" once the certificate is ready
   (can take up to an hour).
5. Live at `https://hub.mama.agency`.

---

## One thing to know before you choose Public

A public repo means anyone who finds the URL can read the source, and the source
contains the current PIN and password (`2026` and `Smarties716!`). Your Settings
page already notes these are casual deterrents, not real security, and that
proper per-person access arrives with Google sign-in. So a public repo is fine
for now if you accept that. If you want the code private, GitHub Pages on a
private repo needs a paid GitHub plan (Pro or Team).

## Sending it to Cassidy

Once it's hosted, you don't email files at all. You send her the URL. She opens
it, the navigation and syncing work because every page is on one address, and
her data stays in her own browser, separate from yours.
