"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Code, Database, Copy, Download } from "lucide-react"
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
import Image from "next/image"


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

// Floating Lantern Component
interface LanternProps {
  delay?: number
  speed?: number
}

const FloatingLantern = ({ delay = 0, speed = 0.3 }: LanternProps) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: Math.random() * 100, // %
    y: 100 + Math.random() * 20, // bắt đầu từ dưới cùng màn hình (%)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        let newY = prev.y - speed
        let newX = prev.x + Math.sin(Date.now() / 2000 + delay) * 0.2

        // nếu bay lên quá cao thì reset lại phía dưới
        if (newY < -20) {
          newY = 100 + Math.random() * 10
          newX = Math.random() * 100
        }

        return { x: newX, y: newY }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [delay, speed])

  return (
    <div
      className="absolute pointer-events-none opacity-80"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <Image src="/images/long-den.png" alt="Lantern" width={60} height={60} className="object-contain" />
    </div>
  )
}

// Mooncake Component
// @ts-ignore
const Mooncake = ({ x, y, rotation = 0 }) => {
  return (
    <div
      className="absolute pointer-events-none opacity-90"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <Image src="/images/moon-cake.png" alt="Mooncake" width={100} height={100} className="object-contain" />
    </div>
  )
}

// Stars Component
const StarField = () => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; twinkle: number }>>(
    [],
  )

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 20 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 60,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * 2000 + 1000,
      }))
      setStars(newStars)
    }

    generateStars()
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute bg-yellow-200 rounded-full animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.twinkle}ms`,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
          }}
        />
      ))}
    </div>
  )
}

// Moon Component
const MidAutumnMoon = () => {
  const [glowIntensity, setGlowIntensity] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => 0.7 + Math.sin(Date.now() / 2000) * 0.3)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute top-8 right-8 pointer-events-none">
      <div
        className="w-20 h-20 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-200 rounded-full relative"
        style={{
          boxShadow: `0 0 ${30 * glowIntensity}px rgba(255, 255, 0, ${0.4 * glowIntensity})`,
        }}
      >
        <div className="absolute top-3 left-4 w-3 h-3 bg-yellow-400/30 rounded-full"></div>
        <div className="absolute top-8 left-8 w-2 h-2 bg-yellow-500/40 rounded-full"></div>
        <div className="absolute top-6 left-12 w-4 h-4 bg-orange-300/20 rounded-full"></div>
        <div className="absolute top-12 left-6 w-2 h-2 bg-yellow-400/35 rounded-full"></div>

        <div
          className="absolute inset-0 rounded-full border border-yellow-200/20"
          style={{ transform: "scale(1.2)" }}
        ></div>
        <div
          className="absolute inset-0 rounded-full border border-yellow-200/10"
          style={{ transform: "scale(1.4)" }}
        ></div>
      </div>
    </div>
  )
}

// Rabbit silhouette component
const MoonRabbit = () => {
  return (
    <div className="absolute top-12 left-8 pointer-events-none opacity-80">
      <Image src="/images/moon-rabbit.png" alt="Moon Rabbit" width={80} height={80} className="object-contain" />
    </div>
  )
}

export default function OracleCodeGenerator() {
  const { toast } = useToast()
  const [serviceCode, setServiceCode] = useState("")
  const [shbg, setShbg] = useState("")
  const [pocode, setPocode] = useState("11022")
  const [recnational, setRecnational] = useState("VN")
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép",
      description: "Mã đã được sao chép vào clipboard.",
    })
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden
  bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-800 p-4"
    >
      <div
        className="absolute inset-0
    bg-[radial-gradient(circle_at_top_right,_rgba(255,255,150,0.25),_transparent_70%)]
    pointer-events-none"
      ></div>

      <div
        className="absolute inset-0
    bg-[radial-gradient(circle_at_bottom_left,_rgba(255,100,100,0.2),_transparent_70%)]
    pointer-events-none"
      ></div>

      <Toaster />
      <StarField />
      <MidAutumnMoon />
      <MoonRabbit />

      <PetRunner />

      {Array.from({ length: 20 }).map((_, i) => (
        <FloatingLantern key={i} delay={i * 0.5} speed={0.5 + Math.random() * 0.5} />
      ))}

      <Mooncake x={15} y={25} rotation={45} />
      <Mooncake x={85} y={35} rotation={-30} />
      <Mooncake x={25} y={75} rotation={60} />
      <Mooncake x={75} y={80} rotation={-45} />
      <Mooncake x={5} y={60} rotation={90} />
      <Mooncake x={90} y={65} rotation={15} />

      <div className="absolute top-0 left-0 right-0 text-center py-4 z-10">
        <div className="inline-block bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 text-white px-8 py-2 rounded-full text-lg font-bold shadow-lg">
          🏮 Chúc Mừng Tết Trung Thu 2025 🥮
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 pt-16">
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
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
            <Card
              className="relative bg-gradient-to-br from-yellow-50 via-orange-100 to-amber-200
                 border-2 border-yellow-500 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="absolute top-2 left-2 text-xl">🌕</div>
              <div className="absolute top-2 right-2 text-xl">🏮</div>
              <div className="absolute bottom-2 left-2 text-xl">🐇</div>
              <div className="absolute bottom-2 right-2 text-xl">🥮</div>

              <CardHeader className="bg-amber-50/70 rounded-t-2xl backdrop-blur-sm">
                <CardTitle className="flex items-center gap-2 text-orange-900 font-bold">
                  <Code className="h-5 w-5 text-orange-700" />🎑 Thông tin đầu vào
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Nhập thông tin để {mode === "validate" ? "kiểm tra" : "sinh mã"} vận đơn
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6 text-orange-900">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={mode === "validate" ? "default" : "outline"}
                    onClick={() => setMode("validate")}
                    size="sm"
                    className={`${
                      mode === "validate"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border-orange-400 text-orange-700 hover:bg-orange-50"
                    }`}
                  >
                    Kiểm tra mã
                  </Button>
                  <Button
                    variant={mode === "generate" ? "default" : "outline"}
                    onClick={() => setMode("generate")}
                    size="sm"
                    className={`${
                      mode === "generate"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border-orange-400 text-orange-700 hover:bg-orange-50"
                    }`}
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCode" className="text-orange-800 font-semibold">
                      Service Code <span className="text-red-500">*</span>
                    </Label>
                    <Select value={serviceCode} onValueChange={setServiceCode} required>
                      <SelectTrigger className="border-yellow-400 focus:ring-orange-400">
                        <SelectValue placeholder="🦁 Chọn loại dịch vụ" />
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
                      <Label htmlFor="shbg" className="text-orange-800 font-semibold">
                        Mã vận đơn (SHBG) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shbg"
                        value={shbg}
                        onChange={(e) => setShbg(e.target.value.toUpperCase())}
                        placeholder="Nhập mã vận đơn cần kiểm tra"
                        className="border-yellow-400 focus:ring-orange-400"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pocode" className="text-orange-800 font-semibold">
                      Mã bưu cục (PO Code) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pocode"
                      value={pocode}
                      onChange={(e) => setPocode(e.target.value)}
                      placeholder="Mã bưu cục"
                      className="border-yellow-400 focus:ring-orange-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recnational" className="text-orange-800 font-semibold">
                      Quốc gia nhận
                    </Label>
                    <Input
                      id="recnational"
                      value={recnational}
                      onChange={(e) => setRecnational(e.target.value)}
                      placeholder="VN, CN, TW, US..."
                      className="border-yellow-400 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isPackageIncident" className="text-orange-800 font-semibold">
                      Bưu gửi sự vụ
                    </Label>
                    <Select value={isPackageIncident} onValueChange={setIsPackageIncident}>
                      <SelectTrigger className="border-yellow-400 focus:ring-orange-400">
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không</SelectItem>
                        <SelectItem value="1">Có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : mode === "validate" ? "🌕 Kiểm tra mã" : "🏮 Sinh mã mới"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card
            className="relative bg-gradient-to-br from-yellow-100 via-orange-200 to-amber-300
                 border-2 border-yellow-500 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="absolute top-2 left-2 text-2xl">🌕</div>
            <div className="absolute top-2 right-2 text-2xl">🏮</div>
            <div className="absolute bottom-2 left-2 text-2xl">🐇</div>
            <div className="absolute bottom-2 right-2 text-2xl">🥮</div>

            <CardHeader className="bg-amber-50/70 rounded-t-2xl backdrop-blur-sm">
              <CardTitle className="text-orange-800 text-xl font-bold">✨ Kết quả ✨</CardTitle>
              <CardDescription className="text-orange-700">
                {mode === "validate" ? "Kết quả kiểm tra" : "Kết quả sinh mã"} sẽ hiển thị ở đây
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-orange-900">
              {result ? (
                <>
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge className={`${result.isValid ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>
                      {result.isValid ? "Hợp lệ" : "Không hợp lệ"}
                    </Badge>
                  </div>

                  {result.generatedCode && (
                    <div className="space-y-2">
                      <Label className="text-orange-900 font-semibold">Mã được sinh:</Label>
                      <div className="p-3 bg-amber-50 rounded-md font-mono text-lg flex items-center justify-between border border-yellow-400">
                        <span>{result.generatedCode}</span>
                        <button
                          onClick={() => copyToClipboard(result.generatedCode || "")}
                          className="ml-4 text-sm text-blue-700 hover:underline"
                        >
                          <Copy />
                        </button>
                      </div>
                    </div>
                  )}

                  {result.serviceInfo && (
                    <div className="space-y-2">
                      <Label className="text-orange-900 font-semibold">Thông tin dịch vụ:</Label>
                      <div className="p-3 bg-orange-50 rounded-md border border-orange-300 space-y-1">
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
                      <Label className="text-red-700 font-semibold">Lỗi:</Label>
                      <div className="p-3 bg-red-100 rounded-md border border-red-300">
                        {result.errors.map((error, index) => (
                          <div key={index} className="text-red-700">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-orange-700 py-8">
                  {mode === "validate"
                    ? "🌕 Nhập mã vận đơn để kiểm tra tính hợp lệ 🏮"
                    : "🐇 Chọn dịch vụ để sinh mã mới 🥮"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
