// Function to export Claude chat conversation
(function exportClaudeChat() {
    // Get all message containers
    const messages = Array.from(document.querySelectorAll('[data-testid="user-message"], .font-claude-message'));
    
    // Build conversation text
    const conversationText = messages.map(msg => {
        // Determine if it's a user message or Claude message
        const isUserMessage = msg.hasAttribute('data-testid');
        const prefix = isUserMessage ? 'Human: ' : 'Claude: ';
        
        // Get the text content, handling different message structures
        const content = msg.querySelector('.whitespace-pre-wrap')?.textContent || msg.textContent || '';
        
        return `${prefix}${content.trim()}\n`;
    }).join('\n');

    // Add metadata
    const timestamp = new Date().toISOString();
    const fullText = `Claude Chat Export\nTimestamp: ${timestamp}\n\n${conversationText}`;

    // Create and trigger download
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-chat-${timestamp.replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
})();
