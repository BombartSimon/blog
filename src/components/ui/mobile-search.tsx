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
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:hidden">
                    <div className="fixed top-0 left-0 right-0 p-4 bg-background border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <SearchWithPreview
                                    allPosts={allPosts}
                                    placeholder="Search posts..."
                                    maxPreviewResults={6}
                                    onResultClick={() => setIsOpen(false)}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close search"
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
