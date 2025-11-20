// Content extraction utilities for different media types

export interface ExtractedContent {
  text: string
  metadata?: {
    title?: string
    description?: string
    author?: string
    publishedDate?: string
    [key: string]: any
  }
}

/**
 * Extract text content from a web page URL
 */
export async function extractWebPageContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    // Extract text content from HTML (basic extraction)
    // Remove script and style tags
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000) // Limit to 50k characters

    // Extract metadata from Open Graph and meta tags
    const metadata: Record<string, any> = {}
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i)
    if (titleMatch) metadata.title = titleMatch[1].trim()

    // Extract description
    const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) metadata.description = descMatch[1].trim()

    return {
      text: text || 'No text content found',
      metadata,
    }
  } catch (error) {
    console.error('Error extracting web page content:', error)
    throw new Error(`Failed to extract content from URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract content from YouTube video URL
 * Note: This is a placeholder - actual implementation would require YouTube API
 */
export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  try {
    // For now, we'll extract the video ID and fetch basic info
    // In production, you might want to use YouTube Data API v3 to get transcript
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // Try to fetch oEmbed data for metadata
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const data = await response.json()
        return {
          text: `YouTube Video: ${data.title || 'Untitled'}\n${data.author_name ? `By: ${data.author_name}\n` : ''}URL: ${url}`,
          metadata: {
            title: data.title,
            author: data.author_name,
            thumbnail: data.thumbnail_url,
          },
        }
      }
    } catch (error) {
      console.error('Failed to fetch YouTube oEmbed:', error)
    }

    return {
      text: `YouTube Video URL: ${url}\nNote: Video transcript extraction requires YouTube Data API integration.`,
      metadata: {
        videoId,
      },
    }
  } catch (error) {
    console.error('Error extracting YouTube content:', error)
    throw new Error(`Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract content from social media posts (Twitter, TikTok, Instagram)
 */
export async function extractSocialMediaContent(url: string, platform: 'twitter' | 'tiktok' | 'instagram'): Promise<ExtractedContent> {
  try {
    // Try to fetch oEmbed data
    let oembedUrl = ''
    
    switch (platform) {
      case 'twitter':
        oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
        break
      case 'tiktok':
        // TikTok oEmbed endpoint
        oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        break
      case 'instagram':
        // Instagram oEmbed requires access token, so we'll try basic fetch
        oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`
        break
    }

    if (oembedUrl) {
      try {
        const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
        if (response.ok) {
          const data = await response.json()
          return {
            text: data.title || data.html || `Content from ${platform}: ${url}`,
            metadata: {
              title: data.title,
              author: data.author_name,
              provider: platform,
            },
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${platform} oEmbed:`, error)
      }
    }

    // Fallback: try to fetch the page directly
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const html = await response.text()
        // Extract text from meta tags
        const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        
        return {
          text: `${titleMatch ? titleMatch[1] : ''}\n${descMatch ? descMatch[1] : ''}`.trim() || `Content from ${platform}: ${url}`,
          metadata: {
            title: titleMatch ? titleMatch[1] : undefined,
            description: descMatch ? descMatch[1] : undefined,
            provider: platform,
          },
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${platform} page:`, error)
    }

    return {
      text: `Content from ${platform}: ${url}`,
      metadata: {
        provider: platform,
      },
    }
  } catch (error) {
    console.error(`Error extracting ${platform} content:`, error)
    throw new Error(`Failed to extract ${platform} content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from an image URL using OpenAI Vision API
 * Returns a fallback result if Vision API is not available (e.g., country restrictions)
 */
export async function extractImageContent(imageUrl: string, openaiApiKey: string): Promise<ExtractedContent> {
  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4-vision-preview'
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and provide a detailed description of its content, including any text visible in the image, objects, people, scenes, and any other relevant information. Be thorough and descriptive.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    })

    const description = response.choices[0]?.message?.content || 'No description available'

    return {
      text: description,
      metadata: {
        type: 'image',
      },
    }
  } catch (error: any) {
    // Check if it's a country/region restriction or other API limitation
    const isCountryRestriction = error?.status === 403 && 
      (error?.code === 'unsupported_country_region_territory' || 
       error?.error?.code === 'unsupported_country_region_territory')
    
    if (isCountryRestriction) {
      console.warn('OpenAI Vision API not available in this region. Using fallback for image analysis.')
      // Return a fallback that indicates image analysis is not available
      return {
        text: `Image file available at: ${imageUrl}\nNote: Image analysis is not available in this region. Please provide a description manually.`,
        metadata: {
          type: 'image',
          analysisUnavailable: true,
        },
      }
    }
    
    // For other errors, log and return fallback
    console.error('Error extracting image content:', error?.message || error)
    return {
      text: `Image file available at: ${imageUrl}\nNote: Could not analyze image content automatically.`,
      metadata: {
        type: 'image',
        analysisUnavailable: true,
      },
    }
  }
}

/**
 * Extract text from a document file
 */
export async function extractDocumentContent(fileUrl: string, fileType: string): Promise<ExtractedContent> {
  try {
    // For now, we'll handle text-based files
    // For PDFs and other formats, you might need additional libraries like pdf-parse
    
    if (fileType.startsWith('text/') || fileType === 'application/json') {
      const response = await fetch(fileUrl, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }
      const text = await response.text()
      return {
        text: text.substring(0, 50000), // Limit to 50k characters
        metadata: {
          type: fileType,
        },
      }
    }

    // For PDFs, you would need a library like pdf-parse
    // For now, return a placeholder
    if (fileType === 'application/pdf') {
      return {
        text: `PDF document at ${fileUrl}. PDF text extraction requires additional processing.`,
        metadata: {
          type: 'pdf',
        },
      }
    }

    return {
      text: `Document file (${fileType}) at ${fileUrl}`,
      metadata: {
        type: fileType,
      },
    }
  } catch (error) {
    console.error('Error extracting document content:', error)
    throw new Error(`Failed to extract document content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

