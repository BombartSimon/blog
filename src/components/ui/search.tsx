import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CollectionEntry } from 'astro:content'

interface SearchProps {
    allPosts: CollectionEntry<'blog'>[]
    popularTags: string[]
}

function PostCard({ post }: { post: CollectionEntry<'blog'> }) {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <article className="group relative rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                    <time className="text-sm text-muted-foreground">
                        {formatDate(post.data.date)}
                    </time>
                </div>
                <div>
                    <h3 className="font-semibold leading-none">
                        <a href={`/blog/${post.id}`} className="hover:underline">
                            {post.data.title}
                        </a>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {post.data.description}
                    </p>
                </div>
                {post.data.tags && post.data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.data.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </article>
    )
}

function groupPostsByYear(posts: CollectionEntry<'blog'>[]): Record<string, CollectionEntry<'blog'>[]> {
    return posts.reduce((acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
        const year = post.data.date.getFullYear().toString()
            ; (acc[year] ??= []).push(post)
        return acc
    }, {})
}

export function Search({ allPosts, popularTags }: SearchProps) {
    const [query, setQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    // Initialize search from URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const urlQuery = urlParams.get('q')
            const urlTags = urlParams.get('tags')

            if (urlQuery) {
                setQuery(urlQuery)
            }

            if (urlTags) {
                setSelectedTags(urlTags.split(',').filter(tag => tag.trim()))
            }
        }
    }, [])

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
        if (!query.trim() && selectedTags.length === 0) {
            return allPosts
        }

        let filtered = searchablePosts

        // Filter by selected tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(post =>
                selectedTags.every(selectedTag =>
                    post.tags.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
                )
            )
        }

        // Filter by search query
        if (query.trim()) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
            filtered = filtered.filter(post =>
                searchTerms.every(term =>
                    post.title.toLowerCase().includes(term) ||
                    post.description.toLowerCase().includes(term) ||
                    post.content.toLowerCase().includes(term) ||
                    post.tags.some(tag => tag.toLowerCase().includes(term)) ||
                    post.authors.some(author => author.toLowerCase().includes(term))
                )
            )
        }

        return filtered
            .map(post => post.entry)
            .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    }, [query, selectedTags, searchablePosts, allPosts])

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    const clearSearch = () => {
        setQuery('')
        setSelectedTags([])
    }

    const hasActiveFilters = query.trim() || selectedTags.length > 0
    const postsByYear = groupPostsByYear(searchResults)
    const years = Object.keys(postsByYear).sort((a, b) => parseInt(b) - parseInt(a))

    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg bg-card">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Search posts by title, content, tags, or authors..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={clearSearch}
                            className="sm:w-auto"
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {popularTags.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Popular tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {popularTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTags.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Selected tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="default"
                                    className="cursor-pointer"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag} ✕
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-sm text-muted-foreground">
                    {searchResults.length} post{searchResults.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Search Results */}
            <div className="min-h-[calc(100vh-20rem)]">
                {searchResults.length === 0 && hasActiveFilters ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">No posts found matching your search.</p>
                        <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms or selected tags.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-y-8">
                        {years.map((year) => (
                            <section key={year} className="flex flex-col gap-y-4">
                                <div className="font-medium">{year}</div>
                                <ul className="flex flex-col gap-4">
                                    {postsByYear[year].map((post) => (
                                        <li key={post.id}>
                                            <PostCard post={post} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
