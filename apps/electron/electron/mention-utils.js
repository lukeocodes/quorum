/**
 * Utility functions for handling @mentions in messages
 * Converts between user-friendly @names and database tags like <@user:123> or <@ai:456>
 */

/**
 * Convert user-typed @mentions to database tags
 * @param {string} content - Message content with @names
 * @param {Array} users - Available users with id, username, display_name
 * @param {Array} aiMembers - Available AI members with id, name
 * @returns {Object} { content: tagged content, mentionedUsers: [], mentionedAIs: [] }
 */
function convertMentionsToTags(content, users, aiMembers) {
  const mentionedUsers = [];
  const mentionedAIs = [];
  
  // Match @name or @"name with spaces"
  const mentionPattern = /@(?:"([^"]+)"|(\w+))/g;
  
  let taggedContent = content;
  const matches = [...content.matchAll(mentionPattern)];
  
  // Process matches in reverse order to maintain string positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const mentionName = (match[1] || match[2]).toLowerCase().trim();
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    
    // Try to find user first
    const user = users.find(u => 
      u.username.toLowerCase() === mentionName ||
      u.display_name.toLowerCase() === mentionName
    );
    
    if (user) {
      const tag = `<@user:${user.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentionedUsers.find(u => u.id === user.id)) {
        mentionedUsers.push(user);
      }
      continue;
    }
    
    // Try to find AI member
    const ai = aiMembers.find(a => 
      a.name.toLowerCase().replace(/\s+/g, '') === mentionName
    );
    
    if (ai) {
      const tag = `<@ai:${ai.id}>`;
      taggedContent = taggedContent.substring(0, matchStart) + tag + taggedContent.substring(matchEnd);
      if (!mentionedAIs.find(a => a.id === ai.id)) {
        mentionedAIs.push(ai);
      }
    }
  }
  
  return {
    content: taggedContent,
    mentionedUsers,
    mentionedAIs
  };
}

/**
 * Convert database tags to display-friendly @names
 * @param {string} content - Message content with tags like <@user:123>
 * @param {Array} users - Available users with id, username, display_name
 * @param {Array} aiMembers - Available AI members with id, name
 * @returns {string} Content with @displayName
 */
function convertTagsToMentions(content, users, aiMembers) {
  // Match <@user:123> or <@ai:456>
  const tagPattern = /<@(user|ai):(\d+)>/g;
  
  return content.replace(tagPattern, (match, type, id) => {
    const numId = parseInt(id, 10);
    
    if (type === 'user') {
      const user = users.find(u => u.id === numId);
      return user ? `@${user.display_name || user.username}` : match;
    } else if (type === 'ai') {
      const ai = aiMembers.find(a => a.id === numId);
      return ai ? `@${ai.name}` : match;
    }
    
    return match;
  });
}

/**
 * Extract mention IDs from tagged content
 * @param {string} content - Message content with tags
 * @returns {Object} { userIds: [], aiIds: [] }
 */
function extractMentionIds(content) {
  const tagPattern = /<@(user|ai):(\d+)>/g;
  const userIds = [];
  const aiIds = [];
  
  const matches = [...content.matchAll(tagPattern)];
  for (const match of matches) {
    const [, type, id] = match;
    const numId = parseInt(id, 10);
    
    if (type === 'user' && !userIds.includes(numId)) {
      userIds.push(numId);
    } else if (type === 'ai' && !aiIds.includes(numId)) {
      aiIds.push(numId);
    }
  }
  
  return { userIds, aiIds };
}

module.exports = {
  convertMentionsToTags,
  convertTagsToMentions,
  extractMentionIds
};

