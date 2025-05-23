import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Share2, MessageSquare } from 'lucide-react';
import Image from 'next/image';

interface ArticleDetailViewProps {
  articleId: string;
  onClose: () => void;
}

// Mock article data - In a real application, this would come from an API or database
const articles = {
  'nicorai-website': {
    id: 'nicorai-website',
    title: "Building NicorAI: A Modern AI-Powered Website Architecture",
    date: "May 19, 2025",
    category: "AI Trends",
    author: "NicorAI Team",
    readTime: "15 min read",
    content: [
      {
        type: 'paragraph',
        content: 'In today\'s rapidly evolving digital landscape, businesses need more than just static websites—they need intelligent, interactive experiences that can engage users and showcase their technological capabilities. This case study explores the development of NicorAI\'s website MVP, a sophisticated AI-powered web application that demonstrates how modern architecture patterns can create seamless user experiences while maintaining scalability and cost efficiency.'
      },
      {
        type: 'paragraph',
        content: 'The project represents a perfect blend of custom development and innovative service orchestration, resulting in a system that not only serves as a company showcase but also as a functional demonstration of AI capabilities in web development.'
      },
      {
        type: 'heading',
        content: 'Project Overview'
      },
      {
        type: 'paragraph',
        content: 'NicorAI\'s website serves multiple purposes: it\'s a company portfolio, an AI demonstration platform, and a sophisticated chat interface that provides intelligent responses about the company\'s services and capabilities. The project was designed with modularity at its core, ensuring that each component could be developed, deployed, and scaled independently.'
      },
      {
        type: 'heading',
        content: 'Key Features Delivered'
      },
      {
        type: 'paragraph',
        content: 'The final product includes several standout features that demonstrate both technical sophistication and user-focused design:'
      },
      {
        type: 'list',
        items: [
          'Interactive AI Chat Interface: The centerpiece of the application is a sophisticated chat system where users can engage with NicorAI\'s AI assistant.',
          'Dynamic Content Visualization: Rather than serving static responses, the system intelligently determines when to display structured data.',
          'Company Showcase Pages: Beautifully designed sections highlighting NicorAI\'s services, portfolio, team, and vision.',
          'Smart Navigation System: A well-designed sidebar that includes both section navigation and chat history management.'
        ]
      },
      {
        type: 'heading',
        content: 'Architectural Innovation'
      },
      {
        type: 'subheading',
        content: 'The Modular Approach'
      },
      {
        type: 'paragraph',
        content: 'The architecture follows a strict modular pattern with six distinct components, each serving a specific purpose while maintaining independence from others. This separation allows for independent development, scalable deployment, technology flexibility, and cost optimization.'
      },
      {
        type: 'heading',
        content: 'Frontend Excellence'
      },
      {
        type: 'paragraph',
        content: 'Built with Next.js 15.3 and React 19, the frontend leverages modern web development practices including server-side rendering, component-based architecture, advanced animations with Framer Motion, and responsive design. The frontend maintains chat state locally while seamlessly communicating with backend services.'
      },
      {
        type: 'heading',
        content: 'AI Integration and Knowledge Management'
      },
      {
        type: 'paragraph',
        content: 'The system implements a sophisticated RAG (Retrieval-Augmented Generation) pipeline that combines the power of large language models with domain-specific knowledge. This includes content ingestion, vector storage, query processing, and contextual response generation.'
      },
      {
        type: 'heading',
        content: 'Technology Stack and Service Integration'
      },
      {
        type: 'paragraph',
        content: 'The project leverages a carefully selected technology stack including Next.js 15.3, React 19, TypeScript, Tailwind CSS for frontend; Node.js and Express.js for the API layer; n8n workflows for orchestration; and various AI services including Anthropic Claude and Cohere embeddings.'
      },
      {
        type: 'heading',
        content: 'Performance and User Experience'
      },
      {
        type: 'paragraph',
        content: 'The architecture prioritizes performance through multiple optimization strategies, achieving first contentful paint under 1 second, cached responses under 300ms, and AI response times under 1.5 seconds for complex queries.'
      },
      {
        type: 'heading',
        content: 'Deployment and Scalability'
      },
      {
        type: 'paragraph',
        content: 'The modular architecture enables a sophisticated deployment strategy with frontend on Vercel, API Gateway on Render, n8n Cloud for backend workflows, and various cloud-native solutions for data services.'
      },
      {
        type: 'heading',
        content: 'Lessons Learned and Best Practices'
      },
      {
        type: 'paragraph',
        content: 'Using n8n for backend orchestration provided unexpected benefits including rapid development, easy integration, and superior debugging capabilities. The strict modular approach enabled parallel development, isolated testing, and incremental deployment.'
      },
      {
        type: 'heading',
        content: 'Future Enhancements'
      },
      {
        type: 'paragraph',
        content: 'Several areas were identified for future enhancement, including enhanced error handling, advanced monitoring, security hardening, and cache optimization. The architecture provides clear paths for scaling through horizontal scaling, service upgrades, and geographic distribution.'
      },
      {
        type: 'heading',
        content: 'Conclusion'
      },
      {
        type: 'paragraph',
        content: 'The NicorAI website project demonstrates that modern web applications can successfully combine cutting-edge AI capabilities with practical business needs while maintaining cost efficiency and scalability. The modular architecture approach, combined with intelligent service orchestration through n8n workflows, created a system that is both sophisticated in its capabilities and maintainable in its structure.'
      },
      {
        type: 'paragraph',
        content: 'This case study represents the collective efforts of the NicorAI development team and demonstrates the practical application of modern web development practices in creating AI-powered user experiences.'
      }
    ],
    image: '/images/article-hero.jpg'
  },
  'understanding-llms': {
    id: 'understanding-llms',
    title: "Understanding Large Language Models (LLMs)",
    date: "October 15, 2023",
    category: "LLMs",
    author: "Dr. AI Researcher",
    readTime: "12 min read",
    content: [
      {
        type: 'paragraph',
        content: 'Large Language Models (LLMs) represent a significant breakthrough in artificial intelligence and natural language processing. This article explores their architecture, capabilities, and implications.'
      },
      {
        type: 'heading',
        content: 'What are LLMs?'
      },
      {
        type: 'paragraph',
        content: 'Large Language Models are artificial neural networks trained on vast amounts of text data. They can understand and generate human-like text, answer questions, and perform various language-related tasks.'
      },
      {
        type: 'heading',
        content: 'Technical Architecture'
      },
      {
        type: 'paragraph',
        content: 'Most modern LLMs use the Transformer architecture, which employs self-attention mechanisms to process input text. This allows the model to understand context and relationships between words effectively.'
      },
      {
        type: 'heading',
        content: 'Ethical Considerations'
      },
      {
        type: 'paragraph',
        content: 'As we develop and deploy LLMs, it\'s crucial to consider their ethical implications, including bias in training data, potential misuse, and impact on society.'
      }
    ],
    image: '/images/llm-architecture.jpg'
  },
  'rashevsky-connection': {
    id: 'rashevsky-connection',
    title: "Bridging Biology and AI: The Rashevsky Connection",
    date: "September 30, 2023",
    category: "Inspiration",
    author: "Historical AI Research Team",
    readTime: "10 min read",
    content: [
      {
        type: 'paragraph',
        content: 'Nicolas Rashevsky\'s groundbreaking work in mathematical biophysics continues to influence modern artificial intelligence approaches. This article explores the connections between his theories and contemporary AI development.'
      },
      {
        type: 'heading',
        content: 'Mathematical Foundations'
      },
      {
        type: 'paragraph',
        content: 'Rashevsky\'s mathematical approach to biological systems laid the groundwork for understanding complex networks and information processing in both biological and artificial systems.'
      },
      {
        type: 'heading',
        content: 'Neural Networks: Past and Present'
      },
      {
        type: 'paragraph',
        content: 'The neural network models proposed by Rashevsky share surprising similarities with modern deep learning architectures, despite being developed decades earlier.'
      },
      {
        type: 'heading',
        content: 'Legacy and Future Directions'
      },
      {
        type: 'paragraph',
        content: 'Understanding Rashevsky\'s work provides valuable insights for the future development of AI systems that better mirror biological intelligence.'
      }
    ],
    image: '/images/rashevsky-legacy.jpg'
  }
};

