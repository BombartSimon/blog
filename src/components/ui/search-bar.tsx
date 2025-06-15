import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export function SearchBar({ onSearch, placeholder = "Search..." }: SearchBarProps) {
    const [query, setQuery] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearch(query)
    }

    const handleSearchClick = () => {
        if (query.trim()) {
            window.location.href = `/blog/search?q=${encodeURIComponent(query)}`
        } else {
            window.location.href = '/blog/search'
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
            />
            <Button
                type="button"
                onClick={handleSearchClick}
                className="px-6"
            >
                Search
            </Button>
        </form>
    )
}
