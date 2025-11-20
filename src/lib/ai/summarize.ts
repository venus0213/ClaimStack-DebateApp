// AI summary generation utilities using OpenAI

import OpenAI from 'openai'
import {
  extractWebPageContent,
  extractYouTubeContent,
  extractSocialMediaContent,
  extractImageContent,
  extractDocumentContent,
} from './contentExtractor'

export interface SummaryOptions {
  evidence: Array<{
    position: 'for' | 'against'
    title?: string
    description?: string
    content?: string
  }>
  claimTitle: string
  claimDescription?: string
}

export interface SummaryResult {
  forSummary: string
  againstSummary: string
}

export interface ClaimSummaryOptions {
  title: string
  description?: string
  url?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
}

export interface EvidenceSummaryOptions {
  type: 'url' | 'file' | 'youtube' | 'tiktok' | 'instagram' | 'tweet' | 'text'
  title?: string
  description?: string
  url?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  position: 'for' | 'against'
  claimTitle?: string
}

/**
 * Generate summaries for a claim based on evidence
 */
export async function generateSummaries(
  options: SummaryOptions
): Promise<SummaryResult> {
  const aiProvider = process.env.AI_PROVIDER || 'openai' // 'openai' or 'anthropic'

  if (aiProvider === 'openai') {
    return generateWithOpenAI(options)
  } else {
    return generateWithAnthropic(options)
  }
}

/**
 * Generate AI summary for a single claim
 */
export async function generateClaimSummary(
  options: ClaimSummaryOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey })

  try {
    // Extract content from URL or file if provided
    let extractedContent = ''
    let contentContext = ''

    if (options.url) {
      try {
        // Determine content type from URL
        if (options.url.includes('youtube.com') || options.url.includes('youtu.be')) {
          const content = await extractYouTubeContent(options.url)
          extractedContent = content.text
          contentContext = `External Content (YouTube): ${content.metadata?.title || 'Video'}\n\n`
        } else if (options.url.includes('tiktok.com')) {
          const content = await extractSocialMediaContent(options.url, 'tiktok')
          extractedContent = content.text
          contentContext = `External Content (TikTok): ${content.metadata?.title || 'Post'}\n\n`
        } else if (options.url.includes('instagram.com')) {
          const content = await extractSocialMediaContent(options.url, 'instagram')
          extractedContent = content.text
          contentContext = `External Content (Instagram): ${content.metadata?.title || 'Post'}\n\n`
        } else if (options.url.includes('twitter.com') || options.url.includes('x.com')) {
          const content = await extractSocialMediaContent(options.url, 'twitter')
          extractedContent = content.text
          contentContext = `External Content (Twitter/X): ${content.metadata?.title || 'Tweet'}\n\n`
        } else {
          const content = await extractWebPageContent(options.url)
          extractedContent = content.text
          contentContext = `External Content (Web Page): ${content.metadata?.title || 'Article'}\n\n`
        }
      } catch (error) {
        console.error('Error extracting content from URL:', error)
        // Continue with summary generation even if content extraction fails
      }
    } else if (options.fileUrl) {
      try {
        const isImage = options.fileType?.startsWith('image/')
        if (isImage) {
          const content = await extractImageContent(options.fileUrl, apiKey)
          extractedContent = content.text
          contentContext = `Uploaded Image Content:\n\n`
          // If image analysis is unavailable, still generate a summary based on title/description
          if (content.metadata?.analysisUnavailable && !extractedContent.includes('Note:')) {
            // Use a simpler approach - generate summary from title/description only
            extractedContent = ''
            contentContext = `Uploaded Image (${options.fileName || 'image'}):\n\n`
          }
        } else {
          const content = await extractDocumentContent(options.fileUrl, options.fileType || '')
          extractedContent = content.text
          contentContext = `Uploaded Document (${options.fileName || 'file'}):\n\n`
        }
      } catch (error) {
        console.error('Error extracting content from file:', error)
        // Continue with summary generation even if content extraction fails
      }
    }

    // Build prompt
    const prompt = buildClaimSummaryPrompt({
      title: options.title,
      description: options.description,
      extractedContent,
      contentContext,
    })

    // Generate summary using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-4-turbo-preview' for better performance
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing claims and evidence. Generate clear, concise, and objective summaries that capture the key points and context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const summary = response.choices[0]?.message?.content?.trim() || 'Summary generation failed'
    console.log(' AI Claim Summary: >>--->', summary)

    return summary
  } catch (error: any) {
    // Check if it's a country/region restriction
    const isCountryRestriction = error?.status === 403 && 
      (error?.code === 'unsupported_country_region_territory' || 
       error?.error?.code === 'unsupported_country_region_territory')
    
    if (isCountryRestriction) {
      console.warn('OpenAI API not available in this region. Cannot generate AI summary.')
      // Return a basic summary based on available information
      const basicSummary = options.description 
        ? `${options.title}\n\n${options.description.substring(0, 300)}${options.description.length > 300 ? '...' : ''}`
        : options.title || 'Summary not available (AI service restricted in this region)'
      return basicSummary
    }
    
    console.error('Error generating claim summary:', error?.message || error)
    // Return a fallback summary instead of throwing
    const fallbackSummary = options.description 
      ? `${options.title}\n\n${options.description.substring(0, 300)}${options.description.length > 300 ? '...' : ''}`
      : options.title || 'Summary generation failed'
    return fallbackSummary
  }
}

