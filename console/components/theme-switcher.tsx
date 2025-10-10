"use client"

import { useState, useEffect } from "react"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { themes, applyTheme, getStoredTheme, setStoredTheme } from "@/lib/themes"

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string>("cyan")

  useEffect(() => {
    const stored = getStoredTheme()
    setCurrentTheme(stored)
    applyTheme(stored)
  }, [])

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId)
    setStoredTheme(themeId)
    applyTheme(themeId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(themes).map(([id, theme]) => (
          <DropdownMenuItem
            key={id}
            onClick={() => handleThemeChange(id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span>{theme.name}</span>
            </div>
            {currentTheme === id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
