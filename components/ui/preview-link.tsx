"use client"

import * as React from "react"
import { useLinkPreview } from "@/components/ui/link-preview-panel"
import { cn } from "@/lib/utils"

interface PreviewLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  title?: string
  children: React.ReactNode
  openInPanel?: boolean
}

export function PreviewLink({ 
  href, 
  title, 
  children, 
  openInPanel = true,
  className,
  ...props 
}: PreviewLinkProps) {
  const { openLinkPreview } = useLinkPreview()

  // Check if the link is a PDF or other file that should open in a new tab
  const isFile = href && (
    href.match(/\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|txt|rtf|zip|rar|jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
    href.includes('edgestore') ||
    href.includes('utfs.io')
  )

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a file (PDF, etc.), always open in new tab
    if (isFile && href) {
      e.preventDefault()
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
    
    // Otherwise, use the panel if enabled
    if (openInPanel && href) {
      e.preventDefault()
      openLinkPreview(href, title)
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      target={isFile ? "_blank" : undefined}
      rel={isFile ? "noopener noreferrer" : undefined}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </a>
  )
}





