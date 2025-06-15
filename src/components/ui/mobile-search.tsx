import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchWithPreview } from '@/components/ui/search-with-preview'
import type { CollectionEntry } from 'astro:content'

interface MobileSearchProps {
    allPosts: CollectionEntry<'blog'>[]
}

export function MobileSearch({ allPosts }: MobileSearchProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setIsOpen(true)}
                aria-label="Search posts"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </Button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-background sm:hidden"
                    onClick={(e) => {
                        // Only close if clicking the backdrop, not the content
                        if (e.target === e.currentTarget) {
                            setIsOpen(false)
                        }
                    }}
                >
                    <div className="flex flex-col h-full">
                        {/* Header with search and close */}
                        <div className="flex items-center gap-2 p-4 border-b bg-background relative z-10">
                            <div className="flex-1">
                                <SearchWithPreview
                                    allPosts={allPosts}
                                    placeholder="Search posts..."
                                    maxPreviewResults={10}
                                    onResultClick={() => setIsOpen(false)}
                                    isMobile={true}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close search"
                                className="shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
