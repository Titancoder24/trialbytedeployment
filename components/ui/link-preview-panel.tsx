"use client"

import * as React from "react"
import { X, ExternalLink, Maximize2, Minimize2, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface LinkPreviewPanelProps {
  url: string | null
  onClose: () => void
  title?: string
}

export function LinkPreviewPanel({ url, onClose, title }: LinkPreviewPanelProps) {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showTroubleshooting, setShowTroubleshooting] = React.useState(false)

  React.useEffect(() => {
    if (url) {
      setIsLoading(true)
      setShowTroubleshooting(false)
      // Show troubleshooting tips if content doesn't seem to load or if it takes too long
      const timer = setTimeout(() => {
        setShowTroubleshooting(true)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [url])

  const handleOpenExternal = () => {
    if (url) window.open(url, '_blank')
  }

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0 transition-all duration-300 overflow-hidden border-none shadow-2xl rounded-xl",
          isMaximized
            ? "max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh]"
            : "max-w-5xl w-[92vw] h-[85vh] max-h-[85vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-white space-y-0 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-blue-50 rounded-lg shrink-0">
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle className="font-semibold text-base text-gray-900 truncate">
              {title || "Link Preview"}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full shrink-0"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenExternal}
              className="h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full shrink-0"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-6 bg-gray-200 mx-1 shrink-0" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0"
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* URL Bar */}
        <div className="px-6 py-2 border-b bg-gray-50 shrink-0 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-gray-200 text-sm text-gray-500 overflow-hidden shadow-sm">
            <span className="text-gray-300 shrink-0">https://</span>
            <span className="truncate">{url?.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-slate-100 flex flex-col min-h-0 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-600">Loading preview...</p>
            </div>
          )}

          {url && (
            <iframe
              src={url}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title={title || "Link Preview"}
            />
          )}

          {/* Troubleshooting overlay */}
          {showTroubleshooting && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-lg bg-white border border-blue-100 shadow-xl rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-4">
                <div className="bg-blue-50 p-2 rounded-full h-fit shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-900">Preview not loading?</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Some websites (like Google or PubMed) prevent being displayed inside other apps for security.
                      If you see a "refused to connect" message, please open it in a new window.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleOpenExternal}
                      className="bg-[#204B73] hover:bg-[#204B73]/90 text-white shadow-sm h-8"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open in New Tab
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowTroubleshooting(false)}
                      className="h-8 text-gray-500 hover:bg-gray-100"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Context for managing the link preview panel globally
interface LinkPreviewContextType {
  openUrl: string | null
  openTitle: string | null
  openLinkPreview: (url: string, title?: string) => void
  closeLinkPreview: () => void
}

const LinkPreviewContext = React.createContext<LinkPreviewContextType | undefined>(undefined)

export function LinkPreviewProvider({ children }: { children: React.ReactNode }) {
  const [openUrl, setOpenUrl] = React.useState<string | null>(null)
  const [openTitle, setOpenTitle] = React.useState<string | null>(null)

  const openLinkPreview = React.useCallback((url: string, title?: string) => {
    setOpenUrl(url)
    setOpenTitle(title || null)
  }, [])

  const closeLinkPreview = React.useCallback(() => {
    setOpenUrl(null)
    setOpenTitle(null)
  }, [])

  return (
    <LinkPreviewContext.Provider value={{ openUrl, openTitle, openLinkPreview, closeLinkPreview }}>
      {children}
      <LinkPreviewPanel url={openUrl} onClose={closeLinkPreview} title={openTitle || undefined} />
    </LinkPreviewContext.Provider>
  )
}

export function useLinkPreview() {
  const context = React.useContext(LinkPreviewContext)
  if (context === undefined) {
    throw new Error('useLinkPreview must be used within a LinkPreviewProvider')
  }
  return context
}

