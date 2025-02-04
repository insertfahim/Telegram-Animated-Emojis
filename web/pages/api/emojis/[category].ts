import { NextApiRequest, NextApiResponse } from "next";

// GitHub repo details
const GITHUB_REPO_OWNER = "insertfahim";
const GITHUB_REPO_NAME = "Telegram-Animated-Emojis";

const emojiCategories: { [key: string]: string } = {
    smileys: "Smileys",
    people: "People",
    "animals-and-nature": "Animals and Nature",
    "animals and nature": "Animals and Nature",
    "food-and-drink": "Food and Drink",
    "food and drink": "Food and Drink",
    activity: "Activity",
    "travel-and-places": "Travel and Places",
    "travel and places": "Travel and Places",
    objects: "Objects",
    symbols: "Symbols",
    flags: "Flags",
};

async function checkRateLimit(response: Response) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const limit = response.headers.get("x-ratelimit-limit");
    const reset = response.headers.get("x-ratelimit-reset");

    console.log("🔑 GitHub API Rate Limit Info:");
    console.log(`- Remaining requests: ${remaining}`);
    console.log(`- Total limit: ${limit}`);
    console.log(
        `- Reset time: ${new Date(Number(reset) * 1000).toLocaleString()}`
    );

    // If using a token, limit should be 5000, otherwise 60
    const isUsingToken = Number(limit) > 60;
    console.log(
        `✨ Token Status: ${isUsingToken ? "Using token" : "No token in use"}`
    );

    return { remaining, limit, reset, isUsingToken };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { category } = req.query;

    // Normalize the category string
    const normalizedCategory = decodeURIComponent(category as string)
        .toLowerCase()
        .trim();

    const folderName = emojiCategories[normalizedCategory];

    console.log("🔍 Received Category:", normalizedCategory);
    console.log("📂 Mapped Folder:", folderName);

    if (!folderName) {
        return res.status(400).json({
            error: "Invalid category",
            receivedCategory: normalizedCategory,
        });
    }

    // GitHub API URL with proper encoding
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${encodeURIComponent(
        folderName
    )}`;

    try {
        // Set up headers with token if available
        const headers: HeadersInit = {
            Accept: "application/vnd.github.v3+json",
        };

        if (process.env.GITHUB_TOKEN) {
            console.log("🔐 Found GitHub token in environment");
            headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
        } else {
            console.log("⚠️ No GITHUB_TOKEN found in environment variables");
        }

        const response = await fetch(githubApiUrl, { headers });

        // Check rate limit status
        const rateLimitInfo = await checkRateLimit(response);

        if (!response.ok) {
            throw new Error(
                `GitHub API responded with status ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return res.status(500).json({
                error: "Unexpected GitHub API response",
                details: "Expected an array of files",
            });
        }

        const emojis = data
            .filter((file) => file.name.endsWith(".webp"))
            .map((file) => ({
                name: file.name.replace(".webp", ""),
                download_url: file.download_url,
            }));

        return res.status(200).json({
            category: folderName,
            emojis,
            rateLimit: rateLimitInfo,
        });
    } catch (error) {
        console.error("❌ Error Fetching Emojis:", error);
        return res.status(500).json({
            error: "Failed to fetch emojis",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
