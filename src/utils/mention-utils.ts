/**
 * Utility functions for converting mention tags to display names
 * Backend stores: <@user:123> or <@ai:456>
 * Frontend displays: @JohnDoe or @GPT4
 */

interface User {
  id: number
  username: string
  display_name: string
}

interface AIMember {
  id: number
  name: string
}

/**
 * Convert database tags to display-friendly @names
 * @param content - Message content with tags like <@user:123>
 * @param users - Available users
 * @param aiMembers - Available AI members
 * @returns Content with @displayName
 */
export function convertTagsToMentions(
  content: string,
  users: User[],
  aiMembers: AIMember[]
): string {
  // Match <@user:123> or <@ai:456>
  const tagPattern = /<@(user|ai):(\d+)>/g

  return content.replace(tagPattern, (match, type, id) => {
    const numId = parseInt(id, 10)

    if (type === 'user') {
      const user = users.find((u) => u.id === numId)
      return user ? `@${user.display_name || user.username}` : match
    } else if (type === 'ai') {
      const ai = aiMembers.find((a) => a.id === numId)
      return ai ? `@${ai.name}` : match
    }

    return match
  })
}

/**
 * Check if content contains any mentions
 */
export function hasMentions(content: string): boolean {
  return /<@(user|ai):\d+>/.test(content)
}

/**
 * Extract all mention IDs from content
 */
export function extractMentionIds(content: string): {
  userIds: number[]
  aiIds: number[]
} {
  const tagPattern = /<@(user|ai):(\d+)>/g
  const userIds: number[] = []
  const aiIds: number[] = []

  const matches = [...content.matchAll(tagPattern)]
  for (const match of matches) {
    const [, type, id] = match
    const numId = parseInt(id, 10)

    if (type === 'user' && !userIds.includes(numId)) {
      userIds.push(numId)
    } else if (type === 'ai' && !aiIds.includes(numId)) {
      aiIds.push(numId)
    }
  }

  return { userIds, aiIds }
}

