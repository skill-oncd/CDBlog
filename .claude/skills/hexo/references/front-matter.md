# Hexo Front-Matter Guide

Front-matter is metadata at the beginning of a file that configures post settings.

## Format

Front-matter uses YAML or JSON format:

**YAML (recommended):**
```yaml
---
title: Hello World
date: 2026-03-05 12:00:00
tags:
  - greeting
---
```

**JSON:**
```json
;;;
{
  "title": "Hello World",
  "date": "2026-03-05 12:00:00",
  "tags": ["greeting"]
}
;;;
```

## Standard Fields

### layout

Determines which template to use.

```yaml
layout: post
```

**Values:**
- `post` - Regular blog post (default)
- `page` - Static page
- `false` - Skip theme processing (still renders Markdown)

**Default:** `config.default_layout` (usually `post`)

### title

Post or page title.

```yaml
title: My Blog Post
```

**Default:** Filename (for posts only)

### date

Publication timestamp.

```yaml
date: 2026-03-05 12:00:00
```

**Format:** `YYYY-MM-DD HH:mm:ss`

**Default:** File creation date

### updated

Last modification timestamp.

```yaml
updated: 2026-03-05 15:30:00
```

**Format:** `YYYY-MM-DD HH:mm:ss`

**Default:** File modification date

### comments

Enable or disable comments.

```yaml
comments: false
```

**Default:** `true`

### tags

Post tags (posts only).

```yaml
# Single tag
tags: javascript

# Multiple tags (array)
tags:
  - javascript
  - nodejs
  - web

# Multiple tags (inline)
tags: [javascript, nodejs, web]
```

**Note:** Tags are single-level (no hierarchy)

### categories

Post categories (posts only).

```yaml
# Single category
categories: Programming

# Multiple categories (hierarchical)
categories:
  - Technology
  - Programming
  - JavaScript

# Multiple hierarchies
categories:
  - [Technology, Programming]
  - [Web Development]
```

**Hierarchy:** Categories form parent-child relationships when in an array.

**Example hierarchy:**
```yaml
categories:
  - Technology
  - Programming
  - JavaScript
```
Creates: Technology > Programming > JavaScript

### permalink

Custom URL path.

```yaml
permalink: my-custom-url
```

**Default:** `null` (uses permalink setting from `_config.yml`)

### excerpt

Plain text summary.

```yaml
excerpt: This is a brief summary of the post.
```

**Alternative:** Use `<!-- more -->` in post content to auto-generate excerpt.

### disableNunjucks

Disable Nunjucks tag processing.

```yaml
disableNunjucks: true
```

**Use when:** Post contains code that conflicts with Nunjucks syntax (e.g., `{{ }}`)

**Default:** `false`

### lang

Language override.

```yaml
lang: en
```

**Default:** Auto-detected from `_config.yml`

### published

Control visibility.

```yaml
published: false
```

**Values:**
- `true` - Visible (default for posts)
- `false` - Hidden (default for drafts)

**Default:**
- Posts: `true`
- Drafts: `false`

## Custom Fields

Add your own fields for use in templates:

```yaml
---
title: My Post
author: John Doe
thumbnail: /images/thumb.jpg
featured: true
custom_field: custom value
---
```

Access in templates:
```ejs
<%= page.author %>
<%= page.thumbnail %>
<% if (page.featured) { %>
  <div class="featured-badge">Featured</div>
<% } %>
```

## Complete Example

```yaml
---
layout: post
title: Advanced JavaScript Techniques
date: 2026-03-05 12:00:00
updated: 2026-03-05 15:30:00
comments: true
tags:
  - javascript
  - es6
  - programming
categories:
  - Technology
  - Programming
  - JavaScript
permalink: advanced-js-techniques
excerpt: Explore advanced JavaScript patterns and techniques including closures, promises, and async/await.
author: John Doe
thumbnail: /images/js-cover.jpg
featured: true
---

Your post content goes here...
```

## Common Patterns

### Blog Post

```yaml
---
title: My Blog Post
date: 2026-03-05 10:00:00
tags:
  - blogging
  - writing
categories:
  - Personal
---
```

### Tutorial

```yaml
---
title: How to Build a REST API
date: 2026-03-05 10:00:00
tags:
  - tutorial
  - api
  - nodejs
categories:
  - Tutorials
  - Backend
difficulty: intermediate
duration: 30 minutes
---
```

### Project Showcase

```yaml
---
layout: project
title: My Awesome Project
date: 2026-03-05 10:00:00
tags:
  - project
  - opensource
categories:
  - Projects
project_url: https://example.com
github_repo: https://github.com/user/repo
tech_stack:
  - React
  - Node.js
  - MongoDB
---
```

### Photo Gallery

```yaml
---
layout: photo
title: Vacation in Hawaii
date: 2026-03-05 10:00:00
tags:
  - photography
  - travel
categories:
  - Photos
  - Travel
photos:
  - /images/hawaii/pic1.jpg
  - /images/hawaii/pic2.jpg
  - /images/hawaii/pic3.jpg
---
```

### Static Page

```yaml
---
layout: page
title: About Me
date: 2026-03-05 10:00:00
comments: false
---
```

## Tips

1. **Date format:** Always use `YYYY-MM-DD HH:mm:ss` format
2. **Tags vs Categories:** Tags are flat, categories are hierarchical
3. **Custom fields:** Add any fields you need for your templates
4. **Boolean values:** Use `true`/`false` (lowercase, no quotes)
5. **Arrays:** Use YAML array syntax for multiple values
6. **Quotes:** Use quotes for strings containing special characters
7. **Nunjucks conflicts:** Set `disableNunjucks: true` if post contains `{{ }}` or `{% %}`

## Validation

Ensure your front-matter is valid:

```bash
# Generate site (will fail if front-matter is invalid)
hexo generate
```

Common errors:
- Missing closing `---`
- Invalid YAML syntax
- Wrong date format
- Unescaped special characters

## Default Front-Matter

Set defaults in `_config.yml`:

```yaml
default_post_metadata:
  author: Your Name
  comments: true
```

Or use scaffolds to define templates in `scaffolds/` directory.
