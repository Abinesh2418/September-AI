// Natural Language Understanding for Intent Detection
class IntentDetector {
  constructor() {
    // Intent patterns using regex and keywords
    this.intents = {
      access_request: {
        keywords: ['access', 'need', 'permission', 'grant', 'allow', 'enable'],
        patterns: [
          /need access to (.+)/i,
          /can I (?:get|have) access to (.+)/i,
          /(?:grant|give) (?:me )?access to (.+)/i,
          /I need (.+) access/i
        ],
        confidence: 0.8
      },
      ticket_creation: {
        keywords: ['broken', 'not working', 'issue', 'problem', 'help', 'fix', 'repair', 'error', 'laptop', 'computer'],
        patterns: [
          /(?:my )?(.+) (?:is|isn't|not) working/i,
          /(?:having|got) (?:a )?problem with (.+)/i,
          /(.+) (?:is )?broken/i,
          /(?:issue|problem) with (.+)/i,
          /(.+) (?:doesn't|dont|wont) work/i,
          /(?:my )?(.+) (?:has|have) (?:a )?problem/i
        ],
        confidence: 0.8  // Increased confidence for better matches
      },
      ticket_query: {
        keywords: ['show', 'list', 'view', 'display', 'tickets', 'open', 'pending', 'how many', 'count', 'available'],
        patterns: [
          /(?:show|display|list) (?:me )?(?:all |the )?(?:open |pending )?tickets/i,
          /(?:how many|count) (?:tickets )?(?:are )?(?:available|open|pending)/i,
          /(?:what|show) (?:are|is) (?:the|my) (?:open )?tickets/i,
          /(?:tickets|ticket) (?:available|open|pending|list)/i,
          /(?:available|open|pending) tickets/i
        ],
        confidence: 0.8
      },
      access_request_query: {
        keywords: ['access', 'request', 'permission', 'resource', 'pending', 'approved', 'provisioning'],
        patterns: [
          /(?:how many|count) (?:access )?requests?/i,
          /(?:show|display|list) (?:me )?(?:all |the )?(?:access )?requests?/i,
          /(?:what|show) (?:are|is) (?:the|my) access requests?/i,
          /access (?:request|permission) (?:status|summary)/i,
          /(?:pending|approved) (?:access|requests?)/i,
          /(?:resource|system) access/i,
          /(?:who|what).*(?:requested|access)/i,
          /access.*(?:today|pending|approved|status)/i,
          /(?:list|show).*(?:pending|approved).*access/i
        ],
        confidence: 0.8
      },
      onboarding_query: {
        keywords: ['onboarding', 'new hire', 'checklist', 'employee', 'orientation', 'setup', 'provision', 'welcome'],
        patterns: [
          /(?:show|display|list) (?:me )?(?:the )?(?:onboarding )?checklist/i,
          /(?:how many|count) (?:onboarding )?(?:requests?|checklists?)/i,
          /(?:show|list) (?:me )?(?:all |the )?onboarding (?:requests?)?/i,
          /(?:what|show) (?:are|is) (?:the|my) onboarding/i,
          /onboarding (?:status|progress|summary)/i,
          /(?:pending|completed) onboarding/i,
          /new (?:hire|employee) (?:setup|onboarding)/i,
          /(?:employee|staff) onboarding/i,
          /onboarding (?:requests?|checklist)/i,
          /(?:who|what).*onboarding/i,
          /onboarding.*(?:today|pending|completed)/i
        ],
        confidence: 0.8
      },
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
        patterns: [
          /^(?:hello|hi|hey|greetings)/i,
          /good (?:morning|afternoon|evening)/i
        ],
        confidence: 0.9
      },
      help: {
        keywords: ['help', 'what can you do', 'how', 'guide', 'assist'],
        patterns: [
          /(?:can you )?help(?: me)?/i,
          /what can you do/i,
          /how (?:do I|to)/i
        ],
        confidence: 0.85
      },
      status_check: {
        keywords: ['status', 'state', 'progress', 'update'],
        patterns: [
          /(?:what's|what is) (?:the )?status/i,
          /check status of (.+)/i,
          /status (?:on|of) (.+)/i
        ],
        confidence: 0.7
      },
      team_progress: {
        keywords: ['team', 'progress', 'team progress', 'show', 'display', 'members', 'colleagues'],
        patterns: [
          /(?:show|display|list) (?:me )?(?:the )?team progress/i,
          /(?:what's|what is) (?:the )?team progress/i,
          /team progress/i,
          /progress of (?:the )?team/i,
          /show (?:me )?team/i,
          /team status/i
        ],
        confidence: 0.8
      },
      employee_management: {
        keywords: ['employees', 'list', 'show', 'display', 'staff', 'workers', 'all employees'],
        patterns: [
          /(?:show|display|list) (?:me )?(?:all )?employees/i,
          /(?:list|show) (?:all )?(?:staff|workers)/i,
          /(?:who are|show) (?:the )?employees/i,
          /employee (?:list|directory)/i,
          /all employees/i,
          /staff list/i,
          /show staff/i
        ],
        confidence: 0.8
      },
      employee_progress: {
        keywords: ['progress', 'completed', 'work', 'task', 'status', 'done', 'finished'],
        patterns: [
          /(?:what is|what's) (?:the )?progress of ([\w\s]+)/i,
          /(?:has|did) ([\w\s]+) completed? (?:the )?work/i,
          /(?:show|display) ([\w\s]+)'?s? progress/i,
          /progress of ([\w\s]+)/i,
          /(?:is|has) ([\w\s]+) (?:done|finished|completed)/i,
          /(?:how is|status of) ([\w\s]+)/i,
          /([\w\s]+) (?:task|work) (?:status|progress)/i,
          /(?:check|show) ([\w\s]+) (?:progress|status)/i
        ],
        confidence: 0.9
      }
    };
  }

  // Detect intent from user message
  detect(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = {
      intent: 'unknown',
      confidence: 0,
      entities: {}
    };

    for (const [intentName, intentData] of Object.entries(this.intents)) {
      let score = 0;
      const entities = {};

      // Check keywords
      const keywordMatches = intentData.keywords.filter(kw => 
        lowerMessage.includes(kw.toLowerCase())
      );
      score += (keywordMatches.length / intentData.keywords.length) * 0.4;

      // Check patterns
      for (const pattern of intentData.patterns) {
        const match = message.match(pattern);
        if (match) {
          score += 0.6;
          if (match[1]) {
            entities.extracted = match[1].trim();
          }
          break;
        }
      }

      // Apply confidence modifier
      score *= intentData.confidence;

      if (score > bestMatch.confidence) {
        bestMatch = {
          intent: intentName,
          confidence: score,
          entities
        };
      }
    }

    return bestMatch;
  }

  // Generate suggested actions based on intent
  getSuggestions(intent) {
    const suggestions = {
      access_request: [
        'I need access to Figma',
        'Can I get access to GitHub?',
        'Grant me access to AWS console'
      ],
      ticket_creation: [
        'My laptop is not working',
        'Issue with printer on 3rd floor',
        'Email client keeps crashing'
      ],
      ticket_query: [
        'Show open tickets from this week',
        'List all my tickets',
        'Display pending tickets'
      ],
      onboarding_query: [
        'Show onboarding checklist for new hire',
        'New employee onboarding steps',
        'Create onboarding for Sarah'
      ],
      team_progress: [
        'Show me team progress',
        'What is the team status?',
        'Display team performance'
      ],
      employee_management: [
        'List all employees',
        'Show staff directory',
        'Display employee list'
      ],
      employee_progress: [
        'What is the progress of John Doe?',
        'Has Jane Smith completed the work?',
        'Show Mike Wilson progress'
      ],
      greeting: [
        'What can you help me with?',
        'Show me what you can do'
      ],
      unknown: [
        'I need access to Figma',
        'Show open tickets',
        'Create onboarding checklist'
      ]
    };

    return suggestions[intent] || suggestions.unknown;
  }
}

module.exports = new IntentDetector();
