"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function VersionChecker() {
    const [showUpdate, setShowUpdate] = useState(false)
    const [currentVersion, setCurrentVersion] = useState<string>("")
    const [latestVersion, setLatestVersion] = useState<string>("")

    useEffect(() => {
        let initialVersion = ""

        const checkVersion = async () => {
            try {
                const res = await fetch("/version.json", { cache: "no-store" })
                const data = await res.json()

                if (!initialVersion) {
                    // Lần đầu: lấy làm current
                    initialVersion = data.version
                    setCurrentVersion(data.version)
                    return
                }

                // Lần sau: so sánh với current
                if (data.version !== initialVersion) {
                    setLatestVersion(data.version)
                    setShowUpdate(true)
                }
            } catch (err) {
                console.error("Check version error:", err)
            }
        }

        checkVersion()
        const interval = setInterval(checkVersion, 60_000)
        return () => clearInterval(interval)
    }, [])

    return (
        <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>⚡ Đã có phiên bản mới</DialogTitle>
                </DialogHeader>
                <p className="mb-2">
                    Phiên bản hiện tại: <b>{currentVersion}</b> <br />
                    Phiên bản mới: <b>{latestVersion}</b>
                </p>
                <Button className="w-full" onClick={() => window.location.reload()}>
                    🔄 Tải lại để cập nhật
                </Button>
            </DialogContent>
        </Dialog>
    )
}
