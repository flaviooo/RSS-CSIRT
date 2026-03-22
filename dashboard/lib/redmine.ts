import axios from "axios";

const redmineClient = axios.create({
  baseURL: process.env.REDMINE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
  },
  timeout: 30000,
});

interface IssueData {
  subject: string;
  description: string;
  project?: string;
  tracker?: string;
  priority?: string;
  status?: string;
}

interface CreateIssueResult {
  id: number;
  url: string;
}

async function getProjectIdentifier(projectName: string | undefined): Promise<string | undefined> {
  if (!projectName) return undefined;

  try {
    const response = await redmineClient.get("/projects.json", {
      params: { limit: 100 },
    });

    const project = response.data.projects.find(
      (p: { name: string; identifier: string }) =>
        p.name.toLowerCase() === projectName.toLowerCase() ||
        p.identifier.toLowerCase() === projectName.toLowerCase()
    );

    return project?.identifier || projectName;
  } catch {
    return projectName;
  }
}

async function getTrackerId(trackerName: string | undefined): Promise<number | null> {
  if (!trackerName) return null;

  try {
    const response = await redmineClient.get("/trackers.json");
    const tracker = response.data.trackers.find(
      (t: { name: string }) => t.name.toLowerCase() === trackerName.toLowerCase()
    );
    return tracker?.id || null;
  } catch {
    return null;
  }
}

async function getPriorityId(priorityName: string | undefined): Promise<number | null> {
  if (!priorityName) return null;

  try {
    const response = await redmineClient.get("/enumerations/issue_priorities.json");
    const priority = response.data.issue_priorities.find(
      (p: { name: string }) => p.name.toLowerCase() === priorityName.toLowerCase()
    );
    return priority?.id || null;
  } catch {
    return null;
  }
}

async function getStatusId(statusName: string | undefined): Promise<number | null> {
  if (!statusName) return null;

  try {
    const response = await redmineClient.get("/issue_statuses.json");
    const status = response.data.issue_statuses.find(
      (s: { name: string }) => s.name.toLowerCase() === statusName.toLowerCase()
    );
    return status?.id || null;
  } catch {
    return null;
  }
}

export async function createIssue(data: IssueData): Promise<CreateIssueResult> {
  const issue: Record<string, unknown> = {
    subject: data.subject,
    description: data.description,
  };

  if (data.project) {
    const projectId = await getProjectIdentifier(data.project);
    console.log("[REDMINE] Project resolved:", projectId);
    issue.project_id = projectId;
  }

  if (data.tracker) {
    const trackerId = await getTrackerId(data.tracker);
    console.log("[REDMINE] Tracker resolved:", trackerId, "from:", data.tracker);
    if (trackerId) {
      issue.tracker_id = trackerId;
    }
  }

  if (data.priority) {
    const priorityId = await getPriorityId(data.priority);
    console.log("[REDMINE] Priority resolved:", priorityId, "from:", data.priority);
    if (priorityId) {
      issue.priority_id = priorityId;
    }
  }

  if (data.status) {
    const statusId = await getStatusId(data.status);
    console.log("[REDMINE] Status resolved:", statusId, "from:", data.status);
    if (statusId) {
      issue.status_id = statusId;
    }
  }

  console.log("[REDMINE] Sending issue payload:", JSON.stringify({ issue }, null, 2));

  try {
    const response = await redmineClient.post("/issues.json", { issue });

    const createdIssue = response.data.issue;
    return {
      id: createdIssue.id,
      url: `${process.env.REDMINE_URL}/issues/${createdIssue.id}`,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("=== REDMINE ERROR ===");
      console.error("Status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      console.error("====================");
    }
    throw error;
  }
}

export async function checkRedmineConnection(): Promise<boolean> {
  try {
    await redmineClient.get("/users/current.json");
    return true;
  } catch {
    return false;
  }
}

export async function getProjects(): Promise<Array<{ id: number; name: string; identifier: string }>> {
  try {
    const response = await redmineClient.get("/projects.json", {
      params: { limit: 100 },
    });
    return response.data.projects;
  } catch {
    return [];
  }
}

export async function getTrackers(): Promise<Array<{ id: number; name: string }>> {
  try {
    const response = await redmineClient.get("/trackers.json");
    return response.data.trackers;
  } catch {
    return [];
  }
}

export async function getPriorities(): Promise<Array<{ id: number; name: string }>> {
  try {
    const response = await redmineClient.get("/enumerations/issue_priorities.json");
    return response.data.issue_priorities;
  } catch {
    return [];
  }
}