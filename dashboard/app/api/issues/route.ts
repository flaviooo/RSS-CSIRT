import { NextResponse } from "next/server";
import { createIssue } from "@/lib/redmine";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { subject, description, project, tracker, priority, status } = body;

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const result = await createIssue({
      subject,
      description,
      project: project || process.env.DEFAULT_PROJECT,
      tracker: tracker || process.env.DEFAULT_TRACKER,
      priority: priority || process.env.DEFAULT_PRIORITY,
      status: status || process.env.DEFAULT_STATUS,
    });

    return NextResponse.json({
      success: true,
      message: "Issue created successfully",
      issueId: result.id,
      issueUrl: result.url,
    });
  } catch (error) {
    console.error("Error creating Redmine issue:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to create issues" });
}