/**
 * Generate AI summary for a single evidence item
 */
export async function generateEvidenceSummary(
  options: EvidenceSummaryOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey })

  try {
    // Extract content based on evidence type
    let extractedContent = ''
    let contentContext = ''

    if (options.type === 'url' && options.url) {
      try {
        const content = await extractWebPageContent(options.url)
        extractedContent = content.text
        contentContext = `Web Page Content:\n\n`
      } catch (error) {
        console.error('Error extracting web page content:', error)
      }
    } else if (options.type === 'youtube' && options.url) {
      try {
        const content = await extractYouTubeContent(options.url)
        extractedContent = content.text
        contentContext = `YouTube Video Content:\n\n`
      } catch (error) {
        console.error('Error extracting YouTube content:', error)
      }
    } else if (options.type === 'tiktok' && options.url) {
      try {
        const content = await extractSocialMediaContent(options.url, 'tiktok')
        extractedContent = content.text
        contentContext = `TikTok Video Content:\n\n`
      } catch (error) {
        console.error('Error extracting TikTok content:', error)
      }
    } else if (options.type === 'instagram' && options.url) {
      try {
        const content = await extractSocialMediaContent(options.url, 'instagram')
        extractedContent = content.text
        contentContext = `Instagram Post Content:\n\n`
      } catch (error) {
        console.error('Error extracting Instagram content:', error)
      }
    } else if (options.type === 'tweet' && options.url) {
      try {
        const content = await extractSocialMediaContent(options.url, 'twitter')
        extractedContent = content.text
        contentContext = `Twitter/X Post Content:\n\n`
      } catch (error) {
        console.error('Error extracting Twitter content:', error)
      }
    } else if (options.type === 'file' && options.fileUrl) {
      try {
        const isImage = options.fileType?.startsWith('image/')
        if (isImage) {
          const content = await extractImageContent(options.fileUrl, apiKey)
          extractedContent = content.text
          contentContext = `Image Content:\n\n`
          // If image analysis is unavailable, still generate a summary based on title/description
          if (content.metadata?.analysisUnavailable && !extractedContent.includes('Note:')) {
            // Use a simpler approach - generate summary from title/description only
            extractedContent = ''
            contentContext = `Image File (${options.fileName || 'image'}):\n\n`
          }
        } else {
          const content = await extractDocumentContent(options.fileUrl, options.fileType || '')
          extractedContent = content.text
          contentContext = `Document Content (${options.fileName || 'file'}):\n\n`
        }
      } catch (error) {
        console.error('Error extracting file content:', error)
      }
    }

    // Build prompt
    const prompt = buildEvidenceSummaryPrompt({
      title: options.title,
      description: options.description,
      extractedContent,
      contentContext,
      position: options.position,
      claimTitle: options.claimTitle,
      type: options.type,
    })

    // Generate summary using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing evidence and summarizing its key points. Generate clear, concise summaries that highlight the most important information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    })

    const summary = response.choices[0]?.message?.content?.trim() || 'Summary generation failed'

    return summary
  } catch (error: any) {
    // Check if it's a country/region restriction
    const isCountryRestriction = error?.status === 403 && 
      (error?.code === 'unsupported_country_region_territory' || 
       error?.error?.code === 'unsupported_country_region_territory')
    
    if (isCountryRestriction) {
      console.warn('OpenAI API not available in this region. Cannot generate AI summary.')
      // Return a basic summary based on available information
      const basicSummary = options.description 
        ? `${options.title ? options.title + ': ' : ''}${options.description.substring(0, 200)}${options.description.length > 200 ? '...' : ''}`
        : options.title || 'Summary not available (AI service restricted in this region)'
      return basicSummary
    }
    
    console.error('Error generating evidence summary:', error?.message || error)
    // Return a fallback summary instead of throwing
    const fallbackSummary = options.description 
      ? `${options.title ? options.title + ': ' : ''}${options.description.substring(0, 200)}${options.description.length > 200 ? '...' : ''}`
      : options.title || 'Summary generation failed'
    return fallbackSummary
  }
}

