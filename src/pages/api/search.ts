import type { APIRoute } from 'astro'
import { searchPosts } from '@/lib/data-utils'

export const GET: APIRoute = async ({ url }) => {
    const searchParams = new URLSearchParams(url.search)
    const query = searchParams.get('q') || ''
    const tags = searchParams.get('tags')?.split(',').filter(tag => tag.trim()) || []

    try {
        const results = await searchPosts(query)

        // Additional filtering by tags if provided
        let filteredResults = results
        if (tags.length > 0) {
            filteredResults = results.filter(post =>
                tags.every(selectedTag =>
                    post.data.tags?.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
                )
            )
        }

        return new Response(JSON.stringify({
            success: true,
            query,
            tags,
            count: filteredResults.length,
            results: filteredResults.map(post => ({
                id: post.id,
                title: post.data.title,
                description: post.data.description,
                date: post.data.date,
                tags: post.data.tags || [],
                authors: post.data.authors || [],
                url: `/blog/${post.id}`
            }))
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to search posts',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
}
