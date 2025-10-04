"use client"

import type React from "react"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin, Send, Bot, User } from "lucide-react"

export default function FireAnalysisChat() {
  const [inputValue, setInputValue] = useState("")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && status !== "in_progress" as any) {
      sendMessage({ text: inputValue })
      setInputValue("")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Map Area */}
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Área del Mapa</h2>
            <p className="text-muted-foreground text-sm">Contenedor listo para integración con Leaflet o Mapbox</p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-96 border-l border-border flex flex-col bg-card">
        {/* Chat Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-card-foreground">Chat</h1>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <Card className="p-3 bg-muted">
                  <p className="text-sm text-muted-foreground">¡Hola! ¿En qué puedo ayudarte hoy?</p>
                </Card>
                <p className="text-xs text-muted-foreground mt-1">14:46</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user" ? "bg-secondary" : "bg-primary"
                  }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-secondary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Card className={`p-3 ${message.role === "user" ? "bg-secondary" : "bg-muted"}`}>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <p key={index} className="text-sm whitespace-pre-wrap">
                          {part.text}
                        </p>
                      )
                    }
                    return null
                  })}
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {status === "in_progress" as any && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <Card className="p-3 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={status === "in_progress" as any}
              className="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim() || status === "in_progress" as any} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
