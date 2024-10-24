// File: app/api/reports/route.js
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

    logger.info(
      `Fetched JSON report for date range: ${startDate} to ${endDate}`
    );
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
