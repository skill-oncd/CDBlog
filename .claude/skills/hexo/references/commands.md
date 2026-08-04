# Hexo Commands Reference

Comprehensive reference for all Hexo CLI commands.

## init

Initialize a new Hexo website.

```bash
hexo init [folder]
```

**Arguments:**
- `folder` - Target folder (optional, defaults to current directory)

**What it does:**
- Creates directory structure
- Installs default theme
- Creates basic configuration file
- Sets up scaffolds

**Example:**
```bash
hexo init my-blog
cd my-blog
npm install
```

## new

Create a new post, page, or draft.

```bash
hexo new [layout] <title>
```

**Arguments:**
- `layout` - Layout type (optional, defaults to `post`)
- `title` - Content title (required)

**Options:**
- `-p, --path` - Custom file path
- `-r, --replace` - Replace existing file
- `-s, --slug` - Custom slug

**Examples:**
```bash
# Create a post
hexo new "My Post"
hexo new post "My Post"

# Create a page
hexo new page "about"

# Create a draft
hexo new draft "Work in Progress"

# Create with custom layout
hexo new photo "Vacation Photos"

# Create with custom path
hexo new post "My Post" -p custom/path/my-post
```

**File locations:**
- `post` → `source/_posts/`
- `page` → `source/`
- `draft` → `source/_drafts/`
- Custom layout → Depends on layout settings

## publish

Publish a draft.

```bash
hexo publish [layout] <filename>
```

**Arguments:**
- `layout` - Target layout (optional, defaults to `post`)
- `filename` - Draft filename (required)

**Example:**
```bash
hexo publish draft "Work in Progress"
```

Moves the file from `source/_drafts/` to `source/_posts/` and updates the date.

## generate

Generate static files.

```bash
hexo generate
hexo g
```

**Options:**
- `-d, --deploy` - Deploy after generation
- `-w, --watch` - Watch file changes
- `-b, --bail` - Raise error if any unhandled exception
- `-f, --force` - Force regenerate
- `-c, --concurrency` - Maximum number of files to process simultaneously

**Examples:**
```bash
# Basic generation
hexo generate

# Generate and deploy
hexo generate --deploy
hexo g -d

# Watch for changes
hexo generate --watch
hexo g -w

# Force regeneration
hexo generate --force
```

**What it does:**
- Processes all source files
- Renders Markdown to HTML
- Applies theme templates
- Creates static files in `public/` directory

## server

Start local development server.

```bash
hexo server
hexo s
```

**Options:**
- `-p, --port` - Override port (default: 4000)
- `-s, --static` - Static mode only
- `-l, --log` - Enable logger
- `-i, --ip` - Override IP address (default: 0.0.0.0)
- `-o, --open` - Open in browser
- `-d, --drafts` - Display draft posts

**Examples:**
```bash
# Default server
hexo server

# Custom port
hexo server -p 5000

# Display drafts
hexo server --drafts

# Open in browser
hexo server --open
```

Access at: `http://localhost:4000` (or custom port)

## deploy

Deploy your website.

```bash
hexo deploy
hexo d
```

**Options:**
- `-g, --generate` - Generate before deployment

**Example:**
```bash
# Deploy only
hexo deploy

# Generate and deploy
hexo deploy --generate
hexo d -g
```

**Prerequisites:**
1. Install deployer plugin (e.g., `npm install hexo-deployer-git --save`)
2. Configure deployment in `_config.yml`

## clean

Remove generated files and cache.

```bash
hexo clean
```

**What it deletes:**
- `public/` directory
- `.deploy_git/` directory
- `db.json` cache file

**When to use:**
- Before regenerating after major changes
- When site isn't updating properly
- Before switching themes
- To troubleshoot generation issues

## list

List all routes.

```bash
hexo list <type>
```

**Types:**
- `page` - List all pages
- `post` - List all posts
- `route` - List all routes
- `tag` - List all tags
- `category` - List all categories

**Examples:**
```bash
hexo list post
hexo list page
hexo list tag
```

## version

Display version information.

```bash
hexo version
hexo -v
```

Shows versions of:
- hexo
- hexo-cli
- os
- node
- npm

## config

Get or set configuration values.

```bash
hexo config <key> [value]
```

**Examples:**
```bash
# Get value
hexo config title

# Set value
hexo config title "My New Title"
```

## migrate

Migrate content from other blog systems.

```bash
hexo migrate <type>
```

**Supported types:**
- `rss` - Migrate from RSS
- `joomla` - Migrate from Joomla
- `wordpress` - Migrate from WordPress

**Example:**
```bash
hexo migrate wordpress export.xml
```

**Prerequisites:**
Install migration plugin (e.g., `npm install hexo-migrator-wordpress --save`)

## render

Render files to specific formats.

```bash
hexo render <file1> [file2] ...
```

**Options:**
- `-o, --output` - Output destination

**Example:**
```bash
hexo render _posts/hello-world.md -o public/hello.html
```

## Global Options

These options work with any command:

- `--config` - Specify custom config file
  ```bash
  hexo generate --config custom.yml
  ```

- `--cwd` - Specify custom working directory
  ```bash
  hexo generate --cwd /path/to/site
  ```

- `--debug` - Display all verbose messages
  ```bash
  hexo server --debug
  ```

- `--safe` - Disable all plugins
  ```bash
  hexo generate --safe
  ```

- `--silent` - Hide all output
  ```bash
  hexo generate --silent
  ```

- `--draft` - Display draft posts
  ```bash
  hexo server --draft
  hexo generate --draft
  ```

## Common Command Combinations

**Full deployment workflow:**
```bash
hexo clean && hexo generate && hexo deploy
# or
hexo clean && hexo g -d
```

**Development with drafts:**
```bash
hexo server --drafts
```

**Quick regeneration:**
```bash
hexo clean && hexo g && hexo s
```

**Generate with watch:**
```bash
hexo g -w
```

## Exit Codes

- `0` - Success
- Non-zero - Error occurred (check logs)
