import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, MapPin, Phone, Mail } from 'lucide-react';

const ConnectView: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <ContactHero />
      <ContactForm />
      <OfficeLocations />
    </div>
  );
};

const ContactHero = () => {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1023);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return (
    <section className="relative pt-4 pb-6 overflow-hidden">
      {!isTablet && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white bg-grid-pattern"></div>
          <div className="absolute top-0 right-0 w-5/12 h-5/12 bg-gradient-to-br from-teal-100/30 to-blue-100/30 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-6/12 h-5/12 bg-gradient-to-tr from-blue-100/20 to-teal-100/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 border border-teal-100 mb-4">
            <MessageSquare size={14} className="mr-2" />
            Connect
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">Let&apos;s Connect!</h1>
          <p className="text-xl text-gray-600 leading-relaxed">Ready to transform your business with AI? Reach out to our team to explore how NicorAI can help you achieve your goals.</p>
        </motion.div>
      </div>
    </section>
  );
};

const ContactForm = () => {
  const [formState, setFormState] = useState({ name: '', email: '', company: '', message: '', submitted: false, loading: false, error: null as string | null });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, loading: true, submitted: false, error: null }));
    try {
      let recaptchaToken = '';
      if (typeof window !== 'undefined' && 'grecaptcha' in window && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        try {
          const grecaptcha = (window as unknown as { grecaptcha: { execute: (siteKey: string, options: { action: string }) => Promise<string> } }).grecaptcha;
          recaptchaToken = await grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'contact' });
        } catch {
          setFormState(prev => ({ ...prev, loading: false, error: 'reCAPTCHA verification failed. Please try again.' }));
          return;
        }
      }
      const response = await fetch('http://localhost:4000/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formState.name, email: formState.email, company: formState.company, message: formState.message, recaptchaToken: recaptchaToken }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setFormState(prev => ({ ...prev, submitted: true, loading: false, name: '', email: '', company: '', message: '' }));
      } else {
        setFormState(prev => ({ ...prev, loading: false, error: result.error || 'Failed to send message. Please try again.' }));
      }
    } catch {
      setFormState(prev => ({ ...prev, loading: false, error: 'An unexpected error occurred. Please try again.' }));
    }
  };
  return (
    <section className="py-6 relative">
      <div className="absolute inset-0 bg-grid-pattern z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center items-center min-h-[40vh]">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="w-full max-w-[500px]">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative z-20">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                {formState.submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-600">Thank you for reaching out. A member of our team will get back to you shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" id="name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200" placeholder="Enter your name" required disabled={formState.loading} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" id="email" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200" placeholder="Enter your email" required disabled={formState.loading} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                      <input type="text" id="company" value={formState.company} onChange={(e) => setFormState({ ...formState, company: e.target.value })} className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200" placeholder="Enter your company name" disabled={formState.loading} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">How can we help? <span className="text-red-500">*</span></label>
                      <textarea id="message" rows={5} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} className="w-full px-4 py-3 rounded-lg text-black border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200 resize-none" placeholder="Tell us about your project or query..." required disabled={formState.loading}></textarea>
                    </div>
                    {formState.error && (<p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{formState.error}</p>)}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={formState.loading} className={`w-full py-3 px-6 ${formState.loading ? 'bg-gray-400' : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'} text-white font-medium rounded-lg shadow-md transition-all duration-300 flex items-center justify-center`}>
                      {formState.loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const OfficeLocations = () => {
  const locations = [
    { city: "Kochi", address: "Confident Gem, Rajagiri Valley, Kakkanad, Kochi, Kerala, India 682039", phone: "+91 9876543210", email: "nicorai@gmail.com", image: "🌉" },
    { city: "Thiruvananthapuram", address: "Sasthamangalam, Thiruvananthapuram, Kerala 695010, 8.5114381,76.9672403", phone: "+91 9876543210", email: "nicorai@gmail.com", image: "🗽" }
  ];
  return (
    <section className={`${window.innerWidth < 768 ? 'pt-6 pb-8' : 'py-10'} bg-gradient-to-b from-white to-blue-50 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-grid-pattern z-0"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-teal-100/20 rounded-full filter blur-3xl z-0"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100/20 rounded-full filter blur-3xl z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`text-center ${window.innerWidth < 768 ? 'mb-8' : 'mb-16'}`}>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Our Offices</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Visit us at any of our office locations</p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-8 mt-8">
          {locations.map((location, index) => (
            <motion.div key={location.city} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 w-full max-w-xs md:w-96 relative z-20">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{location.city}</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start"><MapPin className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" /><span>{location.address}</span></p>
                  <p className="flex items-center"><Phone className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" /><span>{location.phone}</span></p>
                  <p className="flex items-center"><Mail className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" /><span>{location.email}</span></p>
                </div>
                <div className="mt-6">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer" className="w-full block">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center text-sm font-medium transition-colors duration-300">
                      Get Directions
                      <MapPin className="h-4 w-4 ml-2" />
                    </motion.button>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConnectView; 