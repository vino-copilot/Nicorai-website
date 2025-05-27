import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookText, Cpu, ChevronRight, IndianRupee, BarChart3, MessageSquare, Stethoscope } from 'lucide-react';
import ProjectDetailView from './ProjectDetailView';

const WhatWeveDoneView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  if (selectedProject) {
    return <ProjectDetailView projectId={selectedProject} onClose={() => setSelectedProject(null)} />;
  }
  return (
    <div className="min-h-screen bg-white">
      <CaseStudiesHero onProjectSelect={setSelectedProject} />
      <FeaturedProjects onProjectSelect={setSelectedProject} />
      <TestimonialsSection />
    </div>
  );
};

const CaseStudiesHero = ({ onProjectSelect }: { onProjectSelect: (id: string) => void }) => {
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
    <section className="relative pt-10 pb-12 overflow-hidden">
      {!isTablet && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-purple-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-purple-100/20 rounded-full filter blur-3xl animate-float"></div>
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-100 mb-4">
            <BookText size={14} className="mr-2" />
            Case Studies
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">Our AI Success Stories</h1>
          <p className="text-xl text-gray-600 leading-relaxed">Explore our portfolio of AI and ML solutions that have transformed businesses across industries.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl filter blur-xl animate-pulse" style={{ animationDuration: "4s" }}></div>
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="p-8 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-600">Featured Case Study</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Predictive Maintenance</h3>
                  <p className="text-gray-600 mb-6">We developed a machine learning system that predicts equipment failures for a manufacturing company, reducing downtime by 37% and saving millions in maintenance costs.</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">Manufacturing</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Predictive Analytics</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">IoT</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onProjectSelect('predictive-maintenance')} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md flex items-center text-sm font-medium">
                    View Full Case Study
                    <ChevronRight size={16} className="ml-1" />
                  </motion.button>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 hidden md:flex items-center justify-center p-8">
                  <motion.div animate={{ y: [0, -10, 0], rotateZ: [0, 5, 0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}>
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <Cpu size={44} className="text-purple-600" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturedProjects = ({ onProjectSelect }: { onProjectSelect: (id: string) => void }) => {
  const projects = [
    { id: 'financial-fraud-detection', title: "Financial Fraud Detection", description: "Implemented an AI fraud detection system for a financial institution that reduced fraudulent transactions by 92%.", category: "Finance", tags: ["Security", "Pattern Recognition"], color: "purple", icon: <IndianRupee className="w-8 h-8" />, metrics: [ { value: "92%", label: "Fraud Reduction" }, { value: "$4.3M", label: "Cost Savings" } ] },
    { id: 'retail-demand-forecasting', title: "Retail Demand Forecasting", description: "Built predictive models for a retail chain that improved inventory management and increased sales by 22%.", category: "Retail", tags: ["Predictive Analytics", "ML"], color: "green", icon: <BarChart3 className="w-8 h-8" />, metrics: [ { value: "22%", label: "Sales Increase" }, { value: "31%", label: "Reduced Overstock" } ] },
    { id: 'customer-support-agent', title: "Customer Support Agent", description: "Developed an intelligent chatbot for a SaaS company that handles 70% of customer queries without human intervention.", category: "SaaS", tags: ["Agent", "NLP"], color: "yellow", icon: <MessageSquare className="w-8 h-8" />, metrics: [ { value: "70%", label: "Query Resolution" }, { value: "85%", label: "Faster Response" } ] },
    { id: 'healthcare-ai-assistant', title: "Healthcare AI Assistant", description: "Developed an AI assistant for a major healthcare provider that reduced administrative workload by 35% and improved patient satisfaction.", category: "Healthcare", tags: ["NLP", "Workflow Automation"], color: "blue", icon: <Stethoscope className="w-8 h-8" />, metrics: [ { value: "35%", label: "Reduced Workload" }, { value: "89%", label: "Patient Satisfaction" } ] }
  ];
  const colorMap: Record<string, string> = { blue: "from-blue-500 to-indigo-600", green: "from-emerald-500 to-teal-600", yellow: "from-amber-500 to-orange-600", purple: "from-purple-500 to-pink-600" };
  const bgColorMap: Record<string, string> = { blue: "bg-blue-50 text-blue-800", green: "bg-emerald-50 text-emerald-800", yellow: "bg-amber-50 text-amber-800", purple: "bg-purple-50 text-purple-800" };
  return (
    <section className={`bg-gradient-to-b from-white relative to-purple-50 ${window.innerWidth < 768 ? 'py-1' : 'py-16'}`}> 
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${window.innerWidth < 768 ? 'mb-10' : 'mb-16'}`}>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Featured AI Projects</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Our work spans across industries, showcasing the versatility and power of our AI solutions</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div key={project.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md transition-all duration-300 flex flex-col h-full">
              <div className={`bg-gradient-to-r ${colorMap[project.color]} h-48 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                <div className="absolute top-6 right-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center">{project.icon}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[14px] leading-5 font-medium ${bgColorMap[project.color] || 'bg-gray-50 text-gray-800'} mb-2`}>{project.category}</div>
                  <h3 className="text-2xl font-bold">{project.title}</h3>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-gray-600 mb-6">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[14px] leading-5 font-medium">{tag}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {project.metrics.map((metric, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-800">{metric.value}</div>
                      <div className="text-[14px] leading-5 text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onProjectSelect(project.id)} className="w-full py-2 bg-gray-900 text-white rounded-lg shadow-sm flex items-center justify-center text-sm font-medium">
                    View Project Details
                    <ChevronRight size={16} className="ml-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const testimonials = [
    { content: "Partnering with NicorAI Systems has transformed our operations at DMART. Their machine learning models provided invaluable predictions on customer transactions, buying patterns, and vendor supply trends. The accuracy and insights from these models have significantly boosted our efficiency and decision-making. We couldn't be happier with the results and look forward to continued collaboration!", author: "George Williams", title: "CEO of DMART", image: "👩‍💼" },
    { content: "Implementing the Continuous Transaction Monitoring System developed by NicorAI Systems has been a game-changer for our financial security. Their advanced ML-powered system has significantly enhanced our ability to detect and prevent financial fraud, ensuring compliance and security. The system's accuracy and real-time monitoring capabilities have been instrumental in safeguarding our operations. We highly recommend NicorAI Systems for their expertise and dedication to excellence.", author: "Senior Compliance Office", title: "Leading Finance Institute", image: "👨‍⚕️" },
    { content: "Working with NicorAI Systems has been a game-changer for our Toni & Guy franchise. We were overwhelmed with customer queries, especially outside of working hours, which affected our ability to respond promptly. The AI agent developed by NicorAI Systems transformed our customer service experience. Their solution not only handled a high volume of inquiries efficiently but also ensured our clients received accurate, personalized responses around the clock. We've seen a significant boost in customer satisfaction and operational efficiency. We highly recommend their innovative AI solutions to any business looking to enhance customer engagement.", author: "Murad Hossain", title: "Franchise Owner, Toni & Guy", image: "👨‍💼" }
  ];
  return (
    <section className={`${window.innerWidth < 768 ? 'pt-12 pb-8' : 'py-20'} bg-purple-50 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100/30 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-100/30 rounded-full filter blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${window.innerWidth < 768 ? 'mb-8 ' : 'mb-16'}`}>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.9px", lineHeight: "40px" }}>What Our Clients Say</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "20px", }}>Success stories from organizations that have partnered with us</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 relative flex flex-col h-full">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <div className="text-purple-300 text-7xl leading-none">"</div>
              </div>
              <div className="flex-1 flex flex-col min-h-[160px]">
                <p className="text-gray-600 mb-6 relative z-10" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "16px", lineHeight: "24px" }}>{testimonial.content}</p>
                <div className="flex items-center mt-auto pt-2">
                  <div className="flex-shrink-0 mr-3 text-3xl">{testimonial.image}</div>
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeveDoneView; 