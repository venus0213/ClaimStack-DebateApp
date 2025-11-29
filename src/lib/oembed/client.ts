// oEmbed client for fetching metadata from social media platforms

export interface OEmbedData {
  type: 'video' | 'photo' | 'link' | 'rich'
  title?: string
  description?: string
  thumbnail?: string
  url: string
  provider: string
  html?: string
  width?: number
  height?: number
  author?: string
}

export async function fetchOEmbed(url: string): Promise<OEmbedData> {
  const provider = detectProvider(url)

  switch (provider) {
    case 'youtube':
      return fetchYouTubeOEmbed(url)
    case 'tiktok':
      return fetchTikTokOEmbed(url)
    case 'instagram':
      return fetchInstagramOEmbed(url)
    case 'twitter':
      return fetchTwitterOEmbed(url)
    default:
      return fetchGenericOEmbed(url)
  }
}

function detectProvider(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  return 'generic'
}

async function fetchYouTubeOEmbed(url: string): Promise<OEmbedData> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    
    if (response.ok) {
      const data = await response.json()
      return {
        type: 'video',
        title: data.title || 'YouTube Video',
        url,
        provider: 'youtube',
        thumbnail: data.thumbnail_url,
        width: data.width,
        height: data.height,
        html: data.html,
      }
    }
  } catch (error) {
    console.error('Failed to fetch YouTube oEmbed:', error)
  }
  
  return {
    type: 'video',
    title: 'YouTube Video',
    url,
    provider: 'youtube',
  }
}

async function fetchTikTokOEmbed(url: string): Promise<OEmbedData> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    
    if (response.ok) {
      const data = await response.json()
      return {
        type: 'video',
        title: data.title || 'TikTok Video',
        url,
        provider: 'tiktok',
        thumbnail: data.thumbnail_url,
        width: data.width,
        height: data.height,
        html: data.html,
        author: data.author_name,
      }
    }
  } catch (error) {
    console.error('Failed to fetch TikTok oEmbed:', error)
  }
  
  return {
    type: 'video',
    title: 'TikTok Video',
    url,
    provider: 'tiktok',
  }
}

async function fetchInstagramOEmbed(url: string): Promise<OEmbedData> {
  try {
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    
    if (response.ok) {
      const data = await response.json()
      return {
        type: 'rich',
        title: data.title || 'Instagram Post',
        url,
        provider: 'instagram',
        thumbnail: data.thumbnail_url,
        width: data.width,
        height: data.height,
        html: data.html,
        author: data.author_name,
      }
    }
  } catch (error) {
    console.error('Failed to fetch Instagram oEmbed:', error)
  }
  
  return {
    type: 'rich',
    title: 'Instagram Post',
    url,
    provider: 'instagram',
  }
}

async function fetchTwitterOEmbed(url: string): Promise<OEmbedData> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    
    if (response.ok) {
      const data = await response.json()
      return {
        type: 'rich',
        title: data.title || 'Tweet',
        url,
        provider: 'twitter',
        width: data.width,
        height: data.height,
        html: data.html,
        author: data.author_name,
      }
    }
  } catch (error) {
    console.error('Failed to fetch Twitter oEmbed:', error)
  }
  
  return {
    type: 'rich',
    title: 'Tweet',
    url,
    provider: 'twitter',
  }
}

async function fetchGenericOEmbed(url: string): Promise<OEmbedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    if (response.ok) {
      const html = await response.text()
      
      const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      const typeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i)
      
      return {
        type: (typeMatch?.[1] === 'video' ? 'video' : typeMatch?.[1] === 'article' ? 'rich' : 'link') as 'video' | 'photo' | 'link' | 'rich',
        title: titleMatch?.[1] || 'Link',
        description: descMatch?.[1],
        thumbnail: imageMatch?.[1],
        url,
        provider: 'generic',
      }
    }
  } catch (error) {
    console.error('Failed to fetch generic oEmbed:', error)
  }
  
  return {
    type: 'link',
    title: 'Link',
    url,
    provider: 'generic',
  }
}

