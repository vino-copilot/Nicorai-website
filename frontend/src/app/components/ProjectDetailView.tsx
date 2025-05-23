import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Share2, MessageSquare, BarChart3, IndianRupee, Stethoscope, Cpu } from 'lucide-react';
import Image from 'next/image';

interface ProjectDetailViewProps {
  projectId: string;
  onClose: () => void;
}

// Mock project data - In a real application, this would come from an API or database
const projects = {
  'financial-fraud-detection': {
    id: 'financial-fraud-detection',
    title: "Financial Fraud Detection",
    date: "2024",
    category: "Finance",
    client: "Major Financial Institution",
    duration: "8 months",
    content: [
      {
        type: 'paragraph',
        content: 'We implemented a state-of-the-art AI fraud detection system for a leading financial institution that successfully reduced fraudulent transactions by 92% and saved $4.3M in potential losses.'
      },
      {
        type: 'heading',
        content: 'The Challenge'
      },
      {
        type: 'paragraph',
        content: 'The client was facing increasing sophisticated fraud attempts that were bypassing traditional rule-based detection systems. They needed a solution that could adapt to new fraud patterns and provide real-time detection without increasing false positives.'
      },
      {
        type: 'heading',
        content: 'Our Solution'
      },
      {
        type: 'list',
        items: [
          'Developed a machine learning model trained on historical transaction data',
          'Implemented real-time transaction scoring system',
          'Created an adaptive learning mechanism to identify new fraud patterns',
          'Built a user-friendly dashboard for fraud analysts'
        ]
      },
      {
        type: 'heading',
        content: 'Technical Implementation'
      },
      {
        type: 'paragraph',
        content: 'The solution utilizes advanced machine learning algorithms including gradient boosting and neural networks. We implemented a real-time processing pipeline using Apache Kafka and deployed the models using TensorFlow Serving.'
      },
      {
        type: 'metrics',
        items: [
          { label: 'Fraud Reduction', value: '92%' },
          { label: 'Cost Savings', value: '$4.3M' },
          { label: 'False Positive Rate', value: '<0.1%' },
          { label: 'Processing Time', value: '<100ms' }
        ]
      },
      {
        type: 'heading',
        content: 'Results & Impact'
      },
      {
        type: 'paragraph',
        content: 'The implementation led to immediate and significant improvements in fraud detection capabilities. The system now processes millions of transactions daily with minimal false positives, providing substantial cost savings and improved customer trust.'
      }
    ],
    technologies: ['Machine Learning', 'TensorFlow', 'Apache Kafka', 'Python', 'Real-time Analytics'],
    image: '/images/fraud-detection.jpg'
  },
  'retail-demand-forecasting': {
    id: 'retail-demand-forecasting',
    title: "Retail Demand Forecasting",
    date: "2024",
    category: "Retail",
    client: "National Retail Chain",
    duration: "6 months",
    content: [
      {
        type: 'paragraph',
        content: 'We developed an advanced demand forecasting system for a major retail chain that improved inventory management efficiency and led to a 22% increase in sales while reducing overstock by 31%.'
      },
      {
        type: 'heading',
        content: 'The Challenge'
      },
      {
        type: 'paragraph',
        content: 'The client struggled with inventory management across multiple locations, leading to both stockouts and excess inventory. They needed a solution that could accurately predict demand while accounting for seasonal variations and local market conditions.'
      },
      {
        type: 'heading',
        content: 'Our Solution'
      },
      {
        type: 'list',
        items: [
          'Built a machine learning model incorporating multiple data sources',
          'Developed location-specific demand prediction algorithms',
          'Created an automated inventory optimization system',
          'Implemented real-time reporting and analytics dashboard'
        ]
      },
      {
        type: 'heading',
        content: 'Technical Implementation'
      },
      {
        type: 'paragraph',
        content: 'The solution combines time series analysis with machine learning models, using technologies like Prophet and XGBoost. We integrated point-of-sale data, weather patterns, and local event information to improve prediction accuracy.'
      },
      {
        type: 'metrics',
        items: [
          { label: 'Sales Increase', value: '22%' },
          { label: 'Reduced Overstock', value: '31%' },
          { label: 'Prediction Accuracy', value: '94%' },
          { label: 'ROI', value: '315%' }
        ]
      },
      {
        type: 'heading',
        content: 'Results & Impact'
      },
      {
        type: 'paragraph',
        content: 'The implementation transformed the client\'s inventory management processes, leading to significant improvements in efficiency and profitability. The system continues to learn and adapt, providing increasingly accurate predictions over time.'
      }
    ],
    technologies: ['Python', 'Prophet', 'XGBoost', 'TensorFlow', 'SQL'],
    image: '/images/retail-forecasting.jpg'
  },
  'customer-support-agent': {
    id: 'customer-support-agent',
    title: "Customer Support Agent",
    date: "2024",
    category: "SaaS",
    client: "Technology Company",
    duration: "4 months",
    content: [
      {
        type: 'paragraph',
        content: 'We created an intelligent customer support chatbot that successfully handles 70% of customer queries without human intervention, while maintaining high customer satisfaction rates.'
      },
      {
        type: 'heading',
        content: 'The Challenge'
      },
      {
        type: 'paragraph',
        content: 'The client needed to scale their customer support operations without significantly increasing costs. They wanted a solution that could handle routine queries while maintaining high customer satisfaction levels.'
      },
      {
        type: 'heading',
        content: 'Our Solution'
      },
      {
        type: 'list',
        items: [
          'Developed an AI-powered chatbot using natural language processing',
          'Implemented context-aware conversation handling',
          'Created seamless handoff to human agents when needed',
          'Built analytics dashboard for monitoring performance'
        ]
      },
      {
        type: 'heading',
        content: 'Technical Implementation'
      },
      {
        type: 'paragraph',
        content: 'The solution uses advanced NLP models and was built using the latest language models. We implemented a custom conversation flow engine and integrated it with the client\'s existing support system.'
      },
      {
        type: 'metrics',
        items: [
          { label: 'Query Resolution', value: '70%' },
          { label: 'Response Time', value: '<10s' },
          { label: 'Customer Satisfaction', value: '85%' },
          { label: 'Cost Reduction', value: '45%' }
        ]
      },
      {
        type: 'heading',
        content: 'Results & Impact'
      },
      {
        type: 'paragraph',
        content: 'The chatbot has significantly improved the efficiency of the client\'s support operations while maintaining high customer satisfaction. It continues to learn from interactions, becoming more effective over time.'
      }
    ],
    technologies: ['Natural Language Processing', 'Python', 'TensorFlow', 'Node.js', 'MongoDB'],
    image: '/images/chatbot-support.jpg'
  },
  'healthcare-ai-assistant': {
    id: 'healthcare-ai-assistant',
    title: "Healthcare AI Assistant",
    date: "2024",
    category: "Healthcare",
    client: "Major Healthcare Provider",
    duration: "10 months",
    content: [
      {
        type: 'paragraph',
        content: 'We developed an AI assistant for a major healthcare provider that reduced administrative workload by 35% and improved patient satisfaction to 89%, streamlining healthcare delivery processes.'
      },
      {
        type: 'heading',
        content: 'The Challenge'
      },
      {
        type: 'paragraph',
        content: 'The healthcare provider was struggling with administrative overhead and wanted to improve patient experience while reducing staff workload. They needed a solution that could handle routine tasks while maintaining strict healthcare compliance standards.'
      },
      {
        type: 'heading',
        content: 'Our Solution'
      },
      {
        type: 'list',
        items: [
          'Created an AI system for appointment scheduling and management',
          'Implemented automated patient follow-up system',
          'Developed secure patient data processing pipeline',
          'Built HIPAA-compliant reporting system'
        ]
      },
      {
        type: 'heading',
        content: 'Technical Implementation'
      },
      {
        type: 'paragraph',
        content: 'The solution was built using HIPAA-compliant cloud infrastructure and implements state-of-the-art security measures. We used advanced NLP for patient communication and integrated with existing healthcare systems.'
      },
      {
        type: 'metrics',
        items: [
          { label: 'Reduced Workload', value: '35%' },
          { label: 'Patient Satisfaction', value: '89%' },
          { label: 'Appointment Efficiency', value: '+58%' },
          { label: 'Response Time', value: '-65%' }
        ]
      },
      {
        type: 'heading',
        content: 'Results & Impact'
      },
      {
        type: 'paragraph',
        content: 'The AI assistant has transformed the provider\'s administrative processes, leading to significant improvements in efficiency and patient satisfaction. The system maintains strict compliance while delivering exceptional performance.'
      }
    ],
    technologies: ['Python', 'HIPAA Cloud', 'Natural Language Processing', 'HL7 FHIR', 'React'],
    image: '/images/healthcare-assistant.jpg'
  },
  'predictive-maintenance': {
    id: 'predictive-maintenance',
    title: "AI-Powered Predictive Maintenance",
    date: "2024",
    category: "Manufacturing",
    client: "Major Manufacturing Company",
    duration: "9 months",
    content: [
      {
        type: 'paragraph',
        content: 'We developed a machine learning system that predicts equipment failures for a manufacturing company, reducing downtime by 37% and saving millions in maintenance costs.'
      },
      {
        type: 'heading',
        content: 'The Challenge'
      },
      {
        type: 'paragraph',
        content: 'The client was facing significant losses due to unexpected equipment failures and inefficient maintenance schedules. They needed a solution that could predict potential failures before they occurred and optimize maintenance timing.'
      },
      {
        type: 'heading',
        content: 'Our Solution'
      },
      {
        type: 'list',
        items: [
          'Implemented IoT sensors for real-time equipment monitoring',
          'Developed machine learning models for failure prediction',
          'Created an early warning system for maintenance teams',
          'Built a comprehensive dashboard for maintenance scheduling'
        ]
      },
      {
        type: 'heading',
        content: 'Technical Implementation'
      },
      {
        type: 'paragraph',
        content: 'The solution combines IoT sensor data with advanced machine learning algorithms. We implemented a real-time data processing pipeline using Apache Kafka and TensorFlow, with a custom-built anomaly detection system.'
      },
      {
        type: 'metrics',
        items: [
          { label: 'Downtime Reduction', value: '37%' },
          { label: 'Cost Savings', value: '$2.8M' },
          { label: 'Prediction Accuracy', value: '92%' },
          { label: 'Response Time', value: '-45%' }
        ]
      },
      {
        type: 'heading',
        content: 'Results & Impact'
      },
      {
        type: 'paragraph',
        content: 'The implementation has transformed the client\'s maintenance operations, significantly reducing unplanned downtime and maintenance costs. The system continues to improve its predictions through machine learning, providing increasingly accurate maintenance forecasts.'
      }
    ],
    technologies: ['Machine Learning', 'IoT', 'TensorFlow', 'Apache Kafka', 'Python', 'Real-time Analytics'],
    image: '/images/predictive-maintenance.jpg'
  }
};

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, onClose }) => {
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    // In a real application, this would be an API call
    setProject(projects[projectId as keyof typeof projects]);
  }, [projectId]);

  if (!project) {
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
              Back to Projects
            </button>

            {/* Project metadata */}
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                {project.category}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                {project.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {project.date}
                </div>
                <div className="flex items-center">
                  <Tag size={16} className="mr-2" />
                  {project.duration}
                </div>
                <div className="flex items-center">
                  <MessageSquare size={16} className="mr-2" />
                  Client: {project.client}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Content */}
      <section className="py-8 relative">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            {project.content.map((section: any, index: number) => {
              if (section.type === 'heading') {
                return (
                  <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {section.content}
                  </h2>
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
              } else if (section.type === 'metrics') {
                return (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                    {section.items.map((metric: any, metricIndex: number) => (
                      <div key={metricIndex} className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                        <div className="text-sm text-gray-600">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <p key={index} className="text-gray-700 mb-6 leading-relaxed">
                    {section.content}
                  </p>
                );
              }
            })}

            {/* Technologies Used */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetailView; 