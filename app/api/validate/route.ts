import { type NextRequest, NextResponse } from "next/server"

// Character sets from the Oracle function
const CHAR_SETS = {
  v_list_char_bput: "ABCDEFGHIJKLMNLOPQSUVTYWXYZ",
  v_list_char_bk: "ABCDEFGHIJKLMNLOQRSUVTYWXYZ",
  v_list_char_loseco: "ABCDEFGHIJKLMN",
  v_list_char_losprm: "TUVWXYZ",
  v_list_char_ems_tmdt: "ABCDEFGHIJKLMNOPQRSUVWXYZ",
  v_list_char_kt1: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  v_list_num: "0123456789",
  v_list_char_lqt: "KLMNOPQRSTVWXYZ",
  v_list_char_prm: "D",
  v_list_char_and_num: "0123456789ABCDEFGHIJKLMNLOPQRSUVTYWXYZ",
  v_list_char_hcc_1_3: "ABCDEFGHIJKLMNLOPQRSUVYWXYZ",
  v_list_char_hcc_2_4: "ABCDEFGHIJKLMNLOPQSUVTYWXYZ",
}

interface ValidationRequest {
  serviceCode: string
  shbg: string
  pocode?: string
  recnational?: string
  isPackageIncident?: string
}

function validateShbg(req: ValidationRequest): { isValid: boolean; errors: string[] } {
  const { serviceCode, shbg, pocode, recnational, isPackageIncident = "0" } = req
  const errors: string[] = []

  if (!shbg) {
    errors.push("Mã vận đơn không được để trống")
    return { isValid: false, errors }
  }

  const upperServiceCode = serviceCode.toUpperCase()
  const upperShbg = shbg.toUpperCase()

  // Check length and basic format for non-UPS services
  if (shbg.length === 13 && upperServiceCode.substring(0, 3) !== "UPS") {
    // Check last 2 characters should be 'VN'
    if (upperShbg.substring(11, 13) !== "VN") {
      errors.push('Hai ký tự cuối phải là "VN"')
    }

    const numberPart = shbg.substring(2, 11)

    // Check if characters 3-11 are numbers
    for (let i = 0; i < numberPart.length - 1; i++) {
      if (numberPart[i] && !CHAR_SETS.v_list_num.includes(numberPart[i])) {
        errors.push(`Ký tự thứ ${i + 3} phải là số`)
      }
    }

    // Validate checksum logic
    try {
      const sum =
        Number.parseInt(shbg[2]) * 8 +
        Number.parseInt(shbg[3]) * 6 +
        Number.parseInt(shbg[4]) * 4 +
        Number.parseInt(shbg[5]) * 2 +
        Number.parseInt(shbg[6]) * 3 +
        Number.parseInt(shbg[7]) * 5 +
        Number.parseInt(shbg[8]) * 9 +
        Number.parseInt(shbg[9]) * 7

      const div = 11 - (sum % 11)
      const checkDigit = Number.parseInt(shbg[10])

      if (
        (div >= 1 && div <= 9 && checkDigit !== div) ||
        (div === 10 && checkDigit !== 0) ||
        (div === 11 && checkDigit !== 5)
      ) {
        errors.push("Mã kiểm tra không hợp lệ")
      }
    } catch (e) {
      errors.push("Lỗi tính toán mã kiểm tra")
    }

    // Validate service-specific prefixes
    validateServicePrefix(upperServiceCode, upperShbg, isPackageIncident, recnational, errors)
  } else if (upperServiceCode.substring(0, 3) === "UPS") {
    validateUPS(upperShbg, errors)
  } else if (upperServiceCode.substring(0, 3) === "DHL") {
    validateDHL(upperShbg, errors)
  } else {
    errors.push("Độ dài mã vận đơn không hợp lệ")
  }

  return { isValid: errors.length === 0, errors }
}

