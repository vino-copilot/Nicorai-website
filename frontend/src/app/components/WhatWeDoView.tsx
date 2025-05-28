import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, ChevronRight, Bot, Workflow, SearchCode, BrainCircuit, TrendingUp, Compass, Share2, Search, Notebook, Code, Rocket, Zap } from 'lucide-react';

const WhatWeDoView: React.FC = () => {
  const servicesRef = useRef<HTMLDivElement>(null);
  const scrollToServices = () => {
    if (servicesRef.current) {
      servicesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="min-h-screen bg-white">
      <AIHeroSection scrollToServices={scrollToServices} />
      <div ref={servicesRef}>
        <AIServicesSection />
      </div>
      <TechStackSection />
      <AIProcessSection />
    </div>
  );
};

const AIHeroSection = ({ scrollToServices }: { scrollToServices: () => void }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1023);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return (
    <section className={`relative overflow-hidden ${isMobile ? 'py-1' : isTablet ? 'py-6' : 'py-16'}`}>
      {!isMobile && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col lg:flex-row items-center gap-12${isMobile ? ' items-center justify-center' : ''}`}> 
          <div className={`flex-1 max-w-2xl${isMobile ? ' w-full flex flex-col items-center' : ''}`}> 
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {isMobile ? (
                <div className="flex justify-center w-full">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-4">
                    <Cpu size={14} className="mr-2" />
                    AI-Powered Solutions
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-4">
                  <Cpu size={14} className="mr-2" />
                  AI-Powered Solutions
                </div>
              )}
              <h1 className={`text-5xl font-bold tracking-tight${isMobile ? ' text-center' : ''}`}> 
                <span className="text-gray-900">Transform Your Business</span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">With AI-Powered Solutions</span>
              </h1>
              <p className={`mt-4 text-xl text-gray-600 leading-relaxed${isMobile ? ' text-center' : ''}`}> 
                We leverage cutting-edge artificial intelligence and machine learning to deliver
                powerful solutions that drive growth, efficiency, and innovation.
              </p>
              <div className={`mt-8 flex gap-4${isMobile ? ' justify-center' : ''}`}> 
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md flex items-center cursor-pointer"
                  onClick={scrollToServices}
                >
                  Explore Our Services
                  <ChevronRight size={18} className="ml-2" />
                </motion.button>
              </div>
            </motion.div>
          </div>
          <div className="flex-1 max-w-lg">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
              {!isTablet && !isMobile && (
                <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <NetworkAnimation />
                  </div>
                  <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Cpu size={32} className="text-blue-600" />
                  </motion.div>
                  <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute top-2/4 right-1/4 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Cpu size={32} className="text-indigo-600" />
                  </motion.div>
                  <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100/50">
                    <h3 className="font-semibold text-gray-900">AI Technologies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Machine Learning • NLP • Neural Networks • Computer Vision
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const NetworkAnimation = () => {
  return (
    <svg width="320" height="320" viewBox="0 0 320 320">
      <g className="nodes">
        {Array.from({ length: 15 }).map((_, i) => {
          const x = 160 + Math.cos(i * (Math.PI * 2) / 15) * 120;
          const y = 160 + Math.sin(i * (Math.PI * 2) / 15) * 120;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#3b82f6"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.8, 0.3], r: [4, 6, 4] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          );
        })}
        <motion.circle
          cx="160"
          cy="160"
          r="8"
          fill="#4f46e5"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7], r: [8, 10, 8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
      <g className="connections" stroke="#3b82f6" strokeOpacity="0.2" strokeWidth="1">
        {Array.from({ length: 15 }).map((_, i) => {
          const x1 = 160 + Math.cos(i * (Math.PI * 2) / 15) * 120;
          const y1 = 160 + Math.sin(i * (Math.PI * 2) / 15) * 120;
          return (
            <motion.line
              key={i}
              x1="160"
              y1="160"
              x2={x1}
              y2={y1}
              initial={{ strokeOpacity: 0.1 }}
              animate={{ strokeOpacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          );
        })}
      </g>
    </svg>
  );
};

const AIServicesSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1023);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const services = [
    { title: "AI Agent Development", description: "Empower your operations with intelligent agents. We design, train, and deploy autonomous AI agents capable of reasoning, decision-making, and interacting with users across platforms, enhancing productivity and customer experience.", icon: <Bot className="w-6 h-6 text-blue-600" />, color: "from-blue-50 to-blue-100/50" },
    { title: "AI Workflow Automation", description: "Transform business operations with intelligent automation. Streamline and automate end-to-end business processes using AI-driven decision systems that adapt and improve over time.", icon: <Workflow className="w-6 h-6 text-indigo-600" />, color: "from-indigo-50 to-indigo-100/50" },
    { title: "Retrieval-Augmented Generation (RAG) Systems", description: "Enable context-rich, accurate, and explainable AI responses. We build RAG pipelines combining LLMs with external knowledge sources for advanced chatbots, document Q&A systems, and support automation.", icon: <SearchCode className="w-6 h-6 text-violet-600" />, color: "from-violet-50 to-violet-100/50" },
    { title: "ML Model Development", description: "Custom machine learning models built for your domain. From data engineering to deployment, we develop supervised, unsupervised, and reinforcement learning models tailored to your business objectives.", icon: <BrainCircuit className="w-6 h-6 text-blue-600" />, color: "from-blue-50 to-blue-100/50" },
    { title: "Predictive Intelligence", description: "Anticipate trends and make smarter decisions. Forecast behaviors, demand, risks, or opportunities with data-driven predictive models optimized for high accuracy and business ROI.", icon: <TrendingUp className="w-6 h-6 text-indigo-600" />, color: "from-indigo-50 to-indigo-100/50" },
    { title: "AI Strategy & Enablement", description: "Your AI transformation partner. We guide organizations through AI maturity assessment, roadmap creation, and technology adoption with a practical, results-oriented approach.", icon: <Compass className="w-6 h-6 text-violet-600" />, color: "from-violet-50 to-violet-100/50" },
  ];
  return (
    <section className={`${isMobile ? 'py-1' : isTablet ? 'pt-2 pb-6' : 'py-16'} bg-white relative overflow-hidden`}>
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${isMobile ? 'mb-8' : isTablet ? 'mb-6' : 'mb-16'}`}>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-4">
            <Share2 size={14} className="mr-2" />
            Our Services
          </div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Comprehensive AI Solutions</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We offer a wide range of AI services designed to help your business thrive in the era of artificial intelligence.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="h-full flex">
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}
const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, color }) => {
  return (
    <motion.div whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className={`bg-gradient-to-br ${color} p-6`}>
        <div className="flex items-center gap-4 min-h-[3rem]">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">{icon}</div>
          <h3 className="text-xl font-semibold text-gray-900 leading-[28px] flex items-center h-full">
            <span className="block self-center">{title}</span>
          </h3>
        </div>
      </div>
      <div className="p-6 pt-4">
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

const TechStackSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const techItems = [
    { name: "TensorFlow", category: "Framework" },
    { name: "PyTorch", category: "Framework" },
    { name: "Scikit-learn", category: "Library" },
    { name: "BERT", category: "Model" },
    { name: "GPT", category: "Model" },
    { name: "Computer Vision", category: "Technology" },
    { name: "NLP", category: "Technology" },
    { name: "Neural Networks", category: "Technology" },
    { name: "AWS", category: "Platform" },
    { name: "Google Cloud", category: "Platform" },
    { name: "Azure", category: "Platform" },
  ];
  return (
    <section className={`${isMobile ? 'py-11' : 'py-16'} bg-gradient-to-b from-white to-blue-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Our Technology Stack</h2>
          <p className=" mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">We utilize cutting-edge technologies and frameworks</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-wrap justify-center gap-3">
          {techItems.map((tech, index) => (
            <motion.div key={tech.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: index * 0.05 }} whileHover={{ y: -5, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }} className="bg-white px-4 py-2 rounded-full border border-blue-100 shadow-sm">
              <span className="text-gray-900 font-medium">{tech.name}</span>
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{tech.category}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const AIProcessSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const processSteps = [
    { title: "Discovery", description: "We start by understanding your business needs, challenges, and goals.", icon: <Search className="w-6 h-6 text-white" />, color: "bg-blue-600" },
    { title: "Strategy", description: "We formulate a strategic plan to implement AI solutions tailored to your needs.", icon: <Notebook className="w-6 h-6 text-white" />, color: "bg-indigo-600" },
    { title: "Development", description: "Our team builds, trains, and tests AI models and solutions.", icon: <Code className="w-6 h-6 text-white" />, color: "bg-purple-600" },
    { title: "Deployment", description: "We seamlessly integrate AI solutions into your existing systems and workflows.", icon: <Rocket className="w-6 h-6 text-white" />, color: "bg-violet-600" },
    { title: "Optimization", description: "Continuous monitoring and improvement to ensure optimal performance.", icon: <Zap className="w-6 h-6 text-white" />, color: "bg-blue-600" },
  ];
  return (
    <section className={`${isMobile ? 'py-1' : 'py-16'} bg-blue-50 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/50 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full filter blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Our AI Implementation Process</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">A systematic approach to successfully integrating AI into your business</p>
        </motion.div>
        <div className="flex flex-col items-center">
          {processSteps.map((step, index) => (
            <motion.div key={step.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="flex w-full max-w-3xl mb-6">
              <div className="flex flex-col items-center mr-6">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>{step.icon}</div>
                {index < processSteps.length - 1 && (<div className="w-1 h-16 bg-gray-200 my-2"></div>)}
              </div>
              <div className="flex-1 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{index + 1}. {step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeDoView; 