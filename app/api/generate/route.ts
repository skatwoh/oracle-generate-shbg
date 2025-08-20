import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

interface GenerateRequest {
  serviceCode: string
  pocode?: string
  recnational?: string
  isPackageIncident?: string
}

// Mock province codes - in real implementation, this would come from database
const PROVINCE_CODES = [
  "01",
  "02",
  "04",
  "06",
  "08",
  "10",
  "12",
  "14",
  "15",
  "17",
  "19",
  "20",
  "22",
  "24",
  "25",
  "26",
  "27",
  "30",
  "31",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "40",
  "42",
  "44",
  "45",
  "46",
  "48",
  "49",
  "51",
  "52",
  "54",
  "56",
  "58",
  "60",
  "62",
  "64",
  "66",
  "67",
  "68",
  "70",
  "72",
  "74",
  "75",
  "77",
  "79",
  "80",
  "82",
  "83",
  "84",
  "86",
  "87",
  "89",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
]

// Cập nhật function generateShbg để kiểm tra trùng lặp
async function generateShbg(
  req: GenerateRequest,
  maxRetries = 10,
): Promise<{
  generatedCode: string
  serviceInfo: any
  attempts: number
  existsInDb: boolean
}> {
  let attempts = 0

  while (attempts < maxRetries) {
    attempts++

    const { serviceCode, pocode, recnational, isPackageIncident = "0" } = req
    const upperServiceCode = serviceCode.toUpperCase()

    let prefix = ""
    let format = ""
    let serviceName = ""

    // Determine prefix based on service code (giữ nguyên logic cũ)
    switch (upperServiceCode.substring(0, 3)) {
      case "RTN":
        prefix = "R" + getRandomChar("ABCDEFGHIJKLMNLOPQSUVTYWXYZ")
        serviceName = "Bưu phẩm đảm bảo"
        format = "13 ký tự: R + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "CTN":
        prefix = "C" + getRandomChar("ABCDEFGHIJKLMNLOQRSUVTYWXYZ")
        serviceName = "Bưu kiện trong nước"
        format = "13 ký tự: C + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "PTN":
        prefix = "P" + getRandomChar("ABCDEFGHIJKLMN")
        serviceName = "Logistic"
        format = "13 ký tự: P + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "ETN":
        if (isPackageIncident === "1") {
          prefix = "EX"
        } else {
          prefix = "E" + getRandomChar("ABCDEFGHIJKLMNOPQRSUVWXYZ")
        }
        serviceName = "EMS"
        format = "13 ký tự: E + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "KT1":
        prefix = "M" + getRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        serviceName = "Kiện tổng hợp"
        format = "13 ký tự: M + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "UPS":
        serviceName = "UPS"
        if (Math.random() > 0.5) {
          // Generate 11-character UPS code
          prefix = "V"
          const numbers = generateRandomNumbers(10)
          const generatedCode = prefix + numbers

          // Kiểm tra trong PORTAL_ITEM_DTL
          const existsInDb = await db.checkShbgExists(generatedCode)
          if (!existsInDb) {
            return {
              generatedCode,
              serviceInfo: {
                name: serviceName,
                prefix: "V + 10 số",
                format: "11 ký tự: V + 10 số",
              },
              attempts,
              existsInDb: false,
            }
          }
          continue // Try again if exists
        } else {
          // Generate 18-character UPS code
          const code = generateRandomAlphaNumeric(18)
          const existsInDb = await db.checkShbgExists(code)
          if (!existsInDb) {
            return {
              generatedCode: code,
              serviceInfo: {
                name: serviceName,
                prefix: "18 ký tự chữ số",
                format: "18 ký tự: chữ cái và số",
              },
              attempts,
              existsInDb: false,
            }
          }
          continue // Try again if exists
        }
      case "DHL":
        serviceName = "DHL"
        const dhlCode = generateRandomNumbers(10)
        const existsInDb = await db.checkShbgExists(dhlCode)
        if (!existsInDb) {
          return {
            generatedCode: dhlCode,
            serviceInfo: {
              name: serviceName,
              prefix: "10 số",
              format: "10 ký tự số",
            },
            attempts,
            existsInDb: false,
          }
        }
        continue // Try again if exists
      case "VNQ":
        prefix = "QP"
        serviceName = "VNQ"
        format = "13 ký tự: QP + 9 số + mã kiểm tra + VN"
        break
      case "PRM":
        if (serviceCode === "PRM004") {
          prefix = "LA"
        } else {
          prefix = "LD"
        }
        serviceName = "PRM"
        format = "13 ký tự: L + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "LQT":
        if (serviceCode === "LQT005") {
          prefix = "LA"
        } else if (recnational === "CN" || recnational === "TW") {
          prefix = "LX"
        } else {
          prefix = "LP"
        }
        serviceName = "LQT"
        format = "13 ký tự: L + ký tự + 9 số + mã kiểm tra + VN"
        break
      case "HCC":
        if (upperServiceCode === "HCC001" || upperServiceCode === "HCC002") {
          if (isPackageIncident === "1") {
            prefix = "EX"
          } else {
            prefix = "E" + getRandomChar("ABCDEFGHIJKLMNLOPQRSUVYWXYZ")
          }
        } else {
          if (isPackageIncident === "1") {
            prefix = "RX"
          } else {
            prefix = "R" + getRandomChar("ABCDEFGHIJKLMNLOPQSUVTYWXYZ")
          }
        }
        serviceName = `HCC${upperServiceCode.substring(3)}`
        format = "13 ký tự: tiền tố + 9 số + mã kiểm tra + VN"
        break
      default:
        // Handle TDT services
        if (["TDT001", "TDT002"].includes(serviceCode)) {
          prefix = "E" + getRandomChar("ABCDEFGHIJKLMNOPQRSUVWXYZ")
          serviceName = "TMDT"
          format = "13 ký tự: E + ký tự + 9 số + mã kiểm tra + VN"
        } else if (serviceCode === "TDT003") {
          prefix = "P" + getRandomChar("ABCDEFGHIJKLMN")
          serviceName = "TMDT > 30KG"
          format = "13 ký tự: P + ký tự + 9 số + mã kiểm tra + VN"
        } else if (serviceCode === "TDT004") {
          prefix = "C" + getRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
          serviceName = "TMDT < 30kg"
          format = "13 ký tự: C + ký tự + 9 số + mã kiểm tra + VN"
        } else {
          throw new Error("Service code không được hỗ trợ")
        }
    }

    // Generate the main number part (8 digits) for 13-character codes
    const provinceCode = pocode ? pocode.substring(0, 2) : getRandomProvinceCode()
    const sequenceNumber = generateRandomNumbers(6)
    const numberPart = provinceCode + sequenceNumber

    // Calculate check digit
    const sum =
      Number.parseInt(numberPart[0]) * 8 +
      Number.parseInt(numberPart[1]) * 6 +
      Number.parseInt(numberPart[2]) * 4 +
      Number.parseInt(numberPart[3]) * 2 +
      Number.parseInt(numberPart[4]) * 3 +
      Number.parseInt(numberPart[5]) * 5 +
      Number.parseInt(numberPart[6]) * 9 +
      Number.parseInt(numberPart[7]) * 7

    const div = 11 - (sum % 11)
    let checkDigit: string

    if (div >= 1 && div <= 9) {
      checkDigit = div.toString()
    } else if (div === 10) {
      checkDigit = "0"
    } else {
      checkDigit = "5"
    }

    const generatedCode = prefix + numberPart + checkDigit + "VN"

    // Kiểm tra trong bảng PORTAL_ITEM_DTL với trường TT_NUMBER
    const codeExistsInDb = await db.checkShbgExists(generatedCode)
    if (!codeExistsInDb) {
      return {
        generatedCode,
        serviceInfo: {
          name: serviceName,
          prefix: prefix,
          format: format,
        },
        attempts,
        existsInDb: false,
      }
    }

    // If code exists, continue to next attempt
    console.log(`Generated code ${generatedCode} already exists in PORTAL_ITEM_DTL, retrying... (attempt ${attempts})`)
  }

  throw new Error(
    `Không thể sinh mã duy nhất sau ${maxRetries} lần thử. Tất cả mã đều đã tồn tại trong PORTAL_ITEM_DTL.`,
  )
}

function getRandomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)]
}

function generateRandomNumbers(length: number): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

function generateRandomAlphaNumeric(length: number): string {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += getRandomChar(charset)
  }
  return result
}

function getRandomProvinceCode(): string {
  return PROVINCE_CODES[Math.floor(Math.random() * PROVINCE_CODES.length)]
}

// Cập nhật POST handler
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    if (!body.serviceCode) {
      return NextResponse.json({
        isValid: false,
        errors: ["Service code là bắt buộc"],
      })
    }

    const result = await generateShbg(body)

    return NextResponse.json({
      isValid: true,
      generatedCode: result.generatedCode,
      serviceInfo: result.serviceInfo,
      attempts: result.attempts,
      message: `Mã được sinh sau ${result.attempts} lần thử và đã kiểm tra không trùng trong PORTAL_ITEM_DTL`,
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      {
        isValid: false,
        errors: [error instanceof Error ? error.message : "Lỗi server khi sinh mã"],
      },
      { status: 500 },
    )
  }
}
