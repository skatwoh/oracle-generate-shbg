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
import {
  CheckCircle,
  XCircle,
  Code,
  Database,
  Copy,
  Download,
  History,
  Trash2,
  Loader2,
  Zap,
  Mail,
  Package,
  Search,
  Filter,
  BarChart3,
  Star,
  Clock,
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import PetRunner from "./PetRunner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import VersionChecker from "@/components/VersionChecker"

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

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "validate" | "generate">("all")
  const [showStats, setShowStats] = useState(false)
  const [favoriteServices, setFavoriteServices] = useState<string[]>([])
  const [recentServices, setRecentServices] = useState<string[]>([])

  const [serviceSearchTerm, setServiceSearchTerm] = useState("")

  useEffect(() => {
    const savedHistory = localStorage.getItem("postal-code-history")
    const admin: any = localStorage.getItem("postal-admin")
    const savedFavorites = localStorage.getItem("favorite-services")
    const savedRecent = localStorage.getItem("recent-services")

    setLogs(admin != null ? admin : "")

    if (savedFavorites) {
      try {
        setFavoriteServices(JSON.parse(savedFavorites))
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (savedRecent) {
      try {
        setRecentServices(JSON.parse(savedRecent))
      } catch (error) {
        console.error("Error loading recent services:", error)
      }
    }

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

  const serviceCategories = {
    "Bưu phẩm cơ bản": [
      { value: "RTN", label: "RTN - Bưu phẩm đảm bảo", description: "Dịch vụ bưu phẩm đảm bảo tiêu chuẩn" },
      { value: "CTN", label: "CTN - Bưu kiện trong nước", description: "Bưu kiện gửi trong nước" },
      { value: "PTN", label: "PTN - Logistic", description: "Dịch vụ logistics chuyên nghiệp" },
      { value: "ETN", label: "ETN - EMS", description: "Chuyển phát nhanh EMS" },
    ],
    "Thương mại điện tử": [
      { value: "TDT001", label: "TDT001 - TMDT", description: "Thương mại điện tử cơ bản" },
      { value: "TDT002", label: "TDT002 - TMDT", description: "Thương mại điện tử nâng cao" },
      { value: "TDT003", label: "TDT003 - TMDT > 30KG", description: "TMDT cho hàng hóa trên 30kg" },
      { value: "TDT004", label: "TDT004 - TMDT < 30kg", description: "TMDT cho hàng hóa dưới 30kg" },
    ],
    "Kiện tổng hợp": [{ value: "KT1", label: "KT1 - Kiện tổng hợp", description: "Dịch vụ kiện tổng hợp" }],
    "Dịch vụ quốc tế": [
      { value: "TQT006", label: "TQT006", description: "Dịch vụ quốc tế TQT006" },
      { value: "VNQ", label: "VNQ", description: "Vietnam Post quốc tế" },
      { value: "UPS", label: "UPS", description: "United Parcel Service" },
      { value: "DHL", label: "DHL", description: "DHL Express" },
    ],
    "Dịch vụ chuyên biệt": [
      { value: "PRM004", label: "PRM004", description: "Premium service 004" },
      { value: "PRM", label: "PRM", description: "Premium service" },
      { value: "EQT", label: "EQT", description: "Express Quality Transport" },
    ],
    "Dịch vụ CQT": [
      { value: "CQT001", label: "CQT001", description: "CQT service 001" },
      { value: "CQT002", label: "CQT002", description: "CQT service 002" },
      { value: "CQT003", label: "CQT003", description: "CQT service 003" },
      { value: "CQT006", label: "CQT006", description: "CQT service 006" },
    ],
    "Dịch vụ LQT": [
      { value: "LQT005", label: "LQT005", description: "LQT service 005" },
      { value: "LQT", label: "LQT standard service", description: "LQT standard service" },
    ],
    "Dịch vụ RQT": [
      { value: "RQT001", label: "RQT001", description: "RQT service 001" },
      { value: "RQT002", label: "RQT002", description: "RQT service 002" },
      { value: "RQT003", label: "RQT003", description: "RQT service 003" },
      { value: "RQT004", label: "RQT004", description: "RQT service 004" },
      { value: "RQT005", label: "RQT005", description: "RQT service 005" },
      { value: "RQT006", label: "RQT006", description: "RQT service 006" },
    ],
    "Dịch vụ HCC": [
      { value: "HCC001", label: "HCC001", description: "HCC service 001" },
      { value: "HCC002", label: "HCC002", description: "HCC service 002" },
      { value: "HCC003", label: "HCC003", description: "HCC service 003" },
      { value: "HCC004", label: "HCC004", description: "HCC service 004" },
    ],
  }

  const allServices = Object.values(serviceCategories).flat()

  const filteredServiceCategories = Object.entries(serviceCategories).reduce(
    (acc, [category, services]) => {
      const filteredServices = services.filter(
        (service) =>
          service.label.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
          service.value.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()),
      )
      if (filteredServices.length > 0) {
        acc[category] = filteredServices
      }
      return acc
    },
    {} as typeof serviceCategories,
  )

  const addToFavorites = (service: string) => {
    if (!favoriteServices.includes(service)) {
      const newFavorites = [...favoriteServices, service]
      setFavoriteServices(newFavorites)
      localStorage.setItem("favorite-services", JSON.stringify(newFavorites))
      toast({
        title: "Đã thêm vào yêu thích",
        description: `${service} đã được thêm vào danh sách yêu thích.`,
      })
    }
  }

  const removeFromFavorites = (service: string) => {
    const newFavorites = favoriteServices.filter((s) => s !== service)
    setFavoriteServices(newFavorites)
    localStorage.setItem("favorite-services", JSON.stringify(newFavorites))
    toast({
      title: "Đã xóa khỏi yêu thích",
      description: `${service} đã được xóa khỏi danh sách yêu thích.`,
    })
  }

  const addToRecent = (service: string) => {
    const newRecent = [service, ...recentServices.filter((s) => s !== service)].slice(0, 5)
    setRecentServices(newRecent)
    localStorage.setItem("recent-services", JSON.stringify(newRecent))
  }

  const getStats = () => {
    const total = history.length
    const validated = history.filter((h) => h.type === "validate").length
    const generated = history.filter((h) => h.type === "generate").length
    const today = new Date().toDateString()
    const todayCount = history.filter((h) => h.timestamp.toDateString() === today).length

    return { total, validated, generated, todayCount }
  }

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

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
          signal: controller.signal,
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

    if (serviceCode) {
      addToRecent(serviceCode)
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20"></div>

      <PetRunner />
      <Toaster />
      <VersionChecker />

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 backdrop-blur-sm mb-4">
            <Zap className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Công cụ tự động hóa</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Hệ thống quản lý
            </span>
            <br />
            <span className="text-white">mã vận đơn</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto text-balance">
            Tạo và kiểm tra mã vận đơn tự động với công nghệ hiện đại. Hỗ trợ sinh hàng loạt và theo dõi lịch sử chi
            tiết.
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-6 py-4 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
              <div className="text-3xl font-bold text-emerald-400">{getStats().total}</div>
              <div className="text-sm text-emerald-300">Tổng số mã</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-6 py-4 rounded-xl border border-blue-500/30 backdrop-blur-sm">
              <div className="text-3xl font-bold text-blue-400">{getStats().generated}</div>
              <div className="text-sm text-blue-300">Đã sinh</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-6 py-4 rounded-xl border border-purple-500/30 backdrop-blur-sm">
              <div className="text-3xl font-bold text-purple-400">{getStats().validated}</div>
              <div className="text-sm text-purple-300">Đã kiểm tra</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 px-6 py-4 rounded-xl border border-orange-500/30 backdrop-blur-sm">
              <div className="text-3xl font-bold text-orange-400">{getStats().todayCount}</div>
              <div className="text-sm text-orange-300">Hôm nay</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm animate-fade-in">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-blue-500/20">
                  <Code className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Thông tin đầu vào</CardTitle>
                  <CardDescription className="text-slate-300">
                    Nhập thông tin để {mode === "validate" ? "kiểm tra" : "sinh mã"} vận đơn
                  </CardDescription>
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-slate-700/30 rounded-lg">
                <Button
                  variant={mode === "validate" ? "default" : "ghost"}
                  onClick={() => setMode("validate")}
                  size="sm"
                  className={`flex-1 transition-all duration-200 hover:scale-[1.02] ${
                    mode === "validate"
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kiểm tra mã
                </Button>
                <Button
                  variant={mode === "generate" ? "default" : "ghost"}
                  onClick={() => setMode("generate")}
                  size="sm"
                  className={`flex-1 transition-all duration-200 hover:scale-[1.02] ${
                    mode === "generate"
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                  }`}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Sinh mã mới
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 hover:from-emerald-500/20 hover:to-blue-500/20 hover:scale-[1.02]"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Sinh hàng loạt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-slate-800/95 border-slate-700/50 backdrop-blur-sm">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white">
                        <Download className="h-5 w-5 text-emerald-400" />
                        Sinh mã hàng loạt
                      </DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Nhập số lượng mã vận đơn muốn sinh và tải xuống file CSV
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulkCount" className="text-white">
                          Số lượng mã cần sinh
                        </Label>
                        <Input
                          id="bulkCount"
                          type="number"
                          min="1"
                          max="1000"
                          value={bulkCount}
                          onChange={(e) => setBulkCount(e.target.value)}
                          placeholder="Nhập số lượng (tối đa 1000)"
                          disabled={bulkLoading}
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                      {bulkLoading && (
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-slate-300">
                            <span>Đang sinh mã...</span>
                            <span>{bulkProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${bulkProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleBulkGenerate}
                          disabled={bulkLoading}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                        >
                          {bulkLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang sinh... {bulkProgress}%
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Sinh & Tải xuống
                            </>
                          )}
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
                          className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => setShowStats(!showStats)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 hover:scale-[1.02]"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Thống kê
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="serviceCode" className="text-sm font-medium flex items-center gap-2 text-white">
                    Service Code <span className="text-red-400">*</span>
                    {serviceCode && favoriteServices.includes(serviceCode) && (
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    )}
                  </Label>

                  {favoriteServices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Yêu thích:</Label>
                      <div className="flex flex-wrap gap-2">
                        {favoriteServices.map((service) => (
                          <Button
                            key={service}
                            variant={serviceCode === service ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceCode(service)}
                            className={`text-xs h-8 hover:scale-105 transition-all duration-200 ${
                              serviceCode === service
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                : "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                            }`}
                          >
                            <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                            {service}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentServices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Gần đây:</Label>
                      <div className="flex flex-wrap gap-2">
                        {recentServices.map((service) => (
                          <Button
                            key={service}
                            variant={serviceCode === service ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServiceCode(service)}
                            className={`text-xs h-8 hover:scale-105 transition-all duration-200 ${
                              serviceCode === service
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                : "border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            }`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {service}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Select value={serviceCode} onValueChange={setServiceCode} required>
                    <SelectTrigger className="bg-white/95 border-2 border-slate-300 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-300 h-14 shadow-lg hover:shadow-xl rounded-xl text-slate-800 font-medium backdrop-blur-sm">
                      <SelectValue placeholder="🔍 Chọn loại dịch vụ..." className="text-slate-600" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 border-2 border-slate-300 shadow-2xl rounded-xl max-h-96 backdrop-blur-sm overflow-hidden">
                      <div className="sticky top-0 p-3 bg-white/95 border-b border-slate-200 backdrop-blur-sm">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="🔍 Tìm kiếm dịch vụ..."
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-500 h-10"
                          />
                        </div>
                      </div>

                      {Object.keys(filteredServiceCategories).length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Không tìm thấy dịch vụ nào</p>
                        </div>
                      ) : (
                        Object.entries(filteredServiceCategories).map(([category, services]) => (
                          <div key={category}>
                            <div className="px-4 py-3 text-sm font-bold text-slate-700 bg-gradient-to-r from-emerald-100 to-blue-100 sticky top-[60px] border-b border-slate-200 backdrop-blur-sm">
                              📁 {category}
                            </div>
                            {services.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="bg-white hover:bg-blue-50 hover:text-blue-900 transition-all duration-300 border-b border-slate-100 last:border-b-0 py-4 cursor-pointer data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-900"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 text-sm">{option.label}</span>
                                    <span className="text-xs text-slate-500 mt-1">{option.description}</span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    {favoriteServices.includes(option.value) && (
                                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    )}
                                    {recentServices.includes(option.value) && (
                                      <Clock className="h-4 w-4 text-blue-500" />
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {serviceCode && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          favoriteServices.includes(serviceCode)
                            ? removeFromFavorites(serviceCode)
                            : addToFavorites(serviceCode)
                        }
                        className="text-xs hover:scale-105 transition-all duration-200 text-slate-300 hover:text-white"
                      >
                        <Star
                          className={`h-3 w-3 mr-1 ${favoriteServices.includes(serviceCode) ? "text-yellow-400 fill-current" : "text-slate-400"}`}
                        />
                        {favoriteServices.includes(serviceCode) ? "Bỏ yêu thích" : "Yêu thích"}
                      </Button>
                    </div>
                  )}
                </div>

                {mode === "validate" && (
                  <div className="space-y-2 animate-slide-up">
                    <Label htmlFor="shbg" className="text-sm font-medium text-white">
                      Mã vận đơn (SHBG) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="shbg"
                      value={shbg}
                      onChange={(e) => setShbg(e.target.value.toUpperCase())}
                      placeholder="Nhập mã vận đơn cần kiểm tra"
                      required
                      className="bg-slate-700/50 border-slate-600 font-mono h-12 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-200 text-white placeholder:text-slate-400"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pocode" className="text-sm font-medium text-white">
                    Mã bưu cục (PO Code) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="pocode"
                    value={pocode}
                    onChange={(e) => setPocode(e.target.value)}
                    placeholder="Mã bưu cục"
                    required
                    className="bg-slate-700/50 border-slate-600 h-12 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-200 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recnational" className="text-sm font-medium text-white">
                    Quốc gia nhận
                  </Label>
                  <Input
                    id="recnational"
                    value="VN"
                    onChange={(e) => setRecnational("VN")}
                    placeholder="VN, CN, TW, US..."
                    className="bg-slate-700/50 border-slate-600 h-12 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-200 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isPackageIncident" className="text-sm font-medium text-white">
                    Bưu gửi sự vụ
                  </Label>
                  <Select value={isPackageIncident} onValueChange={setIsPackageIncident}>
                    <SelectTrigger className="bg-white/95 border-2 border-slate-300 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-300 h-12 shadow-lg hover:shadow-xl rounded-xl text-slate-800 font-medium backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 border-2 border-slate-300 shadow-2xl rounded-xl backdrop-blur-sm overflow-hidden">
                      <SelectItem
                        value="0"
                        className="bg-white hover:bg-red-50 hover:text-red-900 transition-all duration-300 py-4 cursor-pointer data-[highlighted]:bg-red-100 data-[highlighted]:text-red-900"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">❌</span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">Không</span>
                            <span className="text-xs text-slate-500">Bưu gửi bình thường</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="1"
                        className="bg-white hover:bg-green-50 hover:text-green-900 transition-all duration-300 py-4 cursor-pointer data-[highlighted]:bg-green-100 data-[highlighted]:text-green-900"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">✅</span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">Có</span>
                            <span className="text-xs text-slate-500">Bưu gửi có sự vụ</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 text-lg font-medium transition-all duration-200 hover:scale-[1.02] bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-xl hover:shadow-2xl text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {mode === "validate" ? (
                        <CheckCircle className="h-6 w-6 mr-2" />
                      ) : (
                        <Package className="h-6 w-6 mr-2" />
                      )}
                      {mode === "validate" ? "🔍 Kiểm tra mã" : "✨ Sinh mã mới"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                  <Database className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Kết quả</CardTitle>
                  <CardDescription className="text-slate-300">
                    Kết quả {mode === "validate" ? "kiểm tra" : "sinh mã"} sẽ hiển thị ở đây
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6 animate-slide-up">
                  <div className="flex items-center gap-3">
                    {result.isValid ? (
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-400" />
                    )}
                    <Badge
                      variant={result.isValid ? "default" : "destructive"}
                      className={`text-sm px-4 py-2 ${
                        result.isValid
                          ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {result.isValid ? "✅ Hợp lệ" : "❌ Không hợp lệ"}
                    </Badge>
                  </div>

                  {result.generatedCode && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white">Mã được sinh:</Label>
                      <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/30 flex items-center justify-between group hover:from-emerald-500/20 hover:to-blue-500/20 transition-all duration-200 backdrop-blur-sm">
                        <span className="font-mono text-xl font-semibold text-emerald-400">{result.generatedCode}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.generatedCode || "")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:bg-emerald-500/20"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {result.serviceInfo && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white">Thông tin dịch vụ:</Label>
                      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30 space-y-2 backdrop-blur-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Tên:</span>
                          <span className="font-medium text-white">{result.serviceInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Tiền tố:</span>
                          <span className="font-mono text-blue-400">{result.serviceInfo.prefix}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Định dạng:</span>
                          <span className="font-mono text-purple-400">{result.serviceInfo.format}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-red-400">Lỗi:</Label>
                      <div className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg border border-red-500/30 backdrop-blur-sm">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-red-400 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-300 py-12 space-y-4">
                  <div className="p-4 rounded-full bg-slate-700/30 w-fit mx-auto">
                    <Mail className="h-8 w-8" />
                  </div>
                  <p className="text-lg">
                    {mode === "validate" ? "Nhập mã vận đơn để kiểm tra tính hợp lệ" : "Chọn dịch vụ để sinh mã mới"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20">
                  <History className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Lịch sử tạo bưu gửi</CardTitle>
                  <CardDescription className="text-slate-300">
                    Lịch sử các mã vận đơn đã kiểm tra và sinh gần đây (tối đa 50 mục)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && logs === "adminnek" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent hover:scale-105 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tất cả
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="🔍 Tìm kiếm mã vận đơn hoặc service code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-200 text-white placeholder:text-slate-400"
                />
              </div>
              <Select
                value={filterType}
                onValueChange={(value: "all" | "validate" | "generate") => setFilterType(value)}
              >
                <SelectTrigger className="w-full sm:w-48 bg-white/95 border-2 border-slate-300 hover:border-emerald-400 focus:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl text-slate-800 font-medium backdrop-blur-sm">
                  <Filter className="h-4 w-4 mr-2 text-emerald-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 border-2 border-slate-300 shadow-2xl rounded-xl backdrop-blur-sm overflow-hidden">
                  <SelectItem
                    value="all"
                    className="bg-white hover:bg-emerald-50 hover:text-emerald-900 transition-all duration-300 py-4 cursor-pointer data-[highlighted]:bg-emerald-100 data-[highlighted]:text-emerald-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">Tất cả</span>
                        <span className="text-xs text-slate-500">Hiển thị tất cả lịch sử</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="validate"
                    className="bg-white hover:bg-green-50 hover:text-green-900 transition-all duration-300 py-4 cursor-pointer data-[highlighted]:bg-green-100 data-[highlighted]:text-green-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔍</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">Kiểm tra</span>
                        <span className="text-xs text-slate-500">Chỉ mã đã kiểm tra</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="generate"
                    className="bg-white hover:bg-blue-50 hover:text-blue-900 transition-all duration-300 py-4 cursor-pointer data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✨</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">Sinh mã</span>
                        <span className="text-xs text-slate-500">Chỉ mã đã sinh</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="max-h-96 overflow-y-auto">
            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 hover:border-emerald-500/50 transition-all duration-200 animate-fade-in hover:scale-[1.01] backdrop-blur-sm"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs transition-all duration-200 ${
                            item.type === "generate"
                              ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border-blue-500/50 hover:from-blue-500/40 hover:to-cyan-500/40"
                              : "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-500/50 hover:from-green-500/40 hover:to-emerald-500/40"
                          }`}
                        >
                          {item.type === "generate" ? "✨ Sinh mã" : "🔍 Kiểm tra"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200"
                        >
                          {item.serviceCode}
                        </Badge>
                        {favoriteServices.includes(item.serviceCode) && (
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        )}
                      </div>
                      <div className="font-mono text-sm font-semibold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        {item.code}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {item.timestamp.toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.code)}
                      className="ml-4 text-emerald-400 hover:bg-emerald-500/20 hover:scale-110 transition-all duration-200"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-300 py-12 space-y-4">
                <div className="p-4 rounded-full bg-slate-700/30 w-fit mx-auto">
                  {searchTerm || filterType !== "all" ? (
                    <Search className="h-8 w-8" />
                  ) : (
                    <History className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {searchTerm || filterType !== "all" ? "🔍 Không tìm thấy kết quả" : "📝 Chưa có lịch sử nào"}
                  </p>
                  <p className="text-sm mt-1">
                    {searchTerm || filterType !== "all"
                      ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                      : "Các mã đã kiểm tra và sinh sẽ hiển thị ở đây"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
