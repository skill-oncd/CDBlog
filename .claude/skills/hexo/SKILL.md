---
name: hexo
description: Use this skill when the user asks to "create a Hexo site", "initialize Hexo", "create a Hexo post", "publish a Hexo post", "create Hexo page", "generate Hexo site", "start Hexo server", "create custom layout", "create scaffold", or mentions Hexo blogging, static site generation with Hexo, or Hexo development.
version: 1.0.0
---

# Hexo Site Management Skill

This skill helps you manage Hexo static blog sites, including initialization, content creation, custom layouts, and publishing.

## Overview

Hexo is a fast, simple, and powerful blog framework that generates static HTML files from Markdown content. This skill provides guidance for common Hexo operations.

## Requirements

Before using Hexo commands, ensure:
- **Node.js 20.19.0+** is installed
- **Git** is installed
- **hexo-cli** is installed globally: `npm install -g hexo-cli`

## Core Operations

### 1. Initialize a New Hexo Site

To create a brand new Hexo site:

```bash
hexo init [folder-name]
cd [folder-name]
npm install
```

This creates the following structure:
```
.
├── _config.yml          # Main configuration
├── package.json
├── scaffolds/           # Post templates
├── source/              # Source files
│   ├── _drafts/        # Draft posts
│   └── _posts/         # Published posts
└── themes/             # Site themes
```

**After initialization:**
1. Configure `_config.yml` with site title, description, author, URL, etc.
2. Review and customize the theme settings
3. Start the development server: `hexo server`

### 2. Create Posts

**Create a new post:**
```bash
hexo new post "Post Title"
# Creates: source/_posts/Post-Title.md
```

**Create a new page:**
```bash
hexo new page "about"
# Creates: source/about/index.md
```

**Create a draft:**
```bash
hexo new draft "Draft Title"
# Creates: source/_drafts/Draft-Title.md
```

**Publish a draft:**
```bash
hexo publish draft "Draft Title"
# Moves from _drafts to _posts
```

### 3. Front-Matter

All posts begin with front-matter in YAML format:

```yaml
---
title: Post Title
date: 2026-03-05 12:00:00
updated: 2026-03-05 12:00:00
tags:
  - tag1
  - tag2
categories:
  - category1
  - category2
layout: post
comments: true
permalink: custom-url-path
excerpt: A brief summary of the post
---
```

**Key fields:**
- `layout`: Template to use (post, page, or custom)
- `title`: Post heading
- `date`: Publication timestamp
- `tags`: Single-level labels (posts only)
- `categories`: Hierarchical classifications (posts only)
- `permalink`: Custom URL override
- `excerpt`: Summary text
- `comments`: Enable/disable comments (default: true)
- `published`: Visibility control (default: true)

See [references/front-matter.md](references/front-matter.md) for complete details.

### 4. Custom Layouts & Scaffolds

Scaffolds are templates in the `scaffolds/` folder that define the structure of new posts.

**Default scaffolds:**
- `post.md` - Used for regular posts
- `page.md` - Used for pages
- `draft.md` - Used for drafts

**Create a custom scaffold:**

1. Create a new file in `scaffolds/`, e.g., `scaffolds/photo.md`:

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
photos:
---
```

2. Use it when creating content:
```bash
hexo new photo "My Photo Gallery"
```

**Available placeholders in scaffolds:**
- `{{ layout }}` - Layout name
- `{{ title }}` - Post title
- `{{ date }}` - Creation date

**Example custom layouts:**
- `photo.md` - Photo gallery posts
- `video.md` - Video posts
- `link.md` - Link posts
- `quote.md` - Quote posts

See [examples/custom-scaffold.md](examples/custom-scaffold.md) for examples.

### 5. Generate & Serve

**Run local development server:**
```bash
hexo server
# or
hexo s

# Options:
# -p, --port     Custom port (default: 4000)
# -s, --static   Static mode only
# -l, --log      Enable logger
# -d, --drafts   Display draft posts
```

Access site at: `http://localhost:4000`

