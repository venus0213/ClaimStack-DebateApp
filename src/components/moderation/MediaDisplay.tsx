'use client'

import React, { useState, useEffect, useRef } from 'react'
import { LinkIcon, PdfIcon } from '@/components/ui/Icons'
import { fetchOEmbed, type OEmbedData } from '@/lib/oembed/client'

export interface MediaDisplayProps {
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  url?: string
  link?: string
  title?: string
}

// Helper function to determine file category
const getFileCategory = (fileType?: string, fileName?: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  // Check MIME type first
  if (fileType) {
    const type = fileType.toLowerCase()
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    if (type.includes('pdf') || type.includes('document') || type.includes('word') || 
        type.includes('excel') || type.includes('powerpoint') || type.includes('text') ||
        type.includes('msword') || type.includes('spreadsheet') || type.includes('presentation')) {
      return 'document'
    }
  }
  
  // Fallback to file extension if MIME type is not available
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension) return 'other'
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv']
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp']
    
    if (imageExtensions.includes(extension)) return 'image'
    if (videoExtensions.includes(extension)) return 'video'
    if (audioExtensions.includes(extension)) return 'audio'
    if (documentExtensions.includes(extension)) return 'document'
  }
  
  return 'other'
}

// Helper function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Helper function to check if URL is a PDF
const isPdfUrl = (url?: string): boolean => {
  if (!url) return false
  const lowerUrl = url.toLowerCase()
  return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerUrl.includes('.pdf#')
}

