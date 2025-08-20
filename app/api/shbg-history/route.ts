import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search")

    let history
    if (search) {
      history = await db.searchShbg(search)
    } else {
      history = await db.getShbgHistory(limit)
    }

    // Format data để phù hợp với frontend
    const formattedHistory = history.map((item) => ({
      shbg: item.ttNumber,
      serviceCode: item.serviceCode,
      createdDate: item.createdDate,
      status: item.status,
      poCode: item.poCode,
      senderName: item.senderName,
      receiverName: item.receiverName,
    }))

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      total: formattedHistory.length,
      source: "PORTAL_ITEM_DTL",
    })
  } catch (error) {
    console.error("Get SHBG history error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi server khi lấy lịch sử mã vận đơn từ PORTAL_ITEM_DTL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
