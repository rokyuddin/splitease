"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useStore } from "@/lib/store"
import { Download, FileText, Table } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface ExportModalProps {
  groupId: string
}

export function ExportModal({ groupId }: ExportModalProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState<"pdf" | "csv">("pdf")
  const [dataType, setDataType] = useState<"all" | "expenses" | "balances">("all")
  const [loading, setLoading] = useState(false)

  const { currentGroup, expenses, participants, settlements, calculateBalances } = useStore()

  const exportToPDF = () => {
    if (!currentGroup) return

    const doc = new jsPDF()
    const balances = calculateBalances(groupId)

    // Header
    doc.setFontSize(20)
    doc.text(`${currentGroup.name} - Expense Report`, 20, 20)
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)

    let yPosition = 50

    if (dataType === "all" || dataType === "expenses") {
      // Expenses Table
      doc.setFontSize(16)
      doc.text("Expenses", 20, yPosition)
      yPosition += 10

      const expenseData = expenses.map((expense) => [
        expense.title,
        `৳${expense.amount.toFixed(2)}`,
        expense.payer_name || "Unknown",
        new Date(expense.date).toLocaleDateString(),
      ])
      ;(doc as any).autoTable({
        head: [["Description", "Amount", "Paid By", "Date"]],
        body: expenseData,
        startY: yPosition,
        theme: "grid",
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20
    }

    if (dataType === "all" || dataType === "balances") {
      // Balances Table
      doc.setFontSize(16)
      doc.text("Balances", 20, yPosition)
      yPosition += 10

      const balanceData = balances.map((balance) => [
        balance.participant_name,
        `৳${balance.total_paid.toFixed(2)}`,
        `৳${balance.total_owed.toFixed(2)}`,
        `৳${balance.net_balance.toFixed(2)}`,
        balance.net_balance > 0 ? "Gets back" : balance.net_balance < 0 ? "Owes" : "Settled",
      ])
      ;(doc as any).autoTable({
        head: [["Name", "Total Paid", "Total Owed", "Net Balance", "Status"]],
        body: balanceData,
        startY: yPosition,
        theme: "grid",
      })
    }

    doc.save(`${currentGroup.name.replace(/\s+/g, "_")}_report.pdf`)
  }

  const exportToCSV = () => {
    if (!currentGroup) return

    let csvContent = ""
    const balances = calculateBalances(groupId)

    if (dataType === "all" || dataType === "expenses") {
      csvContent += "EXPENSES\n"
      csvContent += "Description,Amount,Paid By,Date\n"
      expenses.forEach((expense) => {
        csvContent += `"${expense.title}",${expense.amount},"${expense.payer_name || "Unknown"}","${new Date(
          expense.date,
        ).toLocaleDateString()}"\n`
      })
      csvContent += "\n"
    }

    if (dataType === "all" || dataType === "balances") {
      csvContent += "BALANCES\n"
      csvContent += "Name,Total Paid,Total Owed,Net Balance,Status\n"
      balances.forEach((balance) => {
        const status = balance.net_balance > 0 ? "Gets back" : balance.net_balance < 0 ? "Owes" : "Settled"
        csvContent += `"${balance.participant_name}",${balance.total_paid},${balance.total_owed},${balance.net_balance},"${status}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${currentGroup.name.replace(/\s+/g, "_")}_report.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      if (exportType === "pdf") {
        exportToPDF()
      } else {
        exportToCSV()
      }
      setOpen(false)
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Group Data</DialogTitle>
          <DialogDescription>Choose the format and data to export</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={exportType} onValueChange={(value: "pdf" | "csv") => setExportType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center">
                  <Table className="h-4 w-4 mr-2" />
                  CSV Spreadsheet
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Data to Export</Label>
            <RadioGroup value={dataType} onValueChange={(value: "all" | "expenses" | "balances") => setDataType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Data (Expenses + Balances)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expenses" id="expenses" />
                <Label htmlFor="expenses">Expenses Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balances" id="balances" />
                <Label htmlFor="balances">Balances Only</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
