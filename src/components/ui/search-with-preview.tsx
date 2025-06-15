import { useState, useEffect, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CollectionEntry } from 'astro:content'

interface SearchWithPreviewProps {
    allPosts: CollectionEntry<'blog'>[]
    placeholder?: string
    maxPreviewResults?: number
    onResultClick?: (post: CollectionEntry<'blog'>) => void
}

function PreviewPostCard({ post, onClick }: {
    post: CollectionEntry<'blog'>,
    onClick?: () => void
}) {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const handleClick = () => {
        if (onClick) {
            onClick()
        } else {
            window.location.href = `/blog/${post.id}`
        }
    }

    return (
        <div
            className="p-3 hover:bg-accent/50 cursor-pointer border-b last:border-b-0 transition-colors"
            onClick={handleClick}
        >
            <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm line-clamp-1">{post.data.title}</h4>
                    <time className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDate(post.data.date)}
                    </time>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.data.description}
                </p>
                {post.data.tags && post.data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {post.data.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                            </Badge>
                        ))}
                        {post.data.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{post.data.tags.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export function SearchWithPreview({
    allPosts,
    placeholder = "Search posts...",
    maxPreviewResults = 5,
    onResultClick
}: SearchWithPreviewProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Create searchable posts data
    const searchablePosts = useMemo(() => {
        return allPosts.map(post => ({
            id: post.id,
            title: post.data.title,
            description: post.data.description,
            content: post.body || '',
            tags: post.data.tags || [],
            authors: post.data.authors || [],
            date: post.data.date,
            entry: post,
        }))
    }, [allPosts])

    // Perform search
    const searchResults = useMemo(() => {
        if (!query.trim()) {
            return []
        }

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

        const filtered = searchablePosts.filter(post =>
            searchTerms.every(term =>
                post.title.toLowerCase().includes(term) ||
                post.description.toLowerCase().includes(term) ||
                post.content.toLowerCase().includes(term) ||
                post.tags.some(tag => tag.toLowerCase().includes(term)) ||
                post.authors.some(author => author.toLowerCase().includes(term))
            )
        )

        return filtered
            .map(post => post.entry)
            .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
            .slice(0, maxPreviewResults)
    }, [query, searchablePosts, maxPreviewResults])

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)
        setIsOpen(value.trim().length > 0)
        setSelectedIndex(-1)
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || searchResults.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : searchResults.length - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                    const selectedPost = searchResults[selectedIndex]
                    handleResultClick(selectedPost)
                } else if (searchResults.length > 0) {
                    // If no item is selected, go to search page with query
                    window.location.href = `/blog/search?q=${encodeURIComponent(query)}`
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }

    // Handle result click
    const handleResultClick = (post: CollectionEntry<'blog'>) => {
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(-1)

        if (onResultClick) {
            onResultClick(post)
        } else {
            window.location.href = `/blog/${post.id}`
        }
    }

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSelectedIndex(-1)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle focus
    const handleFocus = () => {
        if (query.trim().length > 0 && searchResults.length > 0) {
            setIsOpen(true)
        }
    }

    const showViewAll = query.trim().length > 0 && searchResults.length >= maxPreviewResults

    return (
        <div ref={searchRef} className="relative w-full">
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                className="w-full"
            />

            {isOpen && query.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.length > 0 ? (
                        <>
                            {searchResults.map((post, index) => (
                                <div
                                    key={post.id}
                                    className={selectedIndex === index ? 'bg-accent/50' : ''}
                                >
                                    <PreviewPostCard
                                        post={post}
                                        onClick={() => handleResultClick(post)}
                                    />
                                </div>
                            ))}

                            {showViewAll && (
                                <div
                                    className="p-3 border-t bg-muted/30 hover:bg-muted/50 cursor-pointer text-center text-sm text-muted-foreground transition-colors"
                                    onClick={() => {
                                        window.location.href = `/blog/search?q=${encodeURIComponent(query)}`
                                    }}
                                >
                                    View all results for "{query}"
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No posts found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
