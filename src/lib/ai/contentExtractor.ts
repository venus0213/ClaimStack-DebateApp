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

export async function extractWebPageContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000)

    const metadata: Record<string, any> = {}
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i)
    if (titleMatch) metadata.title = titleMatch[1].trim()

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
 */
export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  try {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

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
        oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
        break
      case 'instagram':
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

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const html = await response.text()
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
 */
export async function extractImageContent(imageUrl: string, openaiApiKey: string): Promise<ExtractedContent> {
  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
    const isCountryRestriction = error?.status === 403 && 
      (error?.code === 'unsupported_country_region_territory' || 
       error?.error?.code === 'unsupported_country_region_territory')
    
    if (isCountryRestriction) {
      console.warn('OpenAI Vision API not available in this region. Using fallback for image analysis.')
      return {
        text: `Image file available at: ${imageUrl}\nNote: Image analysis is not available in this region. Please provide a description manually.`,
        metadata: {
          type: 'image',
          analysisUnavailable: true,
        },
      }
    }
    
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
    
    if (fileType.startsWith('text/') || fileType === 'application/json') {
      const response = await fetch(fileUrl, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }
      const text = await response.text()
      return {
        text: text.substring(0, 50000),
        metadata: {
          type: fileType,
        },
      }
    }

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