import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StyledTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  const headers = [
    { key: "SerialNumber", label: "Serial Number", width: "150px" },
    { key: "MarkingData", label: "Marking Data", width: "150px" },
    { key: "ScannerData", label: "Scanner Data", width: "150px" },
    { key: "Result", label: "Result", width: "100px" },
    { key: "Timestamp", label: "Timestamp", width: "200px" },
  ];

  return (
    <Card className="w-full mt-8 shadow-lg overflow-hidden">
      <CardHeader>
        <h1 className="text-2xl font-bold text-gray-800">Scan Results</h1>
      </CardHeader>
      <CardContent>
        {/* Fixed Header Table */}
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead
                  key={header.key}
                  style={{ width: header.width }}
                  className="bg-gray-50 text-left text-sm font-medium text-gray-500 py-3 px-4 border-b"
                >
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto max-h-[36rem] overflow-y-auto">
          <Table className="w-full">
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {headers.map((header) => (
                    <TableCell
                      key={header.key}
                      style={{ width: header.width }}
                      className="text-sm text-gray-700 py-3 px-4 whitespace-nowrap overflow-hidden text-ellipsis border-b"
                    >
                      {header.key === "Timestamp"
                        ? new Date(row[header.key]).toLocaleString()
                        : row[header.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StyledTable;
