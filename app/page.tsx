"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Music, Sparkles, Copy, Moon } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import FloatingLanterns from "@/components/floating-lanterns"
import MoonBackground from "@/components/moon-background"
import LionDance from "@/components/lion-dance"
import Fireworks from "@/components/fireworks"
import TraditionalParade from "@/components/traditional-parade"

interface ValidationResult {
  isValid: boolean
  generatedCode?: string
  errors?: string[]
  serviceInfo?: {
    name: string
    prefix: string
    format: string
  }
}

export default function OracleCodeGenerator() {
  const { toast } = useToast()
  const [serviceCode, setServiceCode] = useState("")
  const [shbg, setShbg] = useState("")
  const [pocode, setPocode] = useState("11022")
  const [recnational, setRecnational] = useState("")
  const [isPackageIncident, setIsPackageIncident] = useState("0")
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"validate" | "generate">("validate")

  const serviceOptions = [
    { value: "RTN", label: "RTN - Bưu phẩm đảm bảo" },
    { value: "CTN", label: "CTN - Bưu kiện trong nước" },
    { value: "PTN", label: "PTN - Logistic" },
    { value: "ETN", label: "ETN - EMS" },
    { value: "TDT001", label: "TDT001 - TMDT" },
    { value: "TDT002", label: "TDT002 - TMDT" },
    { value: "TDT003", label: "TDT003 - TMDT > 30KG" },
    { value: "TDT004", label: "TDT004 - TMDT < 30kg" },
    { value: "KT1", label: "KT1 - Kiện tổng hợp" },
    { value: "TQT006", label: "TQT006" },
    { value: "VNQ", label: "VNQ" },
    { value: "PRM004", label: "PRM004" },
    { value: "PRM", label: "PRM" },
    { value: "CQT001", label: "CQT001" },
    { value: "EQT", label: "EQT" },
    { value: "CQT002", label: "CQT002" },
    { value: "CQT003", label: "CQT003" },
    { value: "CQT006", label: "CQT006" },
    { value: "LQT005", label: "LQT005" },
    { value: "LQT", label: "LQT" },
    { value: "RQT001", label: "RQT001" },
    { value: "RQT002", label: "RQT002" },
    { value: "RQT003", label: "RQT003" },
    { value: "RQT004", label: "RQT004" },
    { value: "RQT005", label: "RQT005" },
    { value: "RQT006", label: "RQT006" },
    { value: "UPS", label: "UPS" },
    { value: "DHL", label: "DHL" },
    { value: "HCC001", label: "HCC001" },
    { value: "HCC002", label: "HCC002" },
    { value: "HCC003", label: "HCC003" },
    { value: "HCC004", label: "HCC004" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === "validate" ? "/api/validate" : "/api/generate"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceCode,
          shbg: mode === "validate" ? shbg : undefined,
          pocode,
          recnational,
          isPackageIncident,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error:", error)
      setResult({
        isValid: false,
        errors: ["Lỗi kết nối đến server"],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen festival-gradient relative overflow-hidden">
      <FloatingLanterns />
      <MoonBackground />
      <LionDance />
      <Fireworks />
      <TraditionalParade />
      <Toaster />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6 p-4">
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl animate-bounce">🦁</span>
            <Moon className="h-12 w-12 text-yellow-300 moon-glow" />
            <span className="text-5xl lantern-float">🏮</span>
            <Music className="h-10 w-10 text-red-200 lantern-float" />
            <span className="text-4xl sparkle">🥮</span>
            <Sparkles className="h-8 w-8 text-orange-300 sparkle" />
            <span className="text-5xl animate-pulse">🎆</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl text-balance">
            🦁 Lễ Hội Trung Thu 🏮 Rước Kiệu 🥮
          </h1>

          <p className="text-xl md:text-2xl text-yellow-100 drop-shadow-lg font-medium">
            🎭 Chú Tếu và các em nhỏ cùng nhau tham gia đêm hội trăng rằm 👶
          </p>

          <div className="flex items-center justify-center gap-2 text-orange-200 flex-wrap">
            <span className="text-3xl animate-bounce">🦁</span>
            <Sparkles className="h-5 w-5 sparkle" />
            <span className="text-lg">Múa lân - Rước đèn - Bánh trung thu - Pháo hoa</span>
            <span className="text-3xl animate-pulse">🎆</span>
            <Sparkles className="h-5 w-5 sparkle" style={{ animationDelay: "0.5s" }} />
            <span className="text-3xl lantern-float">🏮</span>
          </div>

          <div className="bg-gradient-to-r from-red-500/20 to-orange-400/20 rounded-xl p-4 backdrop-blur-sm border-2 border-yellow-300/50">
            <div className="flex items-center justify-center gap-4 text-2xl">
              <span className="animate-bounce">👶</span>
              <span className="text-yellow-200">Các em nhỏ cùng Chú Tếu</span>
              <span className="animate-bounce">🎭</span>
              <span className="text-yellow-200">tham gia lễ hội</span>
              <span className="animate-bounce">👧</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card/95 backdrop-blur-md border-4 border-red-300/70 shadow-2xl hover:shadow-red-400/30 transition-all duration-300 hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-orange-500"></div>
            <CardHeader className="bg-gradient-to-r from-red-500/30 to-orange-400/30 rounded-t-lg relative">
              <div className="absolute -top-1 -right-1 text-3xl animate-spin-slow">🏮</div>
              <div className="absolute -top-1 -left-1 text-2xl animate-bounce">🥮</div>
              <CardTitle className="flex items-center gap-2 text-card-foreground text-xl font-bold">
                <span className="text-3xl animate-bounce">🦁</span>
                <Music className="h-6 w-6 text-primary lantern-float" />
                Thông tin đầu vào
                <span className="text-2xl sparkle">🎆</span>
                <Sparkles className="h-4 w-4 text-accent sparkle" />
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                🎭 Nhập thông tin để {mode === "validate" ? "kiểm tra" : "sinh mã"} vận đơn trong đêm hội trăng rằm cùng
                các em nhỏ 👶
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === "validate" ? "default" : "outline"}
                  onClick={() => setMode("validate")}
                  size="sm"
                  className="hover:scale-110 transition-all duration-300 font-bold text-lg px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-2 border-yellow-300 shadow-lg"
                >
                  🔍 Kiểm tra mã
                </Button>
                <Button
                  variant={mode === "generate" ? "default" : "outline"}
                  onClick={() => setMode("generate")}
                  size="sm"
                  className="hover:scale-110 transition-all duration-300 font-bold text-lg px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white border-2 border-red-300 shadow-lg"
                >
                  ✨ Sinh mã mới
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="serviceCode"
                    className="text-card-foreground font-bold text-lg flex items-center gap-2"
                  >
                    🎭 Service Code <span className="text-destructive text-xl">*</span>
                    <span className="text-sm animate-pulse">🏮</span>
                  </Label>
                  <Select value={serviceCode} onValueChange={setServiceCode} required>
                    <SelectTrigger className="bg-input border-2 border-orange-300 hover:border-red-400 transition-colors duration-200 text-lg font-medium h-12">
                      <SelectValue placeholder="🦁 Chọn loại dịch vụ cho đêm hội trăng rằm 🥮" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-orange-300">
                      {serviceOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="hover:bg-accent/20 text-lg font-medium"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mode === "validate" && (
                  <div className="space-y-2">
                    <Label htmlFor="shbg" className="text-card-foreground font-bold text-lg flex items-center gap-2">
                      🏮 Mã vận đơn (SHBG) <span className="text-destructive text-xl">*</span>
                      <span className="text-sm animate-bounce">🎆</span>
                    </Label>
                    <Input
                      id="shbg"
                      value={shbg}
                      onChange={(e) => setShbg(e.target.value.toUpperCase())}
                      placeholder="🦁 Nhập mã vận đơn cần kiểm tra trong đêm hội"
                      required
                      className="bg-input border-2 border-orange-300 hover:border-red-400 transition-colors duration-200 text-lg font-medium h-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pocode" className="text-card-foreground font-bold text-lg flex items-center gap-2">
                    🏢 Mã bưu cục (PO Code) <span className="text-destructive text-xl">*</span>
                    <span className="text-sm animate-pulse">🥮</span>
                  </Label>
                  <Input
                    id="pocode"
                    value={pocode}
                    onChange={(e) => setPocode(e.target.value)}
                    placeholder="🎭 Mã bưu cục cho lễ hội"
                    required
                    className="bg-input border-2 border-orange-300 hover:border-red-400 transition-colors duration-200 text-lg font-medium h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="recnational"
                    className="text-card-foreground font-bold text-lg flex items-center gap-2"
                  >
                    🌏 Quốc gia nhận
                    <span className="text-sm lantern-float">🏮</span>
                  </Label>
                  <Input
                    id="recnational"
                    value="VN"
                    onChange={(e) => setRecnational("VN")}
                    placeholder="VN, CN, TW, US..."
                    className="bg-input border-2 border-orange-300 hover:border-red-400 transition-colors duration-200 text-lg font-medium h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="isPackageIncident"
                    className="text-card-foreground font-bold text-lg flex items-center gap-2"
                  >
                    ⚠️ Bưu gửi sự vụ
                    <span className="text-sm sparkle">🎆</span>
                  </Label>
                  <Select value={isPackageIncident} onValueChange={setIsPackageIncident}>
                    <SelectTrigger className="bg-input border-2 border-orange-300 hover:border-red-400 transition-colors duration-200 text-lg font-medium h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-2 border-orange-300">
                      <SelectItem value="0" className="text-lg font-medium">
                        Không
                      </SelectItem>
                      <SelectItem value="1" className="text-lg font-medium">
                        Có
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-700 hover:via-orange-600 hover:to-yellow-600 text-white font-bold py-4 text-xl hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-red-500/50 border-4 border-yellow-300"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xl">🎭 Đang xử lý trong đêm hội...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span className="text-2xl animate-bounce">🦁</span>
                      {mode === "validate" ? "🔍 Kiểm tra mã trong ánh trăng" : "✨ Sinh mã mới cho lễ hội"}
                      <span className="text-2xl sparkle">🎆</span>
                      <Sparkles className="h-6 w-6" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-md border-4 border-yellow-300/70 shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-400 to-orange-500"></div>
            <CardHeader className="bg-gradient-to-r from-yellow-400/30 to-orange-300/30 rounded-t-lg relative">
              <div className="absolute -top-1 -right-1 text-3xl animate-bounce">🥮</div>
              <div className="absolute -top-1 -left-1 text-2xl animate-spin-slow">🎆</div>
              <CardTitle className="text-card-foreground flex items-center gap-2 text-xl font-bold">
                <span className="text-3xl animate-pulse">🎊</span>
                Kết quả
                <span className="text-2xl lantern-float">🏮</span>
                <Moon className="h-5 w-5 text-accent moon-glow" />
                <span className="text-2xl sparkle">👶</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                🎭 Kết quả {mode === "validate" ? "kiểm tra" : "sinh mã"} sẽ hiển thị trong ánh trăng cùng các em nhỏ 👧
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="h-8 w-8 text-green-500 sparkle" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500" />
                    )}
                    <Badge
                      variant={result.isValid ? "default" : "destructive"}
                      className="text-lg font-bold px-4 py-2 border-2 border-yellow-300"
                    >
                      {result.isValid ? "✅ Hợp lệ - Chú Tếu vui mừng! 🎭" : "❌ Không hợp lệ - Cần kiểm tra lại 😢"}
                    </Badge>
                  </div>

                  {result.generatedCode && (
                    <div className="space-y-2">
                      <Label className="text-card-foreground font-bold text-lg flex items-center gap-2">
                        🎫 Mã được sinh trong đêm hội:
                        <span className="text-sm animate-bounce">🦁</span>
                      </Label>
                      <div className="p-6 bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 rounded-xl font-mono text-xl flex items-center justify-between border-4 border-yellow-400 shadow-2xl">
                        <span className="text-gray-800 font-bold text-2xl">{result.generatedCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.generatedCode || "")
                            toast({
                              title: "🎉 Đã sao chép thành công!",
                              description: "🦁 Mã đã được sao chép vào clipboard cho lễ hội.",
                            })
                          }}
                          className="ml-4 p-3 text-primary hover:text-primary/80 hover:scale-125 transition-all duration-300 rounded-full hover:bg-primary/20 border-2 border-red-300"
                        >
                          <Copy className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  )}

                  {result.serviceInfo && (
                    <div className="space-y-2">
                      <Label className="text-card-foreground font-medium">📋 Thông tin dịch vụ:</Label>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg space-y-2 border-2 border-blue-200/50">
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-800">🏷️ Tên:</strong>
                          <span className="text-blue-700">{result.serviceInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-800">🔤 Tiền tố:</strong>
                          <span className="text-blue-700 font-mono">{result.serviceInfo.prefix}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="text-blue-800">📐 Định dạng:</strong>
                          <span className="text-blue-700 font-mono">{result.serviceInfo.format}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-card-foreground font-bold text-lg flex items-center gap-2">
                        ⚠️ Lỗi:
                        <span className="text-sm animate-pulse">😢</span>
                      </Label>
                      <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border-4 border-red-300">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-red-700 flex items-center gap-2 text-lg font-medium">
                            <span className="text-red-500 text-xl">•</span> {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12 space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-6xl animate-bounce">🦁</span>
                    <Moon className="h-20 w-20 mx-auto text-accent/50 moon-glow" />
                    <span className="text-6xl lantern-float">🏮</span>
                  </div>
                  <p className="text-xl font-medium">
                    {mode === "validate"
                      ? "🏮 Nhập mã vận đơn để kiểm tra cùng Chú Tếu trong ánh trăng 🎭"
                      : "✨ Chọn dịch vụ để sinh mã mới cho đêm hội trung thu 🥮"}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-lg">
                    <span className="animate-bounce">👶</span>
                    <span>Các em nhỏ đang chờ đợi</span>
                    <span className="animate-bounce">👧</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center py-8 space-y-4">
          <div className="flex items-center justify-center gap-4 text-4xl">
            <span className="animate-bounce">🦁</span>
            <span className="lantern-float">🏮</span>
            <span className="sparkle">🥮</span>
            <span className="animate-pulse">🎆</span>
            <span className="animate-bounce">👶</span>
            <span className="lantern-float">🎭</span>
            <span className="sparkle">👧</span>
          </div>
          <p className="text-yellow-100 text-xl drop-shadow-lg font-bold">
            🌙 Chúc mừng Tết Trung Thu - Đoàn viên hạnh phúc cùng gia đình 🏮
          </p>
          <p className="text-orange-200 text-lg drop-shadow-lg">
            🦁 Múa lân rồng - Rước kiệu - Bánh trung thu - Pháo hoa rực rỡ 🎆
          </p>
        </div>
      </div>
    </div>
  )
}
