import { ConvexReactClient } from "convex/react";

// 在開發環境中，如果沒有設置 CONVEX_URL，使用一個佔位符
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export { convex };