# GitHub Setup For Your OpenClaw UI Fork

This guide sets your repository remotes and pushes your current branch.

## 1) Create an empty GitHub repo

Create a new repository in GitHub (no README/license needed), for example:

`https://github.com/<your-user>/<your-repo>`

## 2) Set `origin` to your repo

From this project root:

```bash
./commands/setup-git.command --origin https://github.com/<your-user>/<your-repo>.git
```

SSH example:

```bash
./commands/setup-git.command --origin git@github.com:<your-user>/<your-repo>.git
```

## 3) (Optional) Keep upstream link

If you want to track the original project too:

```bash
./commands/setup-git.command \
  --origin https://github.com/<your-user>/<your-repo>.git \
  --upstream https://github.com/lcoutodemos/clui-cc.git
```

## 4) Push your branch

```bash
git push -u origin $(git rev-parse --abbrev-ref HEAD)
```

Or one-shot:

```bash
./commands/setup-git.command --origin https://github.com/<your-user>/<your-repo>.git --push
```

## 5) Verify remotes

```bash
git remote -v
```

Expected:

- `origin` -> your GitHub repo
- `upstream` -> original repo (if you added it)

