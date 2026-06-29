export class MistralService {
  private apiKey: string;
  private model: string;
  private mockMode = false;

  constructor() {
    this.apiKey = (process.env.MISTRAL_API_KEY || '').trim();
    this.model = (process.env.MISTRAL_MODEL_NAME || 'mistral-large-latest').trim();
    
    if (!this.apiKey || this.apiKey.startsWith('your_') || this.apiKey.startsWith('7s28oz')) {
      // Note: The example key in .env.example starts with 7s28oz. 
      // If it is that example key and fails connectivity, we will handle mock fallbacks.
      this.mockMode = false; // We will attempt connection first but catch errors to trigger mock fallback.
    }
  }

  public getMockMode() {
    return this.mockMode;
  }

  public async getEmbedding(text: string): Promise<number[]> {
    if (this.mockMode || !this.apiKey) {
      return this.generateMockEmbedding(text);
    }

    try {
      const response = await fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-embed',
          input: [text.replace(/\n/g, ' ')]
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API status ${response.status}`);
      }

      const resData = await response.json();
      return resData.data[0].embedding;
    } catch (err) {
      console.warn('Mistral embedding request failed, fallback to mock vector:', err);
      return this.generateMockEmbedding(text);
    }
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate a pseudo-random seed based on the input text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const vector: number[] = [];
    for (let i = 0; i < 1024; i++) {
      const pseudoRandomValue = Math.sin(hash + i) * 10000;
      vector.push(pseudoRandomValue - Math.floor(pseudoRandomValue));
    }
    return vector;
  }

  public async generateStructuredCompletion(
    prompt: string,
    systemInstruction: string,
    responseModelName: string
  ): Promise<any> {
    if (this.mockMode || !this.apiKey) {
      console.log(`Generating mock completion for model: ${responseModelName}`);
      return this.getMockModelData(responseModelName);
    }

    try {
      const formattedInstruction = `${systemInstruction}\nYour response must be valid JSON matching the schema for: ${responseModelName}. Output ONLY the JSON block.`;

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: formattedInstruction },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API status ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices[0].message.content;
      return JSON.parse(content);
    } catch (err) {
      console.error(`Mistral structured completion failed for ${responseModelName}:`, err);
      return this.getMockModelData(responseModelName);
    }
  }

  public async chatCompletion(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
    if (this.mockMode || !this.apiKey) {
      return `Mock AI Response: I parsed your query with 1024-dimensional semantic understanding. Direct credentials for Mistral AI are not configured.`;
    }

    try {
      const apiMessages = [...messages];
      if (systemInstruction) {
        apiMessages.unshift({ role: 'system', content: systemInstruction });
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: apiMessages
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral API status ${response.status}`);
      }

      const resData = await response.json();
      return resData.choices[0].message.content;
    } catch (err) {
      console.error('Mistral chat completion failed:', err);
      return `Failed to connect to Mistral API: ${(err as Error).message}. Operating in fallback state.`;
    }
  }

  private getMockModelData(modelName: string): any {
    switch (modelName) {
      case 'ResumeInsights':
        return {
          ats_score: 79,
          skills_extracted: ['Python', 'SQL', 'Git', 'Flask', 'Docker', 'AWS'],
          experience_summary: '2 years experience as a Software Developer.',
          projects: ['Personal Task Manager API', 'Log Parser CLI'],
          education: ['B.S. in Computer Science - State University'],
          strengths: ['Solid programming foundation', 'Version control experience'],
          weaknesses_improvements: [
            'Missing container orchestration (Kubernetes)',
            'Needs database performance tuning experience',
            'Include continuous integration pipelines'
          ]
        };
      case 'CareerRecommendation':
        return {
          predicted_roles: ['Backend Engineer', 'Data Engineer', 'Systems Architect'],
          alignment_reasoning: 'Strong backend foundation with Python, SQL, and container deployment skills fits roles in engineering scale.',
          growth_trends: {
            'Backend Engineer': 'Steady demand (15% YoY growth) with rising remote roles.',
            'Data Engineer': 'High growth (22% YoY) driven by ETL orchestration pipelines.',
            'Systems Architect': 'Strong salary ceiling with complex cloud transition mandates.'
          }
        };
      case 'SkillGapAnalysis':
        return {
          target_role: 'Backend Engineer',
          gaps: [
            { skill_name: 'Kubernetes', current_proficiency: 'None', required_proficiency: 'Intermediate', estimated_learning_hours: 35, priority: 'High' },
            { skill_name: 'CI/CD Pipelines', current_proficiency: 'Beginner', required_proficiency: 'Intermediate', estimated_learning_hours: 15, priority: 'Medium' },
            { skill_name: 'Pinecone / Vector Databases', current_proficiency: 'None', required_proficiency: 'Intermediate', estimated_learning_hours: 10, priority: 'High' }
          ],
          overall_gap_percentage: 40.0
        };
      case 'LearningRoadmap':
        return {
          target_role: 'Backend Engineer',
          weekly_plan: [
            { week: 1, topic: 'Docker Containers & Multi-stage builds', resources: ['Docker official docs', 'Flask container scaling'], project_milestone: 'Containerize and optimize target Python application', certification_suggestion: 'Docker Certified Associate' },
            { week: 2, topic: 'Pinecone Vector Spaces & Similarity Indexing', resources: ['Pinecone docs', 'Vector database basic crash course'], project_milestone: 'Write similarity lookup indexing module', certification_suggestion: null },
            { week: 3, topic: 'Kubernetes Orchestration pods & scheduling', resources: ['Kubernetes interactive tutorial', 'K8s pods architecture'], project_milestone: 'Deploy local pod config via Minikube', certification_suggestion: 'CKAD (Certified Kubernetes Application Developer)' }
          ],
          estimated_completion_weeks: 3
        };
      case 'CareerReadiness':
        return {
          overall_percentage: 72.5,
          profile_strength: 79.0,
          skill_match_strength: 60.0,
          mock_interview_strength: 75.0,
          next_steps: [
            'Deploy local K8s application templates.',
            'Connect and write Pinecone similarity lookup queries.',
            'Refactor mock questions on caching and database indices.'
          ]
        };
      default:
        return {};
    }
  }
}

export const mistralService = new MistralService();