function validateServicePrefix(
  serviceCode: string,
  shbg: string,
  isPackageIncident: string,
  recnational: string | undefined,
  errors: string[],
) {
  const prefix1 = shbg[0]
  const prefix2 = shbg[1]
  const prefix2Chars = shbg.substring(0, 2)

  switch (serviceCode.substring(0, 3)) {
    case "RTN":
      if (prefix1 !== "R" || !CHAR_SETS.v_list_char_bput.includes(prefix2)) {
        errors.push("Mã RTN phải bắt đầu bằng R + ký tự hợp lệ")
      }
      break
    case "CTN":
      if (prefix1 !== "C" || !CHAR_SETS.v_list_char_bk.includes(prefix2)) {
        errors.push("Mã CTN phải bắt đầu bằng C + ký tự hợp lệ")
      }
      break
    case "PTN":
      if (prefix1 !== "P" || !CHAR_SETS.v_list_char_loseco.includes(prefix2)) {
        errors.push("Mã PTN phải bắt đầu bằng P + ký tự hợp lệ")
      }
      break
    case "ETN":
      if (prefix1 !== "E") {
        errors.push("Mã ETN phải bắt đầu bằng E")
      } else {
        if (isPackageIncident === "1" && prefix2 !== "X") {
          errors.push("Bưu gửi sự vụ phải có tiền tố EX")
        }
        if (!CHAR_SETS.v_list_char_ems_tmdt.includes(prefix2)) {
          errors.push("Ký tự thứ 2 của mã ETN không hợp lệ")
        }
      }
      break
    case "KT1":
      if (prefix1 !== "M" || !CHAR_SETS.v_list_char_kt1.includes(prefix2)) {
        errors.push("Mã KT1 phải bắt đầu bằng M + ký tự hợp lệ")
      }
      break
    case "VNQ":
      if (prefix2Chars !== "QP") {
        errors.push("Mã VNQ phải bắt đầu bằng QP")
      }
      break
    case "PRM":
      if (serviceCode === "PRM004") {
        if (prefix2Chars !== "LA") {
          errors.push("Mã PRM004 phải bắt đầu bằng LA")
        }
      } else {
        if (prefix1 !== "L" || !CHAR_SETS.v_list_char_prm.includes(prefix2)) {
          errors.push("Mã PRM phải bắt đầu bằng L + ký tự hợp lệ")
        }
      }
      break
    case "LQT":
      if (serviceCode === "LQT005") {
        if (prefix2Chars !== "LA") {
          errors.push("Mã LQT005 phải bắt đầu bằng LA")
        }
      } else if (recnational === "CN" || recnational === "TW") {
        if (prefix2Chars !== "LX") {
          errors.push("Mã LQT cho CN/TW phải bắt đầu bằng LX")
        }
      } else {
        if (prefix2Chars !== "LP") {
          errors.push("Mã LQT phải bắt đầu bằng LP")
        }
      }
      break
    // Add more service validations as needed
  }

  // Handle TDT services
  if (["TDT001", "TDT002"].includes(serviceCode)) {
    if (prefix1 !== "E") {
      errors.push("Mã TDT001/TDT002 phải bắt đầu bằng E")
    }
  } else if (serviceCode === "TDT003") {
    if (prefix1 !== "P" || !CHAR_SETS.v_list_char_loseco.includes(prefix2)) {
      errors.push("Mã TDT003 phải bắt đầu bằng P + ký tự hợp lệ")
    }
  } else if (serviceCode === "TDT004") {
    if (prefix1 !== "C" || !CHAR_SETS.v_list_char_kt1.includes(prefix2)) {
      errors.push("Mã TDT004 phải bắt đầu bằng C + ký tự hợp lệ")
    }
  }
}

