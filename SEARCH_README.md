# Blog Search Functionality

This implementation adds dynamic search functionality to the Astro blog. The search is client-side and allows users to search through blog posts by title, content, tags, and authors.

## Features

- **Dynamic Search**: Real-time filtering as you type
- **Live Preview**: Dropdown showing matching posts as you type
- **Tag Filtering**: Click on popular tags to filter posts
- **Multi-criteria Search**: Search by title, description, content, tags, and authors
- **URL Parameters**: Share search results via URL with `?q=query&tags=tag1,tag2`
- **Responsive Design**: Works on desktop and mobile
- **Keyboard Navigation**: Arrow keys, Enter, and Escape support
- **API Endpoint**: RESTful API at `/api/search` for programmatic access
- **Global Search**: Available in header on all pages
- **Mobile Search Modal**: Full-screen search on mobile devices

## Files Added/Modified

### New Files
- `src/components/ui/input.tsx` - Input component for search
- `src/components/ui/search.tsx` - Main search component with results
- `src/components/ui/search-bar.tsx` - Simple search bar for main blog page
- `src/components/ui/search-with-preview.tsx` - **NEW: Dynamic preview component**
- `src/components/ui/mobile-search.tsx` - **NEW: Mobile search modal**
- `src/pages/blog/search.astro` - Dedicated search page
- `src/pages/api/search.ts` - API endpoint for search

### Modified Files
- `src/lib/data-utils.ts` - Added search functions
- `src/pages/blog/[...page].astro` - Added search preview to main blog listing
- `src/components/Header.astro` - **NEW: Added global search in header**
- `src/styles/global.css` - **NEW: Added line-clamp utilities**

## Usage

### Live Search Preview
- **Header Search**: Available on all pages, shows live preview dropdown
- **Blog Page Search**: Enhanced search bar with preview on blog listing page
- **Mobile Search**: Tap search icon on mobile for full-screen search modal

### Search Features
- **Type to Search**: Start typing to see immediate results
- **Keyboard Navigation**: 
  - ↑/↓ arrows to navigate results
  - Enter to select highlighted result
  - Escape to close preview
- **Click to Navigate**: Click any result to go to that post
- **View All**: See "View all results" link when there are many matches

### Search Page
Navigate to `/blog/search` to access the full search interface with:
- Search input field
- Popular tags for quick filtering
- Selected tags display
- Real-time results grouped by year

### API Endpoint
```
GET /api/search?q=your-query&tags=tag1,tag2
```

Returns JSON with search results including post metadata.

### URL Parameters
- `q`: Search query string
- `tags`: Comma-separated list of tags to filter by

Example: `/blog/search?q=golang&tags=introduction,tutorial`

## Search Preview Component Features

### Dynamic Preview (`SearchWithPreview`)
- **Real-time Results**: Shows up to 5 matching posts by default
- **Compact Cards**: Displays title, date, description, and tags
- **Smart Truncation**: Limits text with CSS line-clamp
- **Keyboard Navigation**: Full arrow key support
- **Click Outside**: Closes preview when clicking elsewhere
- **Auto-focus**: Shows preview when input gains focus with existing query

### Mobile Search Modal
- **Full-screen Experience**: Dedicated mobile search interface
- **Touch-friendly**: Large touch targets and easy navigation
- **Auto-close**: Closes modal when navigating to a post

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
5. Limits preview results (configurable via `maxPreviewResults`)

## Styling Features

### CSS Utilities
- `line-clamp-1`, `line-clamp-2`, `line-clamp-3` - Text truncation utilities
- Responsive design with mobile-first approach
- Dark mode support
- Smooth transitions and hover effects

### Component Customization
- Configurable preview result limit
- Customizable placeholder text
- Optional result click handlers
- Responsive breakpoints for mobile/desktop

## Extending the Search

To extend the search functionality:

### 1. **Add Search Result Highlighting**
```tsx
// Implement text highlighting in PreviewPostCard
const highlightText = (text: string, query: string) => {
  // Implementation for highlighting matching terms
}
```

### 2. **Add Search Categories**
```tsx
// Add category filtering to search
const searchWithCategories = (query: string, categories: string[]) => {
  // Implementation for category-based filtering
}
```

### 3. **Add Search History**
```tsx
// Store recent searches in localStorage
const useSearchHistory = () => {
  // Implementation for search history
}
```

### 4. **Add Autocomplete**
```tsx
// Implement autocomplete suggestions
const useAutocomplete = (query: string) => {
  // Implementation for tag/title suggestions
}
```

### 5. **Add Search Analytics**
```tsx
// Track search usage
const trackSearch = (query: string, resultCount: number) => {
  // Implementation for analytics
}
```

## Performance Notes

- Search is performed client-side for real-time results
- Preview results are limited to prevent performance issues
- All posts are loaded into search components (consider pagination for very large blogs)
- Content searching uses markdown body, not rendered HTML
- Debouncing could be added for very large datasets
- CSS line-clamp provides efficient text truncation

## Responsive Behavior

- **Desktop**: Full search with preview in header and blog page
- **Tablet**: Compact search with adjusted preview sizing
- **Mobile**: 
  - Hidden header search with search icon
  - Full-screen modal for search interface
  - Touch-optimized preview cards

## Accessibility Features

- Proper ARIA labels for search inputs and buttons
- Keyboard navigation support
- Focus management for modal
- Screen reader friendly result announcements
- High contrast support
