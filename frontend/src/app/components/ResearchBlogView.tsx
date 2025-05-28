import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import ArticleDetailView from './ArticleDetailView';

const ResearchBlogView: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const blogPosts = [
    { id: 'nicorai-website', title: "NicorAI: The Website", date: "May 19, 2025", excerpt: "NicorAI is a modern AI platform built with Next.js and React, offering a responsive design and interactive chat. It delivers rich content through text, charts, and cards, ensuring a smooth user experience across all devices...", category: "AI Trends", color: "blue" },
    { id: 'understanding-llms', title: "Understanding Large Language Models (LLMs)", date: "October 15, 2023", excerpt: "Large Language Models are at the forefront of the current AI revolution. This article provides a high-level overview of LLM architecture, training processes, and their capabilities, along with ethical considerations...", category: "LLMs", color: "indigo" },
    { id: 'rashevsky-connection', title: "Bridging Biology and AI: The Rashevsky Connection", date: "September 30, 2023", excerpt: "Explore how the foundational mathematical biophysics work of Nicolas Rashevsky provides a unique lens through which we approach modern AI challenges, emphasizing systemic understanding and rigorous analysis.", category: "Inspiration", color: "purple" },
  ];
  const colorMap: Record<string, string> = { blue: "from-blue-500 to-indigo-600", indigo: "from-indigo-500 to-purple-600", purple: "from-purple-500 to-pink-600" };
  const bgColorMap: Record<string, string> = { blue: "bg-blue-50 text-blue-800", indigo: "bg-indigo-50 text-indigo-800", purple: "bg-purple-50 text-purple-800" };
  if (selectedArticle) {
    return <ArticleDetailView articleId={selectedArticle} onClose={() => setSelectedArticle(null)} />;
  }
  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-4 pb-4 md:pt-10 md:pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-indigo-100/20 to-blue-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center ">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 mb-2 ">
              <Sparkles size={14} className="mr-2" />
              Insights & Articles
            </div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">Research</h1>
            <p className="text-xl text-gray-700 mb-2 leading-relaxed ">Dive into our latest research, articles, and insights at the intersection of AI, technology, and innovation. Explore thought leadership inspired by pioneers like Nicolas Rashevsky.</p>
          </motion.div>
        </div>
      </section>
      <section className="py-4 md:py-16 bg-gradient-to-b from-white relative to-gray-50">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-4 md:mb-12 ">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Latest Articles</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Stay updated with our explorations and discoveries in the world of AI.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div key={post.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md transition-all duration-300 flex flex-col h-full">
                <div className={`bg-gradient-to-r ${colorMap[post.color] || 'from-gray-500 to-gray-600'} h-40 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] leading-5 font-medium ${bgColorMap[post.color] || 'bg-gray-50 text-gray-800'} mb-2`}>{post.category}</div>
                    <h3 className="text-xl font-bold">{post.title}</h3>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-sm text-gray-500 mb-3">Posted on: {post.date}</p>
                  <p className="text-gray-600 mb-6 flex-grow">{post.excerpt}</p>
                  <div className="mt-auto">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSelectedArticle(post.id)} className="w-full py-2 bg-gray-900 text-white rounded-lg shadow-sm flex items-center justify-center text-sm font-medium">
                      Read more
                      <ArrowRight size={16} className="ml-1" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResearchBlogView; 