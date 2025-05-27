import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Lightbulb, Goal, Eye, Handshake, Shield, TrendingUp } from 'lucide-react';
import Image from 'next/image';

const AboutUsView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-white">
      <AboutHero />
      <OurStory />
      <TeamSection />
      <CoreValues />
    </div>
  );
};

const AboutHero = () => {
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
    <section className="relative pt-[17px] pb-[17px] md:pt-10 md:pb-16 overflow-hidden">
      {!isTablet && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-indigo-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-indigo-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-100 mb-4">
            <Users size={14} className="mr-2" />
            About Us
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">Pioneering Intelligent Solutions</h1>
          <p className="text-xl text-gray-600 leading-relaxed">At NicorAI, we are a team of passionate innovators dedicated to pushing the boundaries of what's possible with Artificial Intelligence and Immersive Technologies. We're not just building AI; we're crafting intelligent solutions that transform businesses and shape the future. Inspired by the pioneering work of Nicolas Rashevsky, we approach AI with a deep understanding of the fundamental mathematical principles that underpin its power and potential.</p>
          <br />
          <br />
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">We specialize in two core areas</h1>
          <p className="text-xl text-gray-600 leading-relaxed">Cutting-edge Artificial Intelligence and immersive Augmented & Virtual Reality solutions</p>
          <br />
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">AI/ML: Custom Solutions and Development</h1>
          <p className="text-xl text-gray-600 leading-relaxed">We design and develop bespoke narrow AI models precisely tailored to address unique business challenges, moving beyond gene solutions. Our services encompass AI-augmented development, enabling businesses to leverage AI in every part of their operational framework. From detailed data analysis to seamless deployment, we handle every step in the development lifecycle.</p>
          <br />
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-6">AR/VR: Immersive Application Development</h1>
          <p className="text-xl text-gray-600 leading-relaxed">We craft immersive Augmented and Virtual Reality experiences designed to engage, educate, and transform how our clients connect with their audiences. From training simulations to virtual product demos, we use AR/VR to create innovative ways for businesses to engage their customers and stakeholders, ensuring memorable and impactful experiences.</p>
          <br /><br />
          <div className="pt-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-100 mb-4">
              <Lightbulb size={14} className="mr-2" />
              Our Inspiration
            </div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">The Legacy of <span className="text-blue-600">Nicolas Rashevsky</span></h1>
            <div className="flex justify-center mb-6">
              <Image src="/images/Nicolas_Rashevsky.png" alt="Nicolas Rashevsky" width={280} height={280} className="rounded-2xl shadow-lg border border-purple-100 bg-white object-cover" priority />
            </div>
            <p className="text-xl text-gray-700 mb-4 leading-relaxed">At NicorAI, we believe that true innovation is built upon a foundation of groundbreaking ideas and visionary thinkers. Our journey into the world of artificial intelligence is deeply inspired by the pioneering work of Nicolas Rashevsky, a theoretical biophysicist whose ideas were far ahead of their time. Rashevsky's work wasn't just about biology; it was a profound exploration of how mathematical principles could unlock the secrets of complex systems — a vision that forms the core of our approach to AI today. He was, in many ways, a founding father of the AI revolution, and his legacy fuels our mission</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const OurStory = () => {
  return (
    <section className="py-[17px] md:py-16 relative">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-full h-full rounded-2xl bg-indigo-100/50"></div>
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-indigo-100 p-8 h-full flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Story of Nicolas Rashevsky</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Nicolas Rashevsky wasn't a computer scientist in the traditional sense. Born in 1899, he was a brilliant scholar who applied the rigor of mathematics to the complexities of the human body and, in doing so, stumbled upon concepts that would become crucial to artificial intelligence. He was a polymath, straddling the worlds of mathematics, physics, and biology. In 1934, he left for Chicago and became the first professor of mathematical biophysics at the University of Chicago. He was ahead of his time, and he believed in the power of mathematics to unlock the secrets of life.</p>
                  <p>Rashevsky's approach was to apply mathematical modeling to biological systems, seeing patterns and structures that were previously hidden. His work on neural networks, though initially framed within the context of the human brain, laid the theoretical groundwork for the artificial neural networks that are fundamental to today's deep learning and AI systems. He co-authored the book "Mathematical Biophysics" which included the famous "Theory of the Brain" which is considered a core component of AI development, he even anticipated many technologies and challenges of the present day through his work.</p>
                  <p>What sets us apart is our client-centric approach. We don't just implement technology; we partner with you to understand your business challenges and develop custom solutions that address your specific needs.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden text-white p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Goal className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold ml-4">Our Mission</h3>
              </div>
              <p className="text-indigo-100 mb-8 text-[16px]">Our mission is to democratize artificial intelligence by making powerful, easy-to-use AI tools accessible and practical for businesses of all sizes. We aim to bridge the gap between innovation and real-world application, helping organizations unlock value, drive efficiency, and make smarter decisions through AI</p>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold ml-4">Our Vision</h3>
              </div>
              <p className="text-indigo-100 text-[16px] mb-8">A world where AI enhances human potential, drives business innovation,solves real-world problems and creates solutions to our most pressing challenges.</p>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Handshake className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold ml-4">Our Commitment</h3>
              </div>
              <p className="text-indigo-100 text-[16px]">At NicorAI, we honor Rashevsky's legacy by embracing his scientific approach and commitment to solving complex problems. Inspired by his innovation, we strive to create impactful AI solutions that reflect his enduring influence.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TeamSection = () => {
  const team = [
    { name: "Sachin Shetty", title: "Chief of Executions", bio: "Sachin Shetty is the CEO of NicorAI Systems, driving the company's strategic vision and growth with a blend of technical expertise and entrepreneurial insight. With 12 years of experience delivering enterprise solutions in Java and Adobe Experience Manager, he excels at turning complex challenges into scalable, AI-driven platforms. His leadership fosters innovation and accountability, while his passion for independent filmmaking sharpens his focus on user-centric design. Sachin is also a devoted husband and father, inspired by his daughter to build technology that enhances everyday life.", image: "👨‍💻", color: "from-indigo-500 to-blue-600", linkedin: "https://www.linkedin.com/in/sachin-shetty-7a473a51/" },
    { name: "Vino Suresh", title: "Chief Technology Officer", bio: "Vino Suresh is the Chief Technology Officer at NicorAI Systems, bringing over 20 years of experience in designing and scaling enterprise platforms. A first-class Computer Science graduate, he has led cloud migrations, machine learning product launches, and mission-critical rollouts with a focus on engineering rigor and reliable delivery. A former club cricketer, Vino values strategic thinking and team cohesion. Outside work, he's a dedicated husband and father, inspired daily by his daughters' curiosity.", image: "👨‍💻", color: "from-emerald-500 to-teal-600", linkedin: "https://www.linkedin.com/in/vino-s-95396615/", twitter: "https://x.com/VinoSuresh11" },
    { name: "Supimon Pavithran", title: "Chief of Business and Research", bio: "Supimon Pavithran is the founder and Chief of Business & Research at NicorAI Systems, uniting commercial strategy with advanced AI innovation. With a background in Electronics & Communication Engineering, he brings deep expertise across languages like Rust, C++, Python, and Java, along with strong mathematical and LLM knowledge. Supimon leads R&D, builds key partnerships, and mentors the engineering team he personally recruited, shaping them into top AI talent. A strategic thinker and avid chess player, he balances work with fitness and family life, often sharing adventures with his wife and daughter.", image: "👨‍💻", color: "from-purple-500 to-pink-600", linkedin: "https://www.linkedin.com/in/supimon-pavithran-452a1915", twitter: "https://x.com/supimon" }
  ];
  return (
    <section className="py-[17px] md:py-20 bg-gradient-to-b from-white to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-[17px] md:mb-12">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Our Leadership Team</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Meet the experts behind our AI innovations</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 flex flex-col h-full">
              <div className={`h-48 bg-gradient-to-r ${member.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                <div className="text-6xl">{member.image}</div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-indigo-600 font-medium mb-3">{member.title}</p>
                <p className="text-gray-600 mb-4">{member.bio}</p>
                <div className="flex space-x-3 mt-auto">
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  {member.twitter && (
                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CoreValues = () => {
  const values = [
    { title: "Innovation", description: "We push the boundaries of what's possible with AI, constantly exploring new technologies and approaches.", icon: <Lightbulb className="h-6 w-6" />, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { title: "Integrity", description: "We operate with transparency and ethical standards, ensuring responsible use of AI technology.", icon: <Shield className="h-6 w-6" />, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    { title: "Impact", description: "We measure our success by the tangible results we deliver for our clients and the value we create.", icon: <TrendingUp className="h-6 w-6" />, color: "bg-purple-50 text-purple-700 border-purple-100" },
    { title: "Collaboration", description: "We believe in working closely with our clients, becoming true partners in their AI journey.", icon: <Users className="h-6 w-6" />, color: "bg-teal-50 text-teal-700 border-teal-100" }
  ];
  return (
    <section className="py-[17px] md:py-20 bg-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100/50 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/50 rounded-full filter blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-[17px] md:mb-12">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Our Core Values</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">The principles that guide our work and shape our culture</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div key={value.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
              <div className="flex items-start">
                <div className={`w-14 h-14 rounded-full ${value.color} flex items-center justify-center mr-6`}>{value.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutUsView; 