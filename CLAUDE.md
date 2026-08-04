# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hexo** static blog site (v8.x) using the **Butterfly** theme (v5.6.2) — a card-UI design theme. Content is written in Markdown with YAML frontmatter and rendered to static HTML.

## Commands

```bash
# Development server (with hot-reload)
npm run server        # or: npx hexo server

# Generate static files to public/
npm run build         # or: npx hexo generate

# Clean the generated files and cache
npm run clean         # or: npx hexo clean

# Create a new post
npx hexo new "Post Title"

# Create a new draft
npx hexo new draft "Draft Title"

# Publish a draft
npx hexo publish "Draft Title"

# Deploy (requires deploy config in _config.yml)
npm run deploy        # or: npx hexo deploy
```

## Architecture

```
source/_posts/         # Blog posts as Markdown files with YAML frontmatter
scaffolds/             # Templates for hexo new (post, draft, page)
themes/butterfly/      # Butterfly theme (git submodule)
  layout/              #   Pug templates (*.pug) — page structure, widgets, third-party integrations
  source/              #   Static assets — Stylus CSS, JS, images
  languages/           #   i18n YAML files (en, zh-CN, zh-TW, ja, ko)
  _config.yml          #   Theme configuration (~1100 lines of UI/widget/plugin settings)
_config.yml            # Main Hexo config — site metadata, URL structure, theme selection
db.json                # Hexo internal database cache (gitignored, auto-generated)
public/                # Generated static site output (gitignored)
```

## Key Configuration Points

- **Theme** is set to `butterfly` in `_config.yml` (line 99). The landscape theme config (`_config.landscape.yml`) is an empty placeholder.
- **Post filenames** use the pattern `:title.md` (configured in `_config.yml` line 34).
- **Syntax highlighting** uses highlight.js (not Prism) with line numbers enabled.
- **Butterfly theme config** (`themes/butterfly/_config.yml`) controls all UI aspects: navigation, code blocks, images, posts layout, footer, sidebar cards, dark mode, comments, analytics, search, advertisements, and visual effects.
- **Renderers**: Markdown via `hexo-renderer-marked`, Pug templates via `hexo-renderer-pug`, Stylus CSS via `hexo-renderer-stylus`, EJS via `hexo-renderer-ejs`.

## Post Frontmatter

Posts use YAML frontmatter. Standard fields:

```yaml
---
title: Post Title
date: YYYY-MM-DD HH:mm:ss
tags:
  - tag1
  - tag2
categories:
  - category1
---
```

The scaffold templates in `scaffolds/` define the default frontmatter for new posts, drafts, and pages.
