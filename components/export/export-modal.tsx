"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { Download, FileText, Table } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
}

export function ExportModal({ open, onOpenChange, groupId }: ExportModalProps) {
  const { currentGroup, expenses, participants, calculateBalances } = useStore()
  const [exportType, setExportType] = useState<"pdf" | "csv">("pdf")
  const [exportData, setExportData] = useState<"expenses" | "balances" | "all">("all")
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!currentGroup) return

    setLoading(true)
    try {
      if (exportType === "pdf") {
        await exportToPDF()
      } else {
        exportToCSV()
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    const doc = new jsPDF()
    const balances = calculateBalances(groupId)

    // Title
    doc.setFontSize(20)
    doc.text(`${currentGroup!.name} - Expense Report`, 20, 20)

    if (currentGroup!.description) {
      doc.setFontSize(12)
      doc.text(currentGroup!.description, 20, 30)
    }

    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40)

    let yPosition = 50

    // Export expenses
    if (exportData === "expenses" || exportData === "all") {
      doc.setFontSize(16)
      doc.text("Expenses", 20, yPosition)
      yPosition += 10

      const expenseData = expenses.map((expense) => [
        expense.title,
        `৳${expense.amount.toFixed(2)}`,
        expense.payer_name,
        new Date(expense.date).toLocaleDateString(),
        expense.splits.map((s) => `${s.participant_name}: ৳${s.amount.toFixed(2)}`).join(", "),
      ])
      ;(doc as any).autoTable({
        head: [["Title", "Amount", "Paid By", "Date", "Split"]],
        body: expenseData,
        startY: yPosition,
        styles: { fontSize: 8 },
        columnStyles: { 4: { cellWidth: 60 } },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20
    }

    // Export balances
    if (exportData === "balances" || exportData === "all") {
      doc.setFontSize(16)
      doc.text("Balances", 20, yPosition)
      yPosition += 10

      const balanceData = balances.map((balance) => [
        balance.participant_name,
        `৳${balance.total_paid.toFixed(2)}`,
        `৳${balance.total_owed.toFixed(2)}`,
        `৳${balance.net_balance.toFixed(2)}`,
        balance.net_balance >= 0 ? "Owed" : "Owes",
      ])
      ;(doc as any).autoTable({
        head: [["Participant", "Total Paid", "Total Owed", "Net Balance", "Status"]],
        body: balanceData,
        startY: yPosition,
        styles: { fontSize: 8 },
      })
    }

    doc.save(`${currentGroup!.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.pdf`)
  }

  const exportToCSV = () => {
    let csvContent = ""
    const balances = calculateBalances(groupId)

    // Header
    csvContent += `Group: ${currentGroup!.name}\n`
    if (currentGroup!.description) {
      csvContent += `Description: ${currentGroup!.description}\n`
    }
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`

    // Export expenses
    if (exportData === "expenses" || exportData === "all") {
      csvContent += "EXPENSES\n"
      csvContent += "Title,Amount,Paid By,Date,Splits\n"

      expenses.forEach((expense) => {
        const splits = expense.splits.map((s) => `${s.participant_name}: ৳${s.amount.toFixed(2)}`).join("; ")
        csvContent += `"${expense.title}",${expense.amount},"${expense.payer_name}","${expense.date}","${splits}"\n`
      })

      csvContent += "\n"
    }

    // Export balances
    if (exportData === "balances" || exportData === "all") {
      csvContent += "BALANCES\n"
      csvContent += "Participant,Total Paid,Total Owed,Net Balance,Status\n"

      balances.forEach((balance) => {
        const status = balance.net_balance >= 0 ? "Owed" : "Owes"
        csvContent += `"${balance.participant_name}",${balance.total_paid},${balance.total_owed},${balance.net_balance},"${status}"\n`
      })
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${currentGroup!.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>Export your group's expenses and balances</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="exportType">Export Format</Label>
            <Select value={exportType} onValueChange={(value: "pdf" | "csv") => setExportType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    CSV Spreadsheet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exportData">Data to Export</Label>
            <Select value={exportData} onValueChange={(value: "expenses" | "balances" | "all") => setExportData(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="expenses">Expenses Only</SelectItem>
                <SelectItem value="balances">Balances Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