async function generateWithOpenAI(options: SummaryOptions): Promise<SummaryResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey })
  const prompt = buildPrompt(options)

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing claims and evidence. Generate balanced, evidence-based summaries that promote deeper understanding.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content?.trim() || ''
    
    // Parse the response to extract for and against summaries
    // The AI should return structured output, but we'll handle both structured and unstructured
    const forMatch = content.match(/For[:\s]+(.*?)(?=Against|$)/is)
    const againstMatch = content.match(/Against[:\s]+(.*?)$/is)

    return {
      forSummary: forMatch ? forMatch[1].trim() : content.split('\n\n')[0] || 'Summary generation failed',
      againstSummary: againstMatch ? againstMatch[1].trim() : content.split('\n\n')[1] || 'Summary generation failed',
    }
  } catch (error: any) {
    // Check if it's a country/region restriction
    const isCountryRestriction = error?.status === 403 && 
      (error?.code === 'unsupported_country_region_territory' || 
       error?.error?.code === 'unsupported_country_region_territory')
    
    if (isCountryRestriction) {
      console.warn('OpenAI API not available in this region. Cannot generate AI summaries.')
      // Return fallback summaries
      return {
        forSummary: 'AI summary not available (OpenAI API restricted in this region)',
        againstSummary: 'AI summary not available (OpenAI API restricted in this region)',
      }
    }
    
    console.error('Error generating summaries with OpenAI:', error?.message || error)
    // Return fallback summaries instead of throwing
    return {
      forSummary: 'Summary generation failed. Please try again later.',
      againstSummary: 'Summary generation failed. Please try again later.',
    }
  }
}

async function generateWithAnthropic(options: SummaryOptions): Promise<SummaryResult> {
  // TODO: Implement Anthropic API call
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  // const prompt = buildPrompt(options)
  // const response = await client.messages.create({ ... })
  
  // Mock response for now
  return {
    forSummary: 'AI-generated summary for the "For" position based on the provided evidence...',
    againstSummary: 'AI-generated steel man summary for the "Against" position...',
  }
}

function buildPrompt(options: SummaryOptions): string {
  const forEvidence = options.evidence.filter((e) => e.position === 'for')
  const againstEvidence = options.evidence.filter((e) => e.position === 'against')

  return `
Generate two summaries for the following claim:

Claim: ${options.claimTitle}
${options.claimDescription ? `Description: ${options.claimDescription}` : ''}

Evidence FOR the claim:
${forEvidence.map((e, i) => `${i + 1}. ${e.title || e.description || e.content}`).join('\n')}

Evidence AGAINST the claim:
${againstEvidence.map((e, i) => `${i + 1}. ${e.title || e.description || e.content}`).join('\n')}

Please generate:
1. A "Leading Position Summary (For)" - A clear, concise summary of the strongest arguments supporting the claim.
2. A "Steel Man of Opposing View (Against)" - A fair, thoughtful restatement of the best opposing arguments, even stronger than what opponents might present.

Both summaries should be balanced, evidence-based, and promote deeper understanding.

Format your response as:
For: [summary]
Against: [summary]
  `.trim()
}

function buildClaimSummaryPrompt(options: {
  title: string
  description?: string
  extractedContent: string
  contentContext: string
}): string {
  return `
Please analyze the following claim and generate a comprehensive summary that captures its key points, context, and significance.

Claim Title: ${options.title}
${options.description ? `Claim Description: ${options.description}` : ''}

${options.extractedContent ? `${options.contentContext}${options.extractedContent.substring(0, 10000)}` : ''}

Generate a clear, concise summary (2-4 sentences) that:
1. Captures the main point of the claim
2. Highlights any important context or background
3. Notes any supporting evidence or sources mentioned
4. Is objective and informative

Summary:
  `.trim()
}

function buildEvidenceSummaryPrompt(options: {
  title?: string
  description?: string
  extractedContent: string
  contentContext: string
  position: 'for' | 'against'
  claimTitle?: string
  type: string
}): string {
  return `
Please analyze the following evidence and generate a concise summary of its key points.

${options.claimTitle ? `Related Claim: ${options.claimTitle}` : ''}
Evidence Position: ${options.position.toUpperCase()}
Evidence Type: ${options.type}
${options.title ? `Evidence Title: ${options.title}` : ''}
${options.description ? `Evidence Description: ${options.description}` : ''}

${options.extractedContent ? `${options.contentContext}${options.extractedContent.substring(0, 10000)}` : ''}

Generate a clear, concise summary (2-3 sentences) that:
1. Captures the main points or arguments presented
2. Highlights key facts, data, or claims made
3. Explains how this evidence relates to the position (${options.position})
4. Is objective and factual

Summary:
  `.trim()
}
