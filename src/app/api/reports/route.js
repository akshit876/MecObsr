// File: app/api/reports/route.js

import { parse } from "json2csv";
import { NextResponse } from "next/server";
import mongoDbService from "../../../../services/mongoDbService";
import logger from "../../../../logger";

export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();

    // Connect to MongoDB if not already connected
    if (!mongoDbService.collection) {
      await mongoDbService.connect("main-data", "records");
    }

    // Fetch data from MongoDB using the service
    const data = await mongoDbService.getRecordsByDateRange(startDate, endDate);

    if (data.length === 0) {
      logger.info("No data found for the specified date range.");
      return NextResponse.json(
        { message: "No data found for the specified date range." },
        { status: 404 }
      );
    }

    // Define fields for CSV based on your data structure
    const fields = [
      "Timestamp",
      "SerialNumber",
      "ScannerData",
      "OCRData",
      "Grade",
      "Status",
      "Shift",
      "VendorCode",
      "Die",
      "PartNo",
      "Date",
    ];

    // Convert data to CSV
    const opts = { fields };
    const csv = parse(data, opts);

    // Create response with CSV data
    const response = new NextResponse(csv);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename=report_${startDate}_to_${endDate}.csv`
    );

    logger.info(
      `Generated CSV report for date range: ${startDate} to ${endDate}`
    );
    return response;
  } catch (error) {
    logger.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
