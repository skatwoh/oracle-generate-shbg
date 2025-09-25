"use client"

import React, {useEffect} from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {CheckCircle, XCircle, Code, Database, Copy, Download, History, Trash2} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import ElectricBorder from "@/components/ElectricBorder"
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
import VersionChecker from "@/components/VersionChecker";

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
  const [pocode, setPocode] = useState("11022");
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
    setLogs(admin != null ? admin : "");
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
        link.setAttribute(
          "download",
          `van-don-${serviceCode}-${new Date().toISOString().split("T")[0]}.csv`
        )
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <PetRunner />
      <Toaster />
      <VersionChecker />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            <TextType
              text={["Tự động sinh mã", "Kiểm tra mã vận đơn", "Hẹ Hẹ Hẹ 🤡"]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="|"
            />
            <Database className="h-8 w-8 text-blue-600" />
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ElectricBorder
            color="#7df9ff"
            speed={1}
            chaos={0.5}
            thickness={2}
            style={{ borderRadius: 16 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Thông tin đầu vào
                </CardTitle>
                <CardDescription>
                  Nhập thông tin để {mode === "validate" ? "kiểm tra" : "sinh mã"} vận đơn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={mode === "validate" ? "default" : "outline"}
                    onClick={() => setMode("validate")}
                    size="sm"
                  >
                    Kiểm tra mã
                  </Button>
                  <Button
                    variant={mode === "generate" ? "default" : "outline"}
                    onClick={() => setMode("generate")}
                    size="sm"
                  >
                    Sinh mã mới
                  </Button>
                  <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-400 text-purple-700 hover:bg-purple-50 bg-transparent"
                      >
                        Nâng cao
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Sinh mã hàng loạt
                        </DialogTitle>
                        <DialogDescription>
                          Nhập số lượng mã vận đơn muốn sinh và tải xuống file Excel
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bulkCount">Số lượng mã cần sinh</Label>
                          <Input
                            id="bulkCount"
                            type="number"
                            min="1"
                            max="1000"
                            value={bulkCount}
                            onChange={(e) => setBulkCount(e.target.value)}
                            placeholder="Nhập số lượng (tối đa 1000)"
                            disabled={bulkLoading}
                          />
                        </div>
                        {bulkLoading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Đang sinh mã...</span>
                              <span>{bulkProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${bulkProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={handleBulkGenerate} disabled={bulkLoading} className="flex-1">
                            {bulkLoading ? `Đang sinh... ${bulkProgress}%` : "Sinh & Tải xuống"}
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
                                description: "Quá trình sinh mã hàng loạt đã được hủy.",
                              })

                              setShowBulkModal(false)
                              setTimeout(() => setCancelBulk(false), 100)
                            }}
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
                    <Label htmlFor="serviceCode">Service Code <span className="text-red-500">*</span></Label>
                    <Select value={serviceCode} onValueChange={setServiceCode} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại dịch vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <Input
                    id="serviceCode"
                    onChange={(e) => setServiceCode(e.target.value)}
                    placeholder="Chọn hoặc nhập mã dịch vụ"
                    className="mt-2"
                  /> */}
                  </div>

                  {mode === "validate" && (
                    <div className="space-y-2">
                      <Label htmlFor="shbg">
                        Mã vận đơn (SHBG) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shbg"
                        value={shbg}
                        onChange={(e) => setShbg(e.target.value.toUpperCase())}
                        placeholder="Nhập mã vận đơn cần kiểm tra"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pocode">Mã bưu cục (PO Code) <span className="text-red-500">*</span></Label>
                    <Input
                      id="pocode"
                      value={pocode}
                      onChange={(e) => setPocode(e.target.value)}
                      placeholder="Mã bưu cục (tùy chọn)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recnational">Quốc gia nhận</Label>
                    <Input
                      id="recnational"
                      value={"VN"}
                      onChange={(e) => setRecnational("VN")}
                      placeholder="VN, CN, TW, US..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isPackageIncident">Bưu gửi sự vụ</Label>
                    <Select value={isPackageIncident} onValueChange={setIsPackageIncident}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không</SelectItem>
                        <SelectItem value="1">Có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Đang xử lý..." : mode === "validate" ? "Kiểm tra mã" : "Sinh mã mới"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ElectricBorder>

          <Card>
            <CardHeader>
              <CardTitle>Kết quả</CardTitle>
              <CardDescription>
                Kết quả {mode === "validate" ? "kiểm tra" : "sinh mã"} sẽ hiển thị ở đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={result.isValid ? "default" : "destructive"}>
                      {result.isValid ? "Hợp lệ" : "Không hợp lệ"}
                    </Badge>
                  </div>

                  {result.generatedCode && (
                    <div className="space-y-2">
                      <Label>Mã được sinh:</Label>
                      <div className="p-3 bg-gray-100 rounded-md font-mono text-lg flex items-center justify-between">
                        <span>{result.generatedCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.generatedCode || "")
                            toast({
                              title: "Đã sao chép",
                              description: "Mã đã được sao chép vào clipboard.",
                            })
                          }}
                          className="ml-4 text-sm text-blue-600 hover:underline"
                        >
                          <Copy />
                        </button>
                      </div>
                    </div>
                  )}

                  {result.serviceInfo && (
                    <div className="space-y-2">
                      <Label>Thông tin dịch vụ:</Label>
                      <div className="p-3 bg-blue-50 rounded-md space-y-1">
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
                      <Label>Lỗi:</Label>
                      <div className="p-3 bg-red-50 rounded-md">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-red-700">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {mode === "validate" ? "Nhập mã vận đơn để kiểm tra tính hợp lệ" : "Chọn dịch vụ để sinh mã mới"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card
            className="relative bg-gradient-to-br from-emerald-50 via-teal-100 to-cyan-200
                 border-2 border-emerald-500 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="absolute top-2 left-2 text-2xl">📜</div>
          <div className="absolute top-2 right-2 text-2xl">⏰</div>
          <div className="absolute bottom-2 left-2 text-2xl">📋</div>
          <div className="absolute bottom-2 right-2 text-2xl">🔍</div>

          <CardHeader className="bg-emerald-50/70 rounded-t-2xl backdrop-blur-sm">
            <CardTitle className="flex items-center justify-between text-emerald-800 text-xl font-bold">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-700" />📚 Lịch sử tạo bưu gửi
              </div>
              {(history.length > 0 && logs === "adminnek") && (
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={clearHistory}
                      className="border-red-400 text-red-700 hover:bg-red-50 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa tất cả
                  </Button>
              )}
            </CardTitle>
            <CardDescription className="text-emerald-700">
              Lịch sử các mã vận đơn đã kiểm tra và sinh gần đây (tối đa 50 mục)
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 max-h-96 overflow-y-auto">
            {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                      <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-emerald-200 hover:bg-white/90 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                                className={`text-xs ${
                                    item.type === "generate" ? "bg-blue-200 text-blue-900" : "bg-green-200 text-green-900"
                                }`}
                            >
                              {item.type === "generate" ? "🏮 Sinh mã" : "🌕 Kiểm tra"}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-700">
                              {item.serviceCode}
                            </Badge>
                          </div>
                          <div className="font-mono text-sm font-semibold text-gray-800">{item.code}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.timestamp.toLocaleString("vi-VN")}</div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.code)}
                            className="ml-2 text-emerald-700 hover:bg-emerald-100"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="text-center text-emerald-700 py-8">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>📝 Chưa có lịch sử nào</p>
                  <p className="text-sm mt-1">Các mã đã kiểm tra và sinh sẽ hiển thị ở đây</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
