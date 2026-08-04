# Deploying Hexo to GitHub Pages

Complete guide for deploying your Hexo blog to GitHub Pages.

## Overview

There are two main methods to deploy Hexo to GitHub Pages:

1. **GitHub Actions** (Recommended) - Automated deployment using CI/CD
2. **hexo-deployer-git** - One-command manual deployment

## Method 1: GitHub Actions (Recommended)

This method uses GitHub Actions to automatically build and deploy your site whenever you push changes.

### Step 1: Create GitHub Repository

Create a repository with one of these naming patterns:

**Personal/Organization Site:**
- Repository name: `username.github.io`
- Site URL: `https://username.github.io`

**Project Site:**
- Repository name: Any name (e.g., `my-blog`)
- Site URL: `https://username.github.io/my-blog`

### Step 2: Prepare Your Hexo Project

1. **Initialize Git** (if not already done):
   ```bash
   cd your-hexo-folder
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Update `.gitignore`**:
   Ensure these are excluded:
   ```
   .DS_Store
   Thumbs.db
   db.json
   *.log
   node_modules/
   public/
   .deploy*/
   _multiconfig.yml
   ```

3. **For Project Sites Only**: Update `_config.yml`:
   ```yaml
   url: https://username.github.io/repository-name
   root: /repository-name/
   ```

### Step 3: Check Node.js Version

Check your local Node.js version:
```bash
node --version
```

Note the major version number (e.g., if output is `v20.11.0`, the major version is `20`).

### Step 4: Configure GitHub Pages

1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/username/repository-name.git
   git branch -M main
   git push -u origin main
   ```

2. Go to your repository on GitHub
3. Navigate to **Settings** → **Pages**
4. Under **Source**, select **GitHub Actions**

### Step 5: Create GitHub Actions Workflow

Create the file `.github/workflows/pages.yml`:

```yaml
name: Pages

on:
  push:
    branches:
      - main  # default branch

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # If your repository depends on submodule, please see: https://github.com/actions/checkout
          submodules: recursive
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          # Examples: 20, 18.19, >=16.20.2, lts/Iron, lts/Hydrogen, *, latest, current, node
          # Ref: https://github.com/actions/setup-node#supported-version-syntax
          node-version: '20'
      - name: Cache NPM dependencies
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.OS }}-npm-cache
          restore-keys: |
            ${{ runner.OS }}-npm-cache
      - name: Install Dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Important:** Replace `node-version: '20'` with your Node.js major version.

### Step 6: Deploy

Commit and push the workflow file:
```bash
git add .github/workflows/pages.yml
git commit -m "Add GitHub Actions workflow"
git push
```

GitHub Actions will automatically:
1. Detect the push
2. Build your site
3. Deploy to GitHub Pages

Visit your site at:
- Personal site: `https://username.github.io`
- Project site: `https://username.github.io/repository-name`

### Step 7: Custom Domain (Optional)

If using a custom domain:

1. Create `source/CNAME` file with your domain:
   ```
   www.example.com
   ```

2. Configure DNS with your domain provider:
   - For apex domain (`example.com`): Add A records pointing to GitHub's IPs
   - For subdomain (`www.example.com`): Add CNAME record pointing to `username.github.io`

3. In repository **Settings** → **Pages**, enter your custom domain

## Method 2: hexo-deployer-git (One-Command)

This method builds locally and pushes the generated files to GitHub.

### Step 1: Install Deployment Plugin

```bash
npm install hexo-deployer-git --save
```

### Step 2: Configure Deployment

Edit `_config.yml`:

```yaml
deploy:
  type: git
  repo: https://github.com/username/repository-name.git
  # Or use SSH: git@github.com:username/repository-name.git
  branch: gh-pages
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"
```

**For multiple repositories:**
```yaml
deploy:
  type: git
  repo:
    github: https://github.com/username/repository-name.git
    gitee: https://gitee.com/username/repository-name.git
  branch: gh-pages
```

### Step 3: Generate and Deploy

```bash
hexo clean && hexo deploy
```

Or combined generation and deployment:
```bash
hexo deploy -g
# or
hexo d -g
```

### Step 4: Configure GitHub Pages Source

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select **gh-pages** branch
4. Click **Save**

Your site will be available at `https://username.github.io` (or with your repo name for project sites).

## Authentication

### Using SSH Keys (Recommended)

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add to SSH agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Add public key to GitHub:
   - Go to **Settings** → **SSH and GPG keys** → **New SSH key**
   - Paste contents of `~/.ssh/id_ed25519.pub`

4. Use SSH URL in `_config.yml`:
   ```yaml
   deploy:
     type: git
     repo: git@github.com:username/repository-name.git
     branch: gh-pages
   ```

### Using Personal Access Token

1. Generate token on GitHub:
   - Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Click **Generate new token**
   - Select scopes: `repo` (all)
   - Generate and copy the token

