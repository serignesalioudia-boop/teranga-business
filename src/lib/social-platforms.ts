export const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "tiktok"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];