"use client"

import type React from "react"
import { useEffect } from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Code, Copy, Download, History, Trash2, Beer, Coffee } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import TextType from "@/components/TextType"
import PetRunner from "./PetRunner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface HistoryItem {
  id: string
  code: string
  serviceCode: string
  timestamp: Date
  type: "validate" | "generate"
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
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkCount, setBulkCount] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [cancelBulk, setCancelBulk] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [logs, setLogs] = useState("")

  useEffect(() => {
    const savedHistory = localStorage.getItem("postal-code-history")
    const admin: any = localStorage.getItem("postal-admin")
    setLogs(admin != null ? admin : "")
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setHistory(parsedHistory)
      } catch (error) {
        console.error("Error loading history:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("postal-code-history", JSON.stringify(history))
  }, [history])

  const addToHistory = (code: string, serviceCode: string, type: "validate" | "generate") => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      code,
      serviceCode,
      timestamp: new Date(),
      type,
    }
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]) // Keep only latest 50 items
  }

  const clearHistory = () => {
    setHistory([])
    toast({
      title: "Đã xóa",
      description: "Lịch sử đã được xóa sạch.",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép",
      description: "Mã đã được sao chép vào clipboard.",
    })
  }

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

  const handleBulkGenerate = async () => {
    if (!serviceCode) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn Service Code trước.",
        variant: "destructive",
      })
      return
    }

    if (!bulkCount || Number.parseInt(bulkCount) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số lượng hợp lệ.",
        variant: "destructive",
      })
      return
    }

    setBulkLoading(true)
    setBulkProgress(0)
    setCancelBulk(false)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const count = Number.parseInt(bulkCount)
      const codes: string[] = []

      for (let i = 0; i < count; i++) {
        if (cancelBulk) {
          console.log("Bulk generation cancelled before fetch")
          break
        }

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceCode,
            pocode,
            recnational,
            isPackageIncident,
          }),
          signal: controller.signal, // ⬅️ truyền signal vào fetch
        })

        const data = await response.json()
        if (data.isValid && data.generatedCode) {
          codes.push(data.generatedCode)
          addToHistory(data.generatedCode, serviceCode, "generate")
        }

        const progress = Math.round(((i + 1) / count) * 100)
        setBulkProgress(progress)
      }

      if (!cancelBulk && codes.length > 0) {
        const csvContent = "data:text/csv;charset=utf-8," + codes.join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `van-don-${serviceCode}-${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Thành công",
          description: `Đã sinh ${codes.length} mã vận đơn và tải xuống file Excel.`,
        })
      }

      // setShowBulkModal(false)
      setBulkCount("")
      setBulkProgress(0)
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted")
      } else {
        console.error("Error:", error)
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi sinh mã hàng loạt.",
          variant: "destructive",
        })
      }
    } finally {
      setBulkLoading(false)
    }
  }

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

      if (data.isValid && (data.generatedCode || shbg)) {
        const codeToSave = data.generatedCode || shbg
        addToHistory(codeToSave, serviceCode, mode)
      }
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
      <div className="min-h-screen street-pattern bg-background p-4">
        <PetRunner />
        <Toaster />
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4 py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="lantern-glow rounded-full p-2">
                <Beer className="h-10 w-10 text-primary animate-bounce" />
              </div>
              <span className="text-3xl">🥜</span>
              <Coffee className="h-8 w-8 text-secondary" />
              <span className="text-3xl">🪑</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground font-playfair flex items-center justify-center gap-3">
              <span className="text-primary text-5xl">🍺</span>
              <TextType
                  text={["Quán Bia Vỉa Hè", "Sinh Mã Vận Đơn", "Đậu Lạc & Code 🥜"]}
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor={true}
                  cursorCharacter="|"
              />
              <span className="text-secondary text-4xl lantern-glow rounded-full p-1">🏮</span>
            </h1>
            <p className="text-lg text-muted-foreground font-source">
              Ngồi ghế nhựa đỏ, nhâm nhi bia lạnh, sinh mã vận đơn - Đậu lạc tẩm hành cho thêm ngon! 🥜🍺🪑
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-2xl">
              <span title="Đĩa lạc">🥜</span>
              <span title="Thuốc lào">🚬</span>
              <span title="Ghế nhựa đỏ">🪑</span>
              <span title="Bàn nhựa">🪑</span>
              <span title="Đậu tẩm hành">🫘</span>
              <span title="Bia lạnh">🧊</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="beer-shadow border-2 border-primary/20 bg-card/95 backdrop-blur-sm vendor-cart">
              <CardHeader className="plastic-table rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-primary font-playfair">
                  <Code className="h-5 w-5" />🍺 Quầy Bia Vỉa Hè
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gọi món và {mode === "validate" ? "kiểm tra" : "pha chế"} mã vận đơn - Có đậu lạc kèm theo! 🥜
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex gap-2 mb-4">
                  <Button
                      variant={mode === "validate" ? "default" : "outline"}
                      onClick={() => setMode("validate")}
                      size="sm"
                      className="plastic-chair-red hover:scale-105 transition-transform"
                  >
                    🔍 Kiểm Tra
                  </Button>
                  <Button
                      variant={mode === "generate" ? "default" : "outline"}
                      onClick={() => setMode("generate")}
                      size="sm"
                      className="peanut-brown hover:scale-105 transition-transform"
                  >
                    ✨ Pha Mới
                  </Button>
                  <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-400 text-purple-700 hover:bg-purple-50 bg-transparent"
                      >
                        🚀 Hàng Loạt
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-playfair">
                          <Download className="h-5 w-5" />🍺 Bia Hàng Loạt - Cả Thùng Luôn!
                        </DialogTitle>
                        <DialogDescription>
                          Gọi cả thùng bia một lúc - Nhập số lượng và tải file Excel 📊🥜
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bulkCount">Số lượng cần tạo</Label>
                          <Input
                              id="bulkCount"
                              type="number"
                              min="1"
                              max="1000"
                              value={bulkCount}
                              onChange={(e) => setBulkCount(e.target.value)}
                              placeholder="Nhập số lượng (tối đa 1000)"
                              disabled={bulkLoading}
                              className="border-primary/30 focus:border-primary"
                          />
                        </div>
                        {bulkLoading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Đang pha chế...</span>
                                <span>{bulkProgress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${bulkProgress}%` }}
                                ></div>
                              </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                              onClick={handleBulkGenerate}
                              disabled={bulkLoading}
                              className="flex-1 bg-primary hover:bg-primary/90"
                          >
                            {bulkLoading ? `Đang pha... ${bulkProgress}%` : "🍺 Pha & Tải"}
                          </Button>
                          <Button
                              variant="outline"
                              onClick={() => {
                                setCancelBulk(true)
                                abortController?.abort()

                                setBulkLoading(false)
                                setBulkProgress(0)
                                setBulkCount("")

                                toast({
                                  title: "Đã hủy",
                                  description: "Dừng pha chế hàng loạt.",
                                })

                                setShowBulkModal(false)
                                setTimeout(() => setCancelBulk(false), 100)
                              }}
                              className="border-destructive text-destructive hover:bg-destructive/10"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCode" className="text-foreground font-semibold">
                      🏷️ Loại Dịch Vụ <span className="text-destructive">*</span>
                    </Label>
                    <Select value={serviceCode} onValueChange={setServiceCode} required>
                      <SelectTrigger className="border-primary/30 focus:border-primary">
                        <SelectValue placeholder="Chọn loại như chọn bia" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {mode === "validate" && (
                      <div className="space-y-2">
                        <Label htmlFor="shbg" className="text-foreground font-semibold">
                          📦 Mã Vận Đơn (SHBG) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="shbg"
                            value={shbg}
                            onChange={(e) => setShbg(e.target.value.toUpperCase())}
                            placeholder="Nhập mã cần kiểm tra"
                            required
                            className="border-primary/30 focus:border-primary"
                        />
                      </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pocode" className="text-foreground font-semibold">
                      🏪 Mã Bưu Cục <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="pocode"
                        value={pocode}
                        onChange={(e) => setPocode(e.target.value)}
                        placeholder="Mã bưu cục"
                        required
                        className="border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recnational" className="text-foreground font-semibold">
                      🌏 Quốc Gia
                    </Label>
                    <Input
                        id="recnational"
                        value={"VN"}
                        onChange={(e) => setRecnational("VN")}
                        placeholder="VN, CN, TW, US..."
                        className="border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isPackageIncident" className="text-foreground font-semibold">
                      ⚠️ Bưu Gửi Sự Vụ
                    </Label>
                    <Select value={isPackageIncident} onValueChange={setIsPackageIncident}>
                      <SelectTrigger className="border-primary/30 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không</SelectItem>
                        <SelectItem value="1">Có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                      type="submit"
                      className="w-full font-semibold"
                      disabled={loading}
                  >
                    {loading ? "Đang pha chế... 🍺" : mode === "validate" ? "🔍 Kiểm Tra Ngay" : "✨ Tạo Mã Mới"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="beer-shadow border-2 border-secondary/20 bg-card/95 backdrop-blur-sm plastic-table">
              <CardHeader className="lantern-glow rounded-t-lg backdrop-blur-sm">
                <CardTitle className="text-secondary font-playfair">🎯 Kết Quả - Món Đã Pha</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ly bia (mã vận đơn) đã {mode === "validate" ? "kiểm tra" : "pha chế"} xong rồi đây! 🍺
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {result ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {result.isValid ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                            <XCircle className="h-6 w-6 text-destructive" />
                        )}
                        <Badge
                            variant={result.isValid ? "default" : "destructive"}
                            className={result.isValid ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {result.isValid ? "✅ Ngon Lành" : "❌ Có Vấn Đề"}
                        </Badge>
                      </div>

                      {result.generatedCode && (
                          <div className="space-y-2">
                            <Label className="text-foreground font-semibold">🎫 Mã Vừa Tạo:</Label>
                            <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg font-mono text-lg flex items-center justify-between">
                              <span className="text-primary font-bold">{result.generatedCode}</span>
                              <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(result.generatedCode || "")
                                    toast({
                                      title: "🍺 Đã Copy!",
                                      description: "Mã đã sao chép - Uống bia thôi!",
                                    })
                                  }}
                                  className="ml-4 text-primary hover:text-primary/80 transition-colors"
                              >
                                <Copy className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                      )}

                      {result.serviceInfo && (
                          <div className="space-y-2">
                            <Label className="text-foreground font-semibold">📋 Thông Tin Dịch Vụ:</Label>
                            <div className="p-4 bg-secondary/10 border-2 border-secondary/30 rounded-lg space-y-2">
                              <div>
                                <strong>Tên:</strong> {result.serviceInfo.name}
                              </div>
                              <div>
                                <strong>Tiền tố:</strong> {result.serviceInfo.prefix}
                              </div>
                              <div>
                                <strong>Định dạng:</strong> {result.serviceInfo.format}
                              </div>
                            </div>
                          </div>
                      )}

                      {result.errors && result.errors.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-destructive font-semibold">⚠️ Lỗi:</Label>
                            <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                              {result.errors.map((error, index) => (
                                  <div key={index} className="text-destructive">
                                    • {error}
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Beer className="h-16 w-16 text-primary/50" />
                        <span className="text-4xl opacity-30">🥜</span>
                        <span className="text-4xl opacity-30">🪑</span>
                      </div>
                      <p className="text-lg font-playfair">🍺 Quán còn trống - Chưa có ai ngồi</p>
                      <p className="text-sm mt-2">Tạo mã đầu tiên để mở quán bia vỉa hè! Có đậu lạc tẩm hành đấy! 🥜</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="beer-shadow border-2 border-accent/20 vendor-cart backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-3 left-3 text-3xl lantern-glow rounded-full p-1">🍺</div>
            <div className="absolute top-3 right-3 text-3xl lantern-glow rounded-full p-1">🏮</div>
            <div className="absolute bottom-3 left-3 text-3xl">🥜</div>
            <div className="absolute bottom-3 right-3 text-3xl">🪑</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl opacity-5">
              🫘
            </div>

            <CardHeader className="plastic-table rounded-t-lg backdrop-blur-sm relative z-10">
              <CardTitle className="flex items-center justify-between text-accent font-playfair text-xl">
                <div className="flex items-center gap-2">
                  <History className="h-6 w-6" />🍻 Sổ Quán Bia Vỉa Hè
                </div>
                {history.length > 0 && logs === "adminnek" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHistory}
                        className="plastic-chair-red hover:scale-105 transition-transform bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Dọn Bàn
                    </Button>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Những ly bia (mã vận đơn) đã nhâm nhi - Kèm đậu lạc tẩm hành! 🥜🍺 (Tối đa 50 ly)
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 max-h-96 overflow-y-auto relative z-10">
              {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-4 plastic-table rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:lantern-glow transition-all duration-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                  className={`text-xs font-semibold ${
                                      item.type === "generate"
                                          ? "peanut-brown border-amber-600"
                                          : "plastic-chair-red border-red-600"
                                  }`}
                              >
                                {item.type === "generate" ? "🍺 Pha Mới" : "🔍 Kiểm Tra"}
                              </Badge>
                              <Badge variant="outline" className="text-xs tobacco-leaf">
                                {item.serviceCode}
                              </Badge>
                            </div>
                            <div className="font-mono text-sm font-bold text-foreground bg-muted/50 px-2 py-1 rounded">
                              {item.code}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              🕐 {item.timestamp.toLocaleString("vi-VN")}
                            </div>
                          </div>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(item.code)}
                              className="ml-3 text-primary hover:bg-primary/10 hover:text-primary"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Beer className="h-16 w-16 text-primary/30" />
                      <span className="text-4xl opacity-30">🥜</span>
                      <span className="text-4xl opacity-30">🪑</span>
                    </div>
                    <p className="text-lg font-playfair">🍺 Quán còn trống - Chưa có ai ngồi</p>
                    <p className="text-sm mt-2">Tạo mã đầu tiên để mở quán bia vỉa hè! Có đậu lạc tẩm hành đấy! 🥜</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
