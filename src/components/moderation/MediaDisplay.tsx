'use client'

import React, { useState, useEffect } from 'react'
import { LinkIcon } from '@/components/ui/Icons'

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

  // Reset file error when fileUrl changes
  useEffect(() => {
    setFileError(false)
  }, [fileUrl])

  // Load embed scripts when URL changes
  useEffect(() => {
    if (!url) return

    const { platform } = getPlatformFromUrl(url)

    // Load TikTok embed script
    if (platform === 'TikTok') {
      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
        if (existingScript) {
          document.body.removeChild(existingScript)
        }
      }
    }

    // Load Instagram embed script
    if (platform === 'Instagram') {
      const script = document.createElement('script')
      script.src = '//www.instagram.com/embed.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        const existingScript = document.querySelector('script[src="//www.instagram.com/embed.js"]')
        if (existingScript) {
          document.body.removeChild(existingScript)
        }
      }
    }

    // Load Twitter embed script
    if (platform === 'Twitter/X') {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      document.body.appendChild(script)

      return () => {
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
        if (existingScript) {
          document.body.removeChild(existingScript)
        }
      }
    }
  }, [url])

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
            const { platform, icon, isEmbeddable } = getPlatformFromUrl(url)
            
            // YouTube Embed
            if (platform === 'YouTube' && isEmbeddable) {
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
            
            // TikTok Embed
            if (platform === 'TikTok' && isEmbeddable) {
              const videoId = getTikTokVideoId(url)
              if (videoId) {
                return (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                      <div className="text-blue-600">{icon}</div>
                      <span className="font-medium">{platform}</span>
                    </div>
                    <div className="w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                      <blockquote
                        className="tiktok-embed"
                        cite={url}
                        data-video-id={videoId}
                        style={{ maxWidth: '100%', minWidth: '325px' }}
                      >
                        <section>
                          <a
                            target="_blank"
                            title={`@${videoId}`}
                            href={url}
                            rel="noopener noreferrer"
                          >
                            View on TikTok
                          </a>
                        </section>
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
            }
            
            // Instagram Embed
            if (platform === 'Instagram' && isEmbeddable) {
              const postId = getInstagramPostId(url)
              if (postId) {
                return (
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                      <div className="text-blue-600">{icon}</div>
                      <span className="font-medium">{platform}</span>
                    </div>
                    <div className="w-full bg-white rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px' }}>
                      <blockquote
                        className="instagram-media"
                        data-instgrm-permalink={url}
                        data-instgrm-version="14"
                        style={{ background: '#FFF', border: 0, borderRadius: '3px', margin: 1, maxWidth: '100%', minWidth: '326px', padding: 0, width: '99.375%' }}
                      >
                        <div style={{ padding: '16px' }}>
                          <a
                            href={url}
                            style={{ background: '#FFFFFF', lineHeight: 0, padding: '0 0', textAlign: 'center', textDecoration: 'none', width: '100%' }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Instagram
                          </a>
                        </div>
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
            }
            
            // Twitter/X Embed
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
            
            // Default: Show as link for non-embeddable content
            return (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="text-blue-600">{icon}</div>
                  <span className="font-medium">{platform}</span>
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