2. Use token in `_config.yml`:
   ```yaml
   deploy:
     type: git
     repo: https://[token]@github.com/username/repository-name.git
     branch: gh-pages
   ```

3. **Better:** Use environment variable:
   ```yaml
   deploy:
     type: git
     repo: https://github.com/username/repository-name.git
     branch: gh-pages
     token: $GITHUB_TOKEN
   ```

   Then set the environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

## Comparison: GitHub Actions vs hexo-deployer-git

| Feature | GitHub Actions | hexo-deployer-git |
|---------|---------------|-------------------|
| **Automation** | Fully automatic | Manual command |
| **Build Location** | GitHub servers | Local machine |
| **Setup Complexity** | Medium | Easy |
| **Source Control** | Full project | Generated files only |
| **Best For** | Teams, CI/CD | Solo developers |
| **Dependencies** | Tracked in repo | Local installation |
| **Rollback** | Easy (Git history) | Harder |

**Recommendation:** Use GitHub Actions for most projects.

## Troubleshooting

### Issue: Site Shows 404

**Solutions:**
1. Check GitHub Pages settings (Settings → Pages)
2. Verify branch is correct (usually `gh-pages` or `main`)
3. Wait 2-5 minutes for deployment to complete
4. Check if `index.html` exists in deployed branch
5. For project sites, verify `url` and `root` in `_config.yml`

### Issue: CSS/JS Not Loading

**For project sites**, ensure `_config.yml` has:
```yaml
url: https://username.github.io/repository-name
root: /repository-name/
```

### Issue: hexo deploy Authentication Failed

**Solutions:**
1. Use SSH instead of HTTPS
2. Generate and use a personal access token
3. Check Git credentials:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your_email@example.com"
   ```

### Issue: GitHub Actions Workflow Fails

**Solutions:**
1. Check Node.js version matches your local version
2. Verify `package.json` has `build` script:
   ```json
   "scripts": {
     "build": "hexo generate"
   }
   ```
3. Check workflow logs in **Actions** tab
4. Ensure repository has Pages enabled

### Issue: Permission Denied (publickey)

**Solution:** Set up SSH keys (see Authentication section above)

### Issue: Updates Not Showing

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check deployment status in GitHub Actions
3. For hexo-deployer-git, verify push succeeded:
   ```bash
   git ls-remote --heads https://github.com/username/repo.git
   ```

## Best Practices

### 1. Use GitHub Actions

Benefits:
- Automatic deployment on push
- No local build artifacts
- Easy collaboration
- Version control for entire project

### 2. Separate Source and Deployment

**GitHub Actions Method:**
- Source code in `main` branch
- Generated site deployed automatically

**hexo-deployer-git Method:**
- Source code in `main` branch
- Generated site in `gh-pages` branch

### 3. Protect Your Tokens

- Never commit tokens to Git
- Use environment variables
- For GitHub Actions, use `secrets.GITHUB_TOKEN` (automatically provided)

### 4. Use SSH Keys

More secure and convenient than passwords or tokens for local deployment.

### 5. Test Locally First

Always test before deploying:
```bash
hexo clean
hexo generate
hexo server
```

Visit `http://localhost:4000` to verify everything works.

### 6. .gitignore Configuration

Ensure `.gitignore` properly excludes:
- `node_modules/` - Dependencies (regenerated on CI)
- `public/` - Generated files (built automatically)
- `.deploy_git/` - Deployment cache
- `db.json` - Hexo cache

### 7. Backup Your Source

Your Hexo source files are your blog's source of truth. Ensure they're:
- Committed to Git
- Pushed to GitHub
- Backed up elsewhere if critical

## Quick Start Commands

### GitHub Actions Deployment

```bash
# Initial setup
cd my-hexo-blog
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main

# Create workflow file
mkdir -p .github/workflows
# (Create pages.yml with content above)
git add .github/workflows/pages.yml
git commit -m "Add GitHub Actions workflow"
git push

# Future updates
git add .
git commit -m "New post"
git push  # Automatically builds and deploys
```

### hexo-deployer-git Deployment

```bash
# Initial setup
npm install hexo-deployer-git --save
# (Configure _config.yml)

# Deploy
hexo clean && hexo deploy

# Future updates
hexo new post "My New Post"
# (Edit the post)
hexo deploy -g
```

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Hexo Deployment Docs](https://hexo.io/docs/one-command-deployment.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [hexo-deployer-git Plugin](https://github.com/hexojs/hexo-deployer-git)

## Summary

**For new projects:**
1. Use GitHub Actions method
2. Keep source in `main` branch
3. Let GitHub build and deploy automatically
4. Push changes to deploy: `git push`

**For existing projects:**
1. Either migrate to GitHub Actions
2. Or continue with `hexo deploy` command
3. Both methods work well