const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ articleId, onClose }) => {
  const [article, setArticle] = useState<any>(null);

  useEffect(() => {
    // In a real application, this would be an API call
    setArticle(articles[articleId as keyof typeof articles]);
  }, [articleId]);

  if (!article) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-4 pb-4 md:pt-10 md:pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            {/* Back button */}
            <button
              onClick={onClose}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Articles
            </button>

            {/* Article metadata */}
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                {article.category}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {article.date}
                </div>
                <div className="flex items-center">
                  <Tag size={16} className="mr-2" />
                  {article.readTime}
                </div>
                <div className="flex items-center">
                  <MessageSquare size={16} className="mr-2" />
                  By {article.author}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-8 relative">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            {article.content.map((section: any, index: number) => {
              if (section.type === 'heading') {
                return (
                  <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {section.content}
                  </h2>
                );
              } else if (section.type === 'subheading') {
                return (
                  <h3 key={index} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                    {section.content}
                  </h3>
                );
              } else if (section.type === 'list') {
                return (
                  <ul key={index} className="list-disc pl-6 mb-6 space-y-2">
                    {section.items.map((item: string, itemIndex: number) => (
                      <li key={itemIndex} className="text-gray-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              } else {
                return (
                  <p key={index} className="text-gray-700 mb-6 leading-relaxed">
                    {section.content}
                  </p>
                );
              }
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ArticleDetailView; 