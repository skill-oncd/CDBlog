/**
 * On post pages, replace "Recent Posts" sidebar with "Same Category Posts".
 */
hexo.extend.filter.register('after_render:html', function(str, data) {
  var page = data.page;
  // Only on post pages with categories
  if (!page || !page.categories || !page.categories.data || !page.categories.data.length) return str;

  var cat = page.categories.data[0];
  var catMap = hexo.config.category_map || {};
  var catName = catMap[cat.name] || cat.name;

  // Get all posts in the same category, excluding current post
  var posts = hexo.locals.get('posts');
  var sameCat = posts.filter(function(p) {
    return p.categories && p.categories.data &&
           p.categories.data.some(function(c) { return c._id === cat._id; }) &&
           p._id !== page._id;
  }).sort('date', -1).limit(5).toArray();

  if (!sameCat.length) return str;

  // Build replacement HTML
  var html = '<div class="card-widget card-recent-post">';
  html += '<div class="item-headline"><i class="fas fa-folder-open"></i><span>同分类文章</span></div>';
  html += '<div class="aside-list">';

  sameCat.forEach(function(p) {
    html += '<div class="aside-list-item no-cover">';
    html += '<div class="content">';
    html += '<a class="title" href="/' + p.path + '" title="' + p.title + '">' + p.title + '</a>';
    html += '<time datetime="' + p.date.toISOString() + '" title="Created ' + p.date.format('YYYY-MM-DD HH:mm:ss') + '">' + p.date.format('YYYY-MM-DD') + '</time>';
    html += '</div></div>';
  });

  html += '</div></div>';

  // Replace the recent posts card (match by class and headline text)
  str = str.replace(
    /<div class="card-widget card-recent-post">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
    html
  );

  return str;
});