// Helper function to extract base website URL from a PDF URL
const getBaseWebsiteUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}`
  } catch (error) {
    // If URL parsing fails, try to extract manually
    const match = url.match(/^(https?:\/\/[^\/]+)/)
    return match ? match[1] : url
  }
}

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Helper function to extract TikTok video ID
const getTikTokVideoId = (url: string): string | null => {
  const match = url.match(/tiktok\.com\/.*\/video\/(\d+)/)
  return match ? match[1] : null
}

// Helper function to extract Instagram post ID
const getInstagramPostId = (url: string): string | null => {
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[2] : null
}

// Helper function to detect platform from URL
const getPlatformFromUrl = (url: string): { platform: string; icon: JSX.Element; isEmbeddable: boolean } => {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('tiktok.com')) {
    return {
      platform: 'TikTok',
      isEmbeddable: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    }
  }
  
  if (lowerUrl.includes('instagram.com')) {
    return {
      platform: 'Instagram',
      isEmbeddable: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    }
  }
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return {
      platform: 'YouTube',
      isEmbeddable: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
  }
  
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return {
      platform: 'Twitter/X',
      isEmbeddable: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    }
  }
  
  return {
    platform: 'External Link',
    isEmbeddable: false,
    icon: (
      <LinkIcon className="w-5 h-5" />
    )
  }
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  fileUrl,
  fileName,
  fileSize,
  fileType,
  url,
  link,
  title = 'Media',
}) => {
  const [fileError, setFileError] = useState(false)
  const [oEmbedData, setOEmbedData] = useState<OEmbedData | null>(null)
  const [oEmbedLoading, setOEmbedLoading] = useState(false)
  const [oEmbedError, setOEmbedError] = useState(false)
  const [pdfIframeError, setPdfIframeError] = useState(false)
  const [pdfObjectError, setPdfObjectError] = useState(false)
  const [urlPdfIframeError, setUrlPdfIframeError] = useState(false)
  const [urlPdfObjectError, setUrlPdfObjectError] = useState(false)
  const [pdfLoadTimeout, setPdfLoadTimeout] = useState(false)
  const [websiteIframeError, setWebsiteIframeError] = useState(false)
  const [showWebsiteIframe, setShowWebsiteIframe] = useState(true)
  const [showWebsiteFallback, setShowWebsiteFallback] = useState(false)
  const embedContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef<{ [key: string]: boolean }>({})
  const pdfIframeRef = useRef<HTMLIFrameElement>(null)
  const urlPdfIframeRef = useRef<HTMLIFrameElement>(null)
  const websiteIframeRef = useRef<HTMLIFrameElement>(null)
  const pdfWebsiteIframeRef = useRef<HTMLIFrameElement>(null)

  // Reset file error when fileUrl or url changes
  useEffect(() => {
    setFileError(false)
    setPdfIframeError(false)
    setPdfObjectError(false)
    setUrlPdfIframeError(false)
    setUrlPdfObjectError(false)
    setPdfLoadTimeout(false)
    setWebsiteIframeError(false)
    setShowWebsiteIframe(true)
    setShowWebsiteFallback(false)
  }, [fileUrl, url])

  useEffect(() => {
    if (!url || !isPdfUrl(url)) return
    
    // Set a timeout to detect if PDF might be blocked
    const timeout = setTimeout(() => {
      // If iframe hasn't triggered an error yet, check if we should show a fallback message
      // We can't directly detect cross-origin errors, but we can show a helpful message
      if (!urlPdfIframeError && !urlPdfObjectError) {
        setPdfLoadTimeout(true)
      }
    }, 3000) // 3 second timeout
    
    return () => clearTimeout(timeout)
  }, [url, urlPdfIframeError, urlPdfObjectError])

  // Fetch oEmbed data when URL changes
  useEffect(() => {
    if (!url) {
      setOEmbedData(null)
      setOEmbedError(false)
      return
    }

    const { platform, isEmbeddable } = getPlatformFromUrl(url)
    
    // Only fetch oEmbed for TikTok, Instagram, and YouTube
    if (isEmbeddable && (platform === 'TikTok' || platform === 'Instagram' || platform === 'YouTube')) {
      setOEmbedLoading(true)
      setOEmbedError(false)
      
      fetchOEmbed(url)
        .then((data) => {
          setOEmbedData(data)
          setOEmbedLoading(false)
        })
        .catch((error) => {
          console.error('Failed to fetch oEmbed:', error)
          setOEmbedError(true)
          setOEmbedLoading(false)
        })
    } else {
      setOEmbedData(null)
    }
  }, [url])

  // Load embed scripts when oEmbed HTML is available
  useEffect(() => {
    if (!oEmbedData?.html || !url) return

    const { platform } = getPlatformFromUrl(url)
    const scriptKey = `${platform}-script`

    // Load TikTok embed script
    if (platform === 'TikTok' && oEmbedData.html.includes('tiktok-embed')) {
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.tiktok.com/embed.js'
        script.async = true
        script.id = 'tiktok-embed-script'
        script.onload = () => {
          scriptLoadedRef.current[scriptKey] = true
        }
        document.body.appendChild(script)
      } else {
        scriptLoadedRef.current[scriptKey] = true
      }
    }

    // Load Instagram embed script
    if (platform === 'Instagram' && oEmbedData.html.includes('instagram-media')) {
      const existingScript = document.querySelector('script[src="//www.instagram.com/embed.js"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = '//www.instagram.com/embed.js'
        script.async = true
        script.id = 'instagram-embed-script'
        script.onload = () => {
          scriptLoadedRef.current[scriptKey] = true
        }
        document.body.appendChild(script)
      } else {
        scriptLoadedRef.current[scriptKey] = true
      }
    }

    // Load Twitter embed script
    if (platform === 'Twitter/X' && oEmbedData.html.includes('twitter-tweet')) {
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.charset = 'utf-8'
        script.id = 'twitter-embed-script'
        script.onload = () => {
          scriptLoadedRef.current[scriptKey] = true
        }
        document.body.appendChild(script)
      } else {
        scriptLoadedRef.current[scriptKey] = true
      }
    }
  }, [oEmbedData, url])

  // Process oEmbed HTML and inject it into the container
  useEffect(() => {
    if (!oEmbedData?.html || !embedContainerRef.current || !url) return

    const { platform } = getPlatformFromUrl(url)
    
    // Inject the HTML from oEmbed
    embedContainerRef.current.innerHTML = oEmbedData.html
    
    // For TikTok, Instagram, and Twitter, process embeds after HTML injection
    // The embed scripts will automatically process elements, but we can also manually trigger if needed
    if (platform === 'TikTok') {
      // Check if script is already loaded
      if ((window as any).tiktokEmbed) {
        try {
          (window as any).tiktokEmbed.lib.render(embedContainerRef.current)
        } catch (error) {
          console.error('Failed to render TikTok embed:', error)
        }
      } else {
        // Wait for script to load
        const checkTikTokScript = setInterval(() => {
          if ((window as any).tiktokEmbed) {
            clearInterval(checkTikTokScript)
            try {
              (window as any).tiktokEmbed.lib.render(embedContainerRef.current)
            } catch (error) {
              console.error('Failed to render TikTok embed:', error)
            }
          }
        }, 100)
        
        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkTikTokScript), 5000)
      }
    } else if (platform === 'Instagram') {
      // Check if script is already loaded
      if ((window as any).instgrm) {
        try {
          (window as any).instgrm.Embeds.process()
        } catch (error) {
          console.error('Failed to process Instagram embed:', error)
        }
      } else {
        // Wait for script to load
        const checkInstagramScript = setInterval(() => {
          if ((window as any).instgrm) {
            clearInterval(checkInstagramScript)
            try {
              (window as any).instgrm.Embeds.process()
            } catch (error) {
              console.error('Failed to process Instagram embed:', error)
            }
          }
        }, 100)
        
        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkInstagramScript), 5000)
      }
    } else if (platform === 'Twitter/X') {
      // Check if script is already loaded
      if ((window as any).twttr && (window as any).twttr.widgets) {
        try {
          (window as any).twttr.widgets.load(embedContainerRef.current)
        } catch (error) {
          console.error('Failed to load Twitter embed:', error)
        }
      } else {
        // Wait for script to load
        const checkTwitterScript = setInterval(() => {
          if ((window as any).twttr && (window as any).twttr.widgets) {
            clearInterval(checkTwitterScript)
            try {
              (window as any).twttr.widgets.load(embedContainerRef.current)
            } catch (error) {
              console.error('Failed to load Twitter embed:', error)
            }
          }
        }, 100)
        
        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkTwitterScript), 5000)
      }
    }
    // For YouTube, the HTML is already a complete iframe, so no additional processing needed
  }, [oEmbedData, url])

  return (
    <div className="space-y-4 mt-4">
      {/* Uploaded File Display */}
      {fileUrl ? (
        (() => {
          const fileCategory = getFileCategory(fileType, fileName)
          
          if (fileCategory === 'image' && !fileError) {
            return (
              <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={fileUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={() => setFileError(true)}
                />
              </div>
            )
          }
          
          if (fileCategory === 'video' && !fileError) {
            return (
              <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                <video
                  src={fileUrl}
                  controls
                  className="w-full h-full object-contain"
                  onError={() => setFileError(true)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )
          }
          
          if (fileCategory === 'audio' && !fileError) {
            return (
              <div className="w-full bg-gray-200 rounded-lg p-4">
                <audio
                  src={fileUrl}
                  controls
                  className="w-full"
                  onError={() => setFileError(true)}
                >
                  Your browser does not support the audio tag.
                </audio>
                {fileName && (
                  <p className="text-sm text-gray-600 mt-2 text-center">{fileName}</p>
                )}
              </div>
            )
          }
          
          // PDF files - display with fallback options
          if (fileCategory === 'document' && (fileType?.toLowerCase().includes('pdf') || fileName?.toLowerCase().endsWith('.pdf') || isPdfUrl(fileUrl))) {
            // If iframe failed, try object tag
            if (pdfIframeError && !pdfObjectError) {
              return (
                <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <PdfIcon className="w-5 h-5 text-red-600" />
                      {fileName && (
                        <span className="text-sm font-medium text-gray-700">{fileName}</span>
                      )}
                      {fileSize && (
                        <span className="text-xs text-gray-500">({formatFileSize(fileSize)})</span>
                      )}
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                  <object
                    data={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    type="application/pdf"
                    className="w-full flex-1 border-0"
                    style={{ minHeight: '500px' }}
                    onError={() => setPdfObjectError(true)}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center p-6">
                        <PdfIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <p className="text-sm text-gray-700 mb-2">Unable to display PDF in browser</p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Open PDF in new tab
                        </a>
                      </div>
                    </div>
                  </object>
                </div>
              )
            }
            
            // If both iframe and object failed, show fallback UI
            if (pdfIframeError && pdfObjectError) {
              return (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <PdfIcon className="w-20 h-20 text-red-600" />
                    <div className="text-center">
                      {fileName && (
                        <p className="text-lg font-medium text-gray-700 mb-1">{fileName}</p>
                      )}
                      {fileSize && (
                        <p className="text-sm text-gray-500 mb-4">{formatFileSize(fileSize)}</p>
                      )}
                      <p className="text-sm text-gray-600 mb-4">
                        This PDF cannot be embedded due to security restrictions.
                      </p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open PDF in new tab
                      </a>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Try iframe first
            return (
              <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <PdfIcon className="w-5 h-5 text-red-600" />
                    {fileName && (
                      <span className="text-sm font-medium text-gray-700">{fileName}</span>
                    )}
                    {fileSize && (
                      <span className="text-xs text-gray-500">({formatFileSize(fileSize)})</span>
                    )}
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                  >
                    Open in new tab
                  </a>
                </div>
                <iframe
                  ref={pdfIframeRef}
                  src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full flex-1 border-0"
                  title={fileName || 'PDF Document'}
                  style={{ minHeight: '500px' }}
                  onError={() => setPdfIframeError(true)}
                />
              </div>
            )
          }
          
          // Document or other file types
          return (
            <div className="w-full bg-gray-200 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                {fileCategory === 'document' ? (
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <div className="text-center">
                  {fileName && (
                    <p className="text-sm font-medium text-gray-700 mb-1">{fileName}</p>
                  )}
                  {fileType && (
                    <p className="text-xs text-gray-500 mb-2">{fileType}</p>
                  )}
                  {fileSize && (
                    <p className="text-xs text-gray-500 mb-3">{formatFileSize(fileSize)}</p>
                  )}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download File
                  </a>
                </div>
              </div>
            </div>
          )
        })()
      ) : !url ? (
        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : null}
      
      {/* External URL Display */}
      {url && (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
          {(() => {
            // Check if URL is a PDF
            if (isPdfUrl(url)) {
              // If iframe failed, try object tag
              if (urlPdfIframeError && !urlPdfObjectError) {
                return (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                      <PdfIcon className="w-5 h-5 text-red-600" />
                      <span className="font-medium">PDF Document</span>
                    </div>
                    <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-300">
                        <span className="text-sm font-medium text-gray-700">PDF Viewer</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                        >
                          Open in new tab
                        </a>
                      </div>
                      <object
                        data={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                        type="application/pdf"
                        className="w-full flex-1 border-0"
                        style={{ minHeight: '500px' }}
                        onError={() => setUrlPdfObjectError(true)}
                      >
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center p-6">
                            <PdfIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
                            <p className="text-sm text-gray-700 mb-2">Unable to display PDF in browser</p>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Open PDF in new tab
                            </a>
                          </div>
                        </div>
                      </object>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                    >
                      <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="break-all">{url}</span>
                    </a>
                  </div>
                )
              }
              
              // If both iframe and object failed, show website in iframe as fallback
              if (urlPdfIframeError && urlPdfObjectError) {
                const baseWebsiteUrl = getBaseWebsiteUrl(url)
                
                // Show website in iframe so user can navigate and pass verification
                if (showWebsiteFallback) {
                  return (
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <PdfIcon className="w-5 h-5 text-red-600" />
                          <span className="font-medium">PDF Document - Website View</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowWebsiteFallback(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Show options
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                          >
                            Open PDF in new tab
                          </a>
                        </div>
                      </div>
                      <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative">
                        <div className="absolute top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 p-2 z-10">
                          <p className="text-xs text-blue-800 text-center">
                            <strong>Note:</strong> Navigate to the PDF within this website. You may need to complete verification (CAPTCHA) first.
                            The PDF URL is: <span className="font-mono text-xs break-all">{url}</span>
                          </p>
                        </div>
                        <iframe
                          ref={pdfWebsiteIframeRef}
                          src={baseWebsiteUrl}
                          className="w-full h-full border-0"
                          title="Website for PDF Access"
                          style={{ minHeight: '600px', marginTop: '40px' }}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                          onError={() => {
                            // If website iframe also fails, show final fallback
                            setShowWebsiteFallback(false)
                          }}
                        />
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                      >
                        <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="break-all">{url}</span>
                      </a>
                    </div>
                  )
                }
                
                // Show options to try website view or open directly
                return (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                      <PdfIcon className="w-5 h-5 text-red-600" />
                      <span className="font-medium">PDF Document</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <PdfIcon className="w-20 h-20 text-red-600" />
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            This PDF cannot be embedded due to security restrictions.
                          </p>
                          <p className="text-xs text-gray-500 mb-4">
                            The website may require verification (CAPTCHA) to access the PDF.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              onClick={() => setShowWebsiteFallback(true)}
                              className="inline-flex items-center px-6 py-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              Open Website (for verification)
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open PDF in new tab
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                    >
                      <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="break-all">{url}</span>
                    </a>
                  </div>
                )
              }
              
              // Try iframe first
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                    <PdfIcon className="w-5 h-5 text-red-600" />
                    <span className="font-medium">PDF Document</span>
                  </div>
                  <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-300">
                      <span className="text-sm font-medium text-gray-700">PDF Viewer</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                    <iframe
                      ref={urlPdfIframeRef}
                      src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full flex-1 border-0"
                      title="PDF Document"
                      style={{ minHeight: '500px' }}
                      onError={() => setUrlPdfIframeError(true)}
                      onLoad={() => {
                        // Reset timeout on successful load
                        setPdfLoadTimeout(false)
                      }}
                    />
                  </div>
                  {pdfLoadTimeout && !urlPdfIframeError && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> If you see an error message above (like "refused to connect"), 
                        the PDF cannot be embedded. Click "Open in new tab" above to view it.
                      </p>
                    </div>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            const { platform, icon, isEmbeddable } = getPlatformFromUrl(url)
            
            // Show loading state while fetching oEmbed
            if (oEmbedLoading && isEmbeddable && (platform === 'TikTok' || platform === 'Instagram' || platform === 'YouTube')) {
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                    <div className="text-blue-600">{icon}</div>
                    <span className="font-medium">{platform}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-lg flex items-center justify-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading embed...</p>
                    </div>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            // Show oEmbed content for TikTok, Instagram, and YouTube
            if (oEmbedData && isEmbeddable && (platform === 'TikTok' || platform === 'Instagram' || platform === 'YouTube')) {
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                    <div className="text-blue-600">{icon}</div>
                    <span className="font-medium">{platform}</span>
                    {oEmbedData.title && (
                      <span className="text-xs text-gray-500 ml-2">- {oEmbedData.title}</span>
                    )}
                  </div>
                  <div 
                    ref={embedContainerRef}
                    className="w-full rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ 
                      minHeight: platform === 'YouTube' ? '400px' : platform === 'TikTok' ? '500px' : '400px',
                      backgroundColor: platform === 'TikTok' ? '#000' : '#fff'
                    }}
                  />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            // Show error state if oEmbed failed
            if (oEmbedError && isEmbeddable && (platform === 'TikTok' || platform === 'Instagram' || platform === 'YouTube')) {
              // Fallback to manual embed
              if (platform === 'YouTube') {
                const videoId = getYouTubeVideoId(url)
                if (videoId) {
                  return (
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                        <div className="text-blue-600">{icon}</div>
                        <span className="font-medium">{platform}</span>
                      </div>
                      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                      >
                        <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="break-all">{url}</span>
                      </a>
                    </div>
                  )
                }
              }
              
              // For TikTok and Instagram, show link if oEmbed fails
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                    <div className="text-blue-600">{icon}</div>
                    <span className="font-medium">{platform}</span>
                    <span className="text-xs text-red-500 ml-2">(Embed unavailable)</span>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            // Twitter/X Embed (using existing method)
            if (platform === 'Twitter/X' && isEmbeddable) {
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                    <div className="text-blue-600">{icon}</div>
                    <span className="font-medium">{platform}</span>
                  </div>
                  <div className="w-full bg-white rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '300px' }}>
                    <blockquote className="twitter-tweet" data-theme="light">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Loading tweet...
                      </a>
                    </blockquote>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            // Default: Try to display external websites in iframe, fallback to link
            // Check if this is a regular website (not PDF, not social media)
            const isRegularWebsite = !isPdfUrl(url) && !isEmbeddable
            
            if (isRegularWebsite && showWebsiteIframe && !websiteIframeError) {
              return (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <div className="text-blue-600">{icon}</div>
                      <span className="font-medium">{platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowWebsiteIframe(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Show as link
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                  <div className="w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative">
                    <iframe
                      ref={websiteIframeRef}
                      src={url}
                      className="w-full h-full border-0"
                      title="External Website"
                      style={{ minHeight: '600px' }}
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                      onError={() => setWebsiteIframeError(true)}
                      onLoad={() => {
                        // Reset error on successful load
                        setWebsiteIframeError(false)
                      }}
                    />
                    {websiteIframeError && (
                      <div className="absolute inset-0 bg-white flex items-center justify-center p-6">
                        <div className="text-center">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-sm text-gray-700 mb-2">
                            This website cannot be embedded due to security restrictions.
                          </p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Open in new tab
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs break-all underline flex items-start space-x-2"
                  >
                    <LinkIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{url}</span>
                  </a>
                </div>
              )
            }
            
            // Fallback: Show as link
            return (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <div className="text-blue-600">{icon}</div>
                    <span className="font-medium">{platform}</span>
                  </div>
                  {isRegularWebsite && (
                    <button
                      onClick={() => {
                        setShowWebsiteIframe(true)
                        setWebsiteIframeError(false)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Try iframe view
                    </button>
                  )}
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all underline flex items-start space-x-2"
                >
                  <LinkIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{url}</span>
                </a>
              </div>
            )
          })()}
        </div>
      )}
      
      {/* Legacy link field (for backward compatibility) */}
      {link && !url && (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
            <LinkIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium">External Link</span>
          </div>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
          >
            {link}
          </a>
        </div>
      )}
    </div>
  )
}

