import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

interface CheckShbgRequest {
  shbg: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckShbgRequest = await request.json()

    if (!body.shbg) {
      return NextResponse.json({
        exists: false,
        error: "Mã vận đơn không được để trống",
      })
    }

    // Kiểm tra trong bảng PORTAL_ITEM_DTL với trường TT_NUMBER
    const exists = await db.checkShbgExists(body.shbg)

    // Nếu tồn tại, lấy thông tin chi tiết
    let details = null
    if (exists) {
      details = await db.getShbgDetails(body.shbg)
    }

    return NextResponse.json({
      exists,
      ttNumber: body.shbg,
      message: exists ? "Mã vận đơn đã tồn tại trong bảng PORTAL_ITEM_DTL" : "Mã vận đơn chưa tồn tại trong hệ thống",
      details: details
        ? {
            serviceCode: details.SERVICE_CODE,
            poCode: details.PO_CODE,
            createdDate: details.CREATED_DATE?.toISOString(),
            status: details.STATUS,
            senderName: details.SENDER_NAME,
            receiverName: details.RECEIVER_NAME,
            weight: details.WEIGHT,
            amount: details.AMOUNT,
          }
        : null,
    })
  } catch (error) {
    console.error("Check SHBG error:", error)
    return NextResponse.json(
      {
        exists: false,
        error: "Lỗi server khi kiểm tra mã vận đơn trong PORTAL_ITEM_DTL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
