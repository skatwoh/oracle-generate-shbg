"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Code, Database, Copy } from "lucide-react"
import TrueFocus from "@/components/ui/TrueFocus"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

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
  const [pocode, setPocode] = useState("11022");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            <TrueFocus
              sentence="Tool tạo SHBG"
              manualMode={false}
              blurAmount={5}
              borderColor="red"
              animationDuration={2}
              pauseBetweenAnimations={1}
            />
          </h1>
          <p className="text-gray-600">Tự động sinh mã và kiểm tra mã vận đơn Oracle</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
      </div>
    </div>
  )
}
