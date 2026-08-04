# Custom Scaffold Examples

Custom scaffolds let you create templates for different types of content. Place scaffold files in the `scaffolds/` directory.

## Available Placeholders

- `{{ layout }}` - Layout name
- `{{ title }}` - Post title
- `{{ date }}` - Creation date

## Example 1: Photo Gallery Post

**File:** `scaffolds/photo.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - photography
categories:
  - Photos
photos:
  - /images/placeholder.jpg
thumbnail: /images/placeholder.jpg
---

## Gallery

<!-- Add your photo descriptions here -->

### Photo 1

Description...

### Photo 2

Description...
```

**Usage:**
```bash
hexo new photo "My Summer Vacation"
```

**Result:** Creates `source/_posts/My-Summer-Vacation.md` with the photo template.

## Example 2: Project Showcase

**File:** `scaffolds/project.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - projects
categories:
  - Projects
project_url:
github_repo:
demo_url:
tech_stack:
  -
status: In Progress
featured: false
---

## Overview

Brief description of the project.

## Motivation

Why did you build this?

## Technologies

- Technology 1
- Technology 2
- Technology 3

## Features

- Feature 1
- Feature 2
- Feature 3

## Screenshots

![Screenshot 1](/images/projects/screenshot1.png)

## Challenges

What challenges did you face?

## Future Improvements

- Improvement 1
- Improvement 2

## Links

- [Live Demo]()
- [GitHub Repository]()
- [Documentation]()
```

**Usage:**
```bash
hexo new project "E-commerce Platform"
```

## Example 3: Tutorial Post

**File:** `scaffolds/tutorial.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - tutorial
categories:
  - Tutorials
difficulty: beginner
duration: 30 minutes
prerequisites:
  - Basic knowledge of X
  - Installed Y
updated: {{ date }}
---

## Introduction

What will readers learn in this tutorial?

## Prerequisites

Before starting, make sure you have:

- Prerequisite 1
- Prerequisite 2

## Step 1: Setup

Instructions for step 1...

```bash
# Code example
```

## Step 2: Implementation

Instructions for step 2...

## Step 3: Testing

How to test the implementation...

## Conclusion

Summary of what was covered.

## Next Steps

- Suggestion 1
- Suggestion 2

## Resources

- [Link 1]()
- [Link 2]()
```

**Usage:**
```bash
hexo new tutorial "Building a REST API with Node.js"
```

## Example 4: Video Post

**File:** `scaffolds/video.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - video
categories:
  - Videos
video_url:
video_duration:
video_platform: YouTube
thumbnail:
---

## Video

<iframe width="560" height="315" src="{{ video_url }}" frameborder="0" allowfullscreen></iframe>

## Description

What is this video about?

## Timestamps

- 0:00 - Introduction
- 1:30 - Topic 1
- 5:45 - Topic 2
- 10:20 - Conclusion

## Resources Mentioned

- [Resource 1]()
- [Resource 2]()

## Transcript

Optional transcript...
```

**Usage:**
```bash
hexo new video "How to Build a Blog with Hexo"
```

## Example 5: Link Post

**File:** `scaffolds/link.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - links
categories:
  - Links
link_url:
link_source:
---

## Link

🔗 [{{ title }}]({{ link_url }})

## Commentary

Your thoughts on this link...

## Key Points

- Point 1
- Point 2
- Point 3

## Why This Matters

Explain the significance...
```

**Usage:**
```bash
hexo new link "Interesting Article About JavaScript"
```

## Example 6: Book Review

**File:** `scaffolds/book-review.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - books
  - reviews
categories:
  - Book Reviews
book_title:
book_author:
book_isbn:
book_cover:
rating: 0/5
read_date: {{ date }}
---

## Book Information

- **Title:** {{ book_title }}
- **Author:** {{ book_author }}
- **ISBN:** {{ book_isbn }}
- **Rating:** {{ rating }}

## Summary

Brief summary of the book...

## What I Liked

- Point 1
- Point 2
- Point 3

## What Could Be Better

- Point 1
- Point 2

## Key Takeaways

1. Takeaway 1
2. Takeaway 2
3. Takeaway 3

## Favorite Quotes

> Quote 1

> Quote 2

## Who Should Read This

This book is great for...

## Recommendation

Would I recommend this book? Why or why not?
```

**Usage:**
```bash
hexo new book-review "Review: Clean Code"
```

## Example 7: Recipe Post

**File:** `scaffolds/recipe.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
tags:
  - recipes
  - cooking
categories:
  - Recipes
prep_time: 15 minutes
cook_time: 30 minutes
total_time: 45 minutes
servings: 4
difficulty: Easy
cuisine:
course:
---

## Description

Brief description of the dish...

## Ingredients

- Ingredient 1
- Ingredient 2
- Ingredient 3

## Equipment

- Equipment 1
- Equipment 2

## Instructions

### Step 1

Instructions...

### Step 2

Instructions...

### Step 3

Instructions...

## Tips

- Tip 1
- Tip 2

## Nutrition Information (per serving)

- Calories:
- Protein:
- Carbs:
- Fat:

## Notes

Additional notes or variations...
```

**Usage:**
```bash
hexo new recipe "Homemade Pizza"
```

## Using Custom Scaffolds

### 1. Create the scaffold file

Place your scaffold in `scaffolds/your-scaffold.md`

### 2. Use it to create content

```bash
hexo new your-scaffold "Post Title"
```

### 3. Customize the generated file

Edit the created file in `source/_posts/` or `source/_pages/`

## Best Practices

1. **Include all necessary front-matter fields** - Make it easy for authors
2. **Add helpful comments** - Guide authors on what to fill in
3. **Use sensible defaults** - Pre-fill common values
4. **Add structure** - Provide sections that make sense for the content type
5. **Include examples** - Show authors what good content looks like
6. **Keep it DRY** - Don't repeat information that's in `_config.yml`

## Scaffold Tips

### Conditional Content

You can't use conditionals in scaffolds directly, but you can include optional sections:

```markdown
<!-- Optional: Add video embed
<iframe src="video-url"></iframe>
-->
```

### Multiple Language Support

Create language-specific scaffolds:

- `scaffolds/post.md` (English)
- `scaffolds/post-zh.md` (Chinese)
- `scaffolds/post-es.md` (Spanish)

### Template Comments

Add helpful comments that authors can remove:

```markdown
---
title: {{ title }}
# Add relevant tags below
tags:
  -
---

<!-- Write your introduction here -->

<!-- Add your content here -->
```

## Advanced: Dynamic Scaffolds

For more complex scaffolds, you can use scripts to generate content:

**Example:** `scaffolds/advanced-post.md`

```markdown
---
layout: {{ layout }}
title: {{ title }}
date: {{ date }}
id: <%= Math.random().toString(36).substr(2, 9) %>
word_count: TBD
reading_time: TBD
---
```

Then use a post-generation script to calculate word count and reading time.

## Testing Your Scaffolds

After creating a scaffold:

1. Test generation:
   ```bash
   hexo new your-scaffold "Test Post"
   ```

2. Verify the output file

3. Test with the server:
   ```bash
   hexo server --drafts
   ```

4. Check that all front-matter renders correctly

5. Validate with generation:
   ```bash
   hexo generate
   ```