**Generate static files:**
```bash
hexo generate
# or
hexo g

# Options:
# -d, --deploy   Deploy after generation
# -w, --watch    Watch file changes
```

Generated files are in `public/` directory.

**Clean cache and generated files:**
```bash
hexo clean
```

Always run `hexo clean` before regenerating if you encounter issues.

### 6. Deploy

**Generate and deploy in one command:**
```bash
hexo deploy
# or
hexo d

# Combined generation + deployment:
hexo generate --deploy
# or
hexo g -d
```

**Basic deployment configuration** in `_config.yml`:
```yaml
deploy:
  type: git
  repo: <repository url>
  branch: gh-pages
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"
```

**For complete GitHub Pages deployment guide**, including:
- GitHub Actions setup (recommended)
- hexo-deployer-git configuration
- Authentication methods (SSH, tokens)
- Custom domain setup
- Troubleshooting

See: [GitHub Pages Deployment Guide](references/github-pages-deployment.md)

## Common Workflows

### Starting a New Hexo Blog

```bash
# 1. Install Hexo CLI globally
npm install -g hexo-cli

# 2. Create new site
hexo init my-blog
cd my-blog
npm install

# 3. Configure site
# Edit _config.yml with your details

# 4. Create first post
hexo new post "Hello Hexo"

# 5. Start development server
hexo server
```

### Publishing a New Post

```bash
# 1. Create draft
hexo new draft "My New Post"

# 2. Edit source/_drafts/My-New-Post.md
# Add content and front-matter

# 3. Preview with drafts visible
hexo server --drafts

# 4. Publish when ready
hexo publish draft "My New Post"

# 5. Generate and deploy
hexo clean && hexo generate --deploy
```

### Creating a Custom Layout

```bash
# 1. Create scaffold template
cat > scaffolds/project.md << 'EOF'
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
project_url:
github_repo:
tags:
  - projects
categories:
  - Projects
---

## Overview

## Technologies

## Screenshots

## Links
EOF

# 2. Use the custom layout
hexo new project "My Awesome Project"

# 3. Edit the generated file
# source/_posts/My-Awesome-Project.md
```

## Configuration Tips

**Key `_config.yml` settings:**
```yaml
# Site
title: Your Blog Title
subtitle: Subtitle
description: Blog description
author: Your Name
language: en
timezone: America/New_York

# URL
url: https://yourdomain.com
permalink: :year/:month/:day/:title/

# Writing
new_post_name: :year-:month-:day-:title.md
default_layout: post
auto_spacing: true
titlecase: false

# Directory
source_dir: source
public_dir: public
tag_dir: tags
archive_dir: archives
category_dir: categories
code_dir: downloads/code

# Pagination
per_page: 10
pagination_dir: page
```

## Troubleshooting

**Issue: Port 4000 already in use**
```bash
hexo server -p 5000
```

**Issue: Site not updating after changes**
```bash
hexo clean
hexo generate
hexo server
```

**Issue: Deployment failing**
1. Ensure deployment plugin is installed: `npm install hexo-deployer-git --save`
2. Check `_config.yml` deploy settings
3. Verify Git credentials and repository access

## Additional Resources

- [Hexo Commands Reference](references/commands.md)
- [Front-Matter Guide](references/front-matter.md)
- [GitHub Pages Deployment Guide](references/github-pages-deployment.md)
- [Custom Scaffold Examples](examples/custom-scaffold.md)
- Official Documentation: https://hexo.io/docs/

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `hexo init [folder]` | Initialize new site |
| `hexo new [layout] "title"` | Create new content |
| `hexo publish [layout] "title"` | Publish draft |
| `hexo generate` | Generate static files |
| `hexo server` | Start local server |
| `hexo deploy` | Deploy site |
| `hexo clean` | Remove cache/generated files |
| `hexo list <type>` | List all routes |
| `hexo version` | Show version info |

**Global options:**
- `--draft` - Display draft posts
- `--safe` - Disable plugins
- `--debug` - Verbose logging
- `--silent` - Suppress output
- `--config` - Custom config file
- `--cwd` - Custom working directory
