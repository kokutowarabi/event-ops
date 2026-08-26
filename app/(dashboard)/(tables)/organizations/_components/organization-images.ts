const ORGANIZATION_IMAGE_FILE_NAMES: Record<string, string> = {
  "org-1": "ChatGPT Image 2026年8月26日 19_23_22 (2).png",
  "org-2": "ChatGPT Image 2026年8月26日 18_16_12 (5).png",
  "org-3": "ChatGPT Image 2026年8月26日 18_16_17 (9).png",
  "org-4": "ChatGPT Image 2026年8月26日 19_23_22 (1).png",
  "org-5": "ChatGPT Image 2026年8月26日 18_16_06 (2).png",
  "org-6": "ChatGPT Image 2026年8月26日 19_23_22 (5).png",
  "org-7": "ChatGPT Image 2026年8月26日 19_23_22 (3).png",
  "org-8": "ChatGPT Image 2026年8月26日 18_16_10 (4).png",
  "org-9": "ChatGPT Image 2026年8月26日 18_16_07 (3).png",
  "org-10": "ChatGPT Image 2026年8月26日 18_16_18 (10).png",
  "org-11": "ChatGPT Image 2026年8月26日 19_23_25 (7).png",
  "org-12": "ChatGPT Image 2026年8月26日 18_16_15 (8).png",
  "org-13": "ChatGPT Image 2026年8月26日 19_23_25 (6).png",
  "org-14": "ChatGPT Image 2026年8月26日 18_16_06 (1).png",
  "org-15": "ChatGPT Image 2026年8月26日 18_16_13 (6).png",
  "org-16": "ChatGPT Image 2026年8月26日 19_23_25 (8).png",
  "org-17": "ChatGPT Image 2026年8月26日 19_23_22 (4).png",
  "org-18": "ChatGPT Image 2026年8月26日 19_23_25 (9).png",
  "org-19": "ChatGPT Image 2026年8月26日 19_23_26 (10).png",
  "org-20": "ChatGPT Image 2026年8月26日 18_16_15 (7).png",
}

export function getOrganizationImageSrc(organizationId: string) {
  const fileName = ORGANIZATION_IMAGE_FILE_NAMES[organizationId]
  return fileName ? `/organizations/${fileName}` : null
}
