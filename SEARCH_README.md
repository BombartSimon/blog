# Blog Search Functionality

This implementation adds dynamic search functionality to the Astro blog. The search is client-side and allows users to search through blog posts by title, content, tags, and authors.

## Features

- **Dynamic Search**: Real-time filtering as you type
- **Tag Filtering**: Click on popular tags to filter posts
- **Multi-criteria Search**: Search by title, description, content, tags, and authors
- **URL Parameters**: Share search results via URL with `?q=query&tags=tag1,tag2`
- **Responsive Design**: Works on desktop and mobile
- **API Endpoint**: RESTful API at `/api/search` for programmatic access

## Files Added/Modified

### New Files
- `src/components/ui/input.tsx` - Input component for search
- `src/components/ui/search.tsx` - Main search component with results
- `src/components/ui/search-bar.tsx` - Simple search bar for main blog page
- `src/pages/blog/search.astro` - Dedicated search page
- `src/pages/api/search.ts` - API endpoint for search

### Modified Files
- `src/lib/data-utils.ts` - Added search functions
- `src/pages/blog/[...page].astro` - Added search bar to main blog listing

## Usage

### Search Page
Navigate to `/blog/search` to access the full search interface with:
- Search input field
- Popular tags for quick filtering
- Selected tags display
- Real-time results

### Main Blog Page
The main blog listing (`/blog`) now includes a search bar that redirects to the search page.

### API Endpoint
```
GET /api/search?q=your-query&tags=tag1,tag2
```

Returns JSON with search results including post metadata.

### URL Parameters
- `q`: Search query string
- `tags`: Comma-separated list of tags to filter by

Example: `/blog/search?q=golang&tags=introduction,tutorial`

## Search Algorithm

The search function:
1. Splits the query into individual terms
2. Filters posts where ALL terms match at least one of:
   - Post title (case-insensitive)
   - Post description (case-insensitive) 
   - Post content (case-insensitive)
   - Post tags (case-insensitive)
   - Post authors (case-insensitive)
3. Additionally filters by selected tags
4. Sorts results by date (newest first)

## Extending the Search

To extend the search functionality:

1. **Add more search fields**: Modify the search algorithm in `searchPosts()` function
2. **Add search result highlights**: Implement text highlighting in the PostCard component
3. **Add autocomplete**: Create a suggestion system based on existing tags/titles
4. **Add search history**: Store recent searches in localStorage
5. **Add search analytics**: Track popular search terms

## Performance Notes

- Search is performed client-side for real-time results
- All posts are loaded into the search component (consider pagination for very large blogs)
- Content searching uses the markdown body, not rendered HTML
- For better performance with many posts, consider implementing server-side search or a search index
