// Configuration for the export
const config = {
    includeTimestamps: true,
    includeFileContent: true,
    exportFormat: 'readable' // 'readable' or 'json'
};

// Format a readable timestamp
function formatTimestamp(isoString) {
    return new Date(isoString).toLocaleString();
}

// Format a single message
function formatMessage(message, config) {
    let formatted = '';
    
    if (config.includeTimestamps) {
        formatted += `[${formatTimestamp(message.created_at)}]\n`;
    }
    
    formatted += `${message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}: `;
    
    // Add message content
    message.content.forEach(content => {
        if (content.type === 'text') {
            formatted += content.text;
        }
         // Add Artifact content if present
        if (content.type === 'tool_use' && content.name === 'artifacts') {
            formatted += '\n\n[Artifact Content]:\n' + content.input.content;
        }
    });
    
    // Add file content if present and enabled
    if (config.includeFileContent && message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
            if (attachment.extracted_content) {
                formatted += '\n\n[Attached File Content]:\n' + attachment.extracted_content;
            }
        });
    }

   
    
    return formatted + '\n\n';
}

// Format the entire conversation
function formatConversation(data, config) {
    if (config.exportFormat === 'json') {
        return JSON.stringify(data, null, 2);
    }

    // Include chat title in the header if available
    let output = data.name 
        ? `Claude Chat Export - ${data.name}\n` 
        : 'Claude Chat Export\n';
    
    output += `Timestamp: ${formatTimestamp(data.created_at)}\n\n`;
    
    data.chat_messages.forEach(message => {
        output += formatMessage(message, config);
    });
    
    // Pass both the formatted content and the chat title to downloadContent
    downloadContent(output, config.exportFormat, data.name);
    
    return output;
}

// Download the formatted content
function downloadContent(content, format, chatTitle) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Format current local time as YYYY-MM-DD_HH-MM-SS
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const localTimestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    // Sanitize the chat title for use in filename (remove unsafe characters)
    const sanitizedTitle = chatTitle ? chatTitle.replace(/[\/\\:*?"<>|]/g, '_') : 'claude-chat';
    
    a.href = url;
    a.download = `${sanitizedTitle}-${localTimestamp}.${format === 'json' ? 'json' : 'md'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to extract a snippet based on starting and ending indices
function extractSnippet(startIndex, endIndex) {
    // Select all <script nonce> tags
    const scriptTags = document.querySelectorAll('script[nonce]');

    // Iterate through each script tag and check for "lastActiveOrg"
    for (let script of scriptTags) {
        const content = script.textContent;
        console.log(content); // Output the content of each script tag

        // Check if the content contains "lastActiveOrg"
        const index = content.indexOf('lastActiveOrg');
        if (index !== -1) {
            console.log('Found "lastActiveOrg" in script content');
            const snippet = content.substring(index + 28, index + 64);
            console.log('Snippet:', snippet); // Log the extracted snippet
            return snippet; // Return the extracted snippet
        }
    }

    console.log('Finished checking all script tags');
    return null; // Return null if "lastActiveOrg" is not found
}

// Main export function
async function exportConversation() {
    try {
        // Get chat UUID from URL
        const chatId = window.location.pathname.split('/').pop();
        console.log('Chat UUID:', chatId);

        // Extract org ID using the new parsing logic
        const orgId = extractSnippet(28, 64);
        if (!orgId) {
            throw new Error('Could not find organization ID');
        }
        console.log('Org ID:', orgId);

        // Construct and fetch the API URL
        const apiUrl = `https://claude.ai/api/organizations/${orgId}/chat_conversations/${chatId}?tree=True&rendering_mode=messages&render_all_tools=true`;
        console.log('Fetching from:', apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch conversation data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Format and download the conversation
        const formatted = formatConversation(data, config);
        
        console.log('Export completed successfully!');
    } catch (error) {
        console.error('Error exporting chat:', error);
        alert('Error exporting chat: ' + error.message);
    }
}

// Run the export
exportConversation();