function validateUPS(shbg: string, errors: string[]) {
  if (shbg.length === 11) {
    if (shbg[0] !== "V") {
      errors.push("Mã UPS 11 ký tự phải bắt đầu bằng V")
    }
    const numberPart = shbg.substring(1)
    for (let i = 0; i < numberPart.length; i++) {
      if (!CHAR_SETS.v_list_num.includes(numberPart[i])) {
        errors.push("Các ký tự sau V phải là số")
        break
      }
    }
  } else if (shbg.length === 18) {
    for (let i = 0; i < shbg.length; i++) {
      if (!CHAR_SETS.v_list_char_and_num.includes(shbg[i])) {
        errors.push("Mã UPS 18 ký tự chỉ được chứa số và chữ cái")
        break
      }
    }
  } else {
    errors.push("Mã UPS phải có độ dài 11 hoặc 18 ký tự")
  }
}

function validateDHL(shbg: string, errors: string[]) {
  if (shbg.length !== 10) {
    errors.push("Mã DHL phải có độ dài 10 ký tự")
  } else {
    for (let i = 0; i < shbg.length - 1; i++) {
      if (!CHAR_SETS.v_list_num.includes(shbg[i])) {
        errors.push("Mã DHL phải là các ký tự số")
        break
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json()

    if (!body.serviceCode || !body.shbg) {
      return NextResponse.json({
        isValid: false,
        errors: ["Service code và mã vận đơn là bắt buộc"],
      })
    }

    const result = validateShbg(body)

    return NextResponse.json({
      isValid: result.isValid,
      errors: result.errors,
      serviceInfo: {
        name: getServiceName(body.serviceCode),
        prefix: getServicePrefix(body.serviceCode, body.recnational),
        format: getServiceFormat(body.serviceCode),
      },
    })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      {
        isValid: false,
        errors: ["Lỗi server khi xử lý yêu cầu"],
      },
      { status: 500 },
    )
  }
}

function getServiceName(serviceCode: string): string {
  const serviceNames: { [key: string]: string } = {
    RTN: "Bưu phẩm đảm bảo",
    CTN: "Bưu kiện trong nước",
    PTN: "Logistic",
    ETN: "EMS",
    TDT001: "TMDT",
    TDT002: "TMDT",
    TDT003: "TMDT > 30KG",
    TDT004: "TMDT < 30kg",
    KT1: "Kiện tổng hợp",
    UPS: "UPS",
    DHL: "DHL",
    VNQ: "VNQ",
    PRM: "PRM",
    LQT: "LQT",
    HCC001: "HCC001",
    HCC002: "HCC002",
    HCC003: "HCC003",
    HCC004: "HCC004",
  }
  return serviceNames[serviceCode] || serviceCode
}

function getServicePrefix(serviceCode: string, recnational?: string): string {
  const upperServiceCode = serviceCode.toUpperCase()

  switch (upperServiceCode.substring(0, 3)) {
    case "RTN":
      return "R + [A-Z]"
    case "CTN":
      return "C + [A-Z]"
    case "PTN":
      return "P + [A-N]"
    case "ETN":
      return "E + [A-Z]"
    case "KT1":
      return "M + [A-Z]"
    case "UPS":
      return "V + [0-9] hoặc [A-Z0-9]"
    case "DHL":
      return "[0-9]"
    case "VNQ":
      return "QP"
    case "PRM":
      return serviceCode === "PRM004" ? "LA" : "L + D"
    case "LQT":
      if (serviceCode === "LQT005") return "LA"
      if (recnational === "CN" || recnational === "TW") return "LX"
      return "LP"
    case "HCC":
      return upperServiceCode.includes("001") || upperServiceCode.includes("002") ? "E + [A-Z]" : "R + [A-Z]"
    default:
      return "Không xác định"
  }
}

function getServiceFormat(serviceCode: string): string {
  const upperServiceCode = serviceCode.toUpperCase()

  if (upperServiceCode.substring(0, 3) === "UPS") {
    return "V + 10 số hoặc 18 ký tự chữ số"
  } else if (upperServiceCode.substring(0, 3) === "DHL") {
    return "10 ký tự số"
  } else {
    return "13 ký tự: Tiền tố + 9 số + Mã kiểm tra + VN"
  }
}
