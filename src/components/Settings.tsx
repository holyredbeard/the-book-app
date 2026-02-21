import { useState } from 'react'
import { X, Key, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSettingsStore } from '@/store/settingsStore'
import { useConversationStore } from '@/store/conversationStore'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { deepseekApiKey, setDeepseekApiKey, clearSettings } = useSettingsStore()
  const { clearConversations, conversations } = useConversationStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(deepseekApiKey)

  if (!isOpen) return null

  const handleSaveApiKey = () => {
    setDeepseekApiKey(apiKeyInput)
    toast.success('API-nyckel sparad')
    onClose()
  }

  const handleClearArchive = () => {
    if (confirm('Är du säker på att du vill rensa hela arkivet? Detta kan inte ångras.')) {
      clearConversations()
      toast.success('Arkivet har rensats')
    }
  }

  const handleClearSettings = () => {
    if (confirm('Är du säker på att du vill rensa alla inställningar?')) {
      clearSettings()
      setApiKeyInput('')
      toast.success('Inställningar har rensats')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed inset-y-0 right-0 w-full max-w-lg border-l bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Inställningar</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* DeepSeek API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  DeepSeek API-nyckel
                </CardTitle>
                <CardDescription>
                  Krävs för AI-funktionen. Hämta din nyckel från{' '}
                  <a 
                    href="https://platform.deepseek.com/api_keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    DeepSeek Platform
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API-nyckel</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
                      Spara
                    </Button>
                  </div>
                </div>
                {deepseekApiKey && (
                  <p className="text-sm text-green-500">
                    ✓ API-nyckel konfigurerad
                  </p>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Archive info */}
            <Card>
              <CardHeader>
                <CardTitle>Arkiv</CardTitle>
                <CardDescription>
                  Hantera ditt laddade ChatGPT-arkiv
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Laddade konversationer</p>
                    <p className="text-sm text-muted-foreground">
                      {conversations.length} konversationer
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleClearArchive}
                    disabled={conversations.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Rensa arkiv
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Danger zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Farozon</CardTitle>
                <CardDescription>
                  Dessa åtgärder kan inte ångras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleClearSettings}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Rensa alla inställningar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <p className="text-xs text-muted-foreground text-center">
              Chat Archive Manager – Bokhjälp v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
