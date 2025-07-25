// frontend/src/App.jsx - YOUR ORIGINAL CODE WITH ONLY PERFORMANCE OPTIMIZATIONS ADDED
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  Search, 
  Zap, 
  Shield, 
  Brain, 
  Heart, 
  Sparkles,
  Eye,
  Clock,
  Users,
  Palette,
  Wand2,
  Target,
  Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';
import { useAuth } from './components/AuthContext';

/**
 * Main Application Component - Prompt Sherlock
 * 
 * Features:
 * - Modern glass morphism design
 * - Framer Motion animations
 * - Responsive layout
 * - AI-powered prompt generation branding
 * - Infinite draggable carousel with belt indicator
 * 
 * PERFORMANCE: Added intelligent preloading for code-split chunks
 */
function App() {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dragX = useMotionValue(0);
  const carouselRef = useRef(null);
  const autoScrollRef = useRef(null);
  const { currentUser, loading } = useAuth();

  // =============================================================================
  // PERFORMANCE: INTELLIGENT PRELOADING
  // =============================================================================
  
  useEffect(() => {
    // Preload utils chunk on any user interaction
    const preloadUtils = () => {
      import('./components/LazyComponents').then(({ preloadChunks }) => {
        preloadChunks?.utils?.();
      }).catch(() => {
        // Fallback: preload individual utils
        import('axios');
        import('react-dropzone');
        import('lucide-react');
      });
    };
    
    // Listen for first user interaction
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, preloadUtils, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, preloadUtils);
      });
    };
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleAnalysisComplete = (results) => {
    setHasAnalysis(true);
    // Scroll to results
    setTimeout(() => {
      document.querySelector('#analysis-results')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.2
      }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.4
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        delay: 0.6
      }
    }
  };

  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 1.0
      }
    }
  };

  // =============================================================================
  // FEATURE DATA - Enhanced with background elements
  // =============================================================================

  const features = [
    {
      icon: Search,
      title: 'AI Analysis',
      description: 'Sherlock "investigates" your images, extracting style, mood, composition, and subject matter.',
      bgGradient: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      icon: Zap,
      title: 'Engine Specific Prompts',
      description: 'Choose your target engine (Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, etc.) and get prompts crafted for optimal results. (Coming soon)',
      bgGradient: 'from-yellow-500/10 to-orange-500/10'
    },
    {
      icon: Palette,
      title: 'Style & Character Profiles',
      description: 'Build a library of recurring styles and characters for consistent branding and storytelling. (Coming soon)',
      bgGradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      icon: Lightbulb,
      title: 'Instant Inspiration',
      description: 'Turn any image into a perfect AI prompt—no guesswork.',
      bgGradient: 'from-green-500/10 to-emerald-500/10'
    },
    {
      icon: Target,
      title: 'Style Consistency',
      description: 'Keep your unique look across projects.',
      bgGradient: 'from-red-500/10 to-rose-500/10'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Skip manual prompt writing, focus on creating.',
      bgGradient: 'from-indigo-500/10 to-violet-500/10'
    }
  ];

  // Create infinite loop by duplicating features
  const infiniteFeatures = [...features, ...features, ...features];

  // =============================================================================
  // INFINITE CAROUSEL LOGIC WITH AUTO-SCROLL
  // =============================================================================

  const CARD_WIDTH = 320; // width + gap
  const TOTAL_WIDTH = features.length * CARD_WIDTH;
  const AUTO_SCROLL_SPEED = 0.5; // pixels per frame
  const AUTO_SCROLL_INTERVAL = 16; // ~60fps

  // Calculate normalized position for belt indicator (0-100%)
  const beltProgress = useTransform(dragX, (x) => {
    // Normalize the position to a 0-1 range within one set of features
    const normalizedX = ((x % TOTAL_WIDTH) + TOTAL_WIDTH) % TOTAL_WIDTH;
    return (normalizedX / TOTAL_WIDTH) * 100;
  });

  const handleDragStart = () => {
    setIsDragging(true);
    setIsPaused(true);
    // Clear auto-scroll when user starts dragging
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    // Resume auto-scroll after a short delay
    setTimeout(() => {
      setIsPaused(false);
    }, 2000); // 2 second pause after drag
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isDragging) {
      setIsPaused(false);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!isPaused && !isDragging && !isHovered) {
      autoScrollRef.current = setInterval(() => {
        const currentX = dragX.get();
        dragX.set(currentX - AUTO_SCROLL_SPEED);
      }, AUTO_SCROLL_INTERVAL);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isPaused, isDragging, isHovered, dragX]);

  // Auto-snap to create seamless infinite effect
  useEffect(() => {
    const unsubscribe = dragX.onChange((x) => {
      // Seamlessly loop when reaching boundaries
      if (x > CARD_WIDTH / 2) {
        dragX.set(x - TOTAL_WIDTH);
      } else if (x < -TOTAL_WIDTH * 2 + CARD_WIDTH / 2) {
        dragX.set(x + TOTAL_WIDTH);
      }
    });

    return unsubscribe;
  }, [dragX, TOTAL_WIDTH, CARD_WIDTH]);

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  /**
   * Renders the minimalistic belt-style progress indicator
   */
  const renderBeltIndicator = () => (
    <div className="relative w-full max-w-md mx-auto mt-8 mb-4">
      {/* Minimalistic Belt Background */}
      <div className="h-1 bg-white/20 rounded-full relative">
        {/* Progress Indicator - Solid Circle */}
        <motion.div
          className="absolute top-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg"
          style={{
            left: useTransform(beltProgress, (progress) => `${progress}%`),
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      
    </div>
  );

  /**
   * Renders the main header section with infinite carousel
   */
  const renderHeader = () => (
    <motion.header
      className="text-center mb-16"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo and Brand */}
      <motion.div
        className="flex items-center justify-center mb-6"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="glass-effect p-4 rounded-2xl mr-4"
          whileHover={{ 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
            scale: 1.1 
          }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        </motion.div>
        
        <motion.h1
          className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold"
          variants={titleVariants}
        >
          Prompt Sherlock
        </motion.h1>
      </motion.div>

      {/* Marketing Tagline */}
      <motion.div
        className="max-w-3xl mx-auto mb-8"
        variants={subtitleVariants}
      >
        <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4 italic">
          Uncover. Create. Repeat.<br />
          Turn any image into the perfect AI art prompt.
        </p>
      </motion.div>

      {/* Simplified Marketing Description */}
      <motion.div
        className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl"
        variants={subtitleVariants}
      >
        <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
          <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, tailored for top AI engines like Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, and more.
        </p>
        
        {/* Centered CTA Button */}
        <div className="text-center">
          <motion.button
            className="glass-button px-10 py-5 text-white font-bold text-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Get Started Now
          </motion.button>
          
          <p className="text-gray-400 text-sm mt-4">
            Upload Your First Image and See Sherlock in Action!
          </p>
        </div>
      </motion.div>

      {/* Infinite Draggable Feature Carousel */}
      <motion.div
        className="max-w-7xl mx-auto overflow-hidden px-4 py-4"
        variants={featureVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative">
          {/* Background Pattern Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(147,51,234,0.3) 0%, transparent 50%)',
                backgroundSize: '200% 200%'
              }}
            />
          </div>

          {/* Carousel Container */}
          <motion.div
            ref={carouselRef}
            className="flex space-x-6 cursor-grab active:cursor-grabbing"
            style={{ x: dragX }}
            drag="x"
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {infiniteFeatures.map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}`}
                className="glass-effect p-6 rounded-xl hover:bg-white/15 transition-all duration-300 flex-shrink-0 relative overflow-hidden"
                style={{ width: '300px' }}
                whileHover={!isDragging ? { 
                  scale: 1.05,
                  boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
                } : {}}
                whileTap={!isDragging ? { scale: 0.95 } : {}}
              >
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-50`} />
                <div className="absolute top-2 right-2 text-4xl opacity-20">
                  {feature.bgPattern}
                </div>
                
                {/* Content */}
                <motion.div
                  className="relative z-10 flex flex-col items-center text-center space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (index % features.length) * 0.1, duration: 0.5 }}
                >
                  <motion.div
                    className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full backdrop-blur-sm"
                    whileHover={!isDragging ? { rotate: 360 } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </motion.div>
                  
                  <h3 className="text-white font-semibold text-lg">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Belt Indicator */}
        {renderBeltIndicator()}
        
      </motion.div>
    </motion.header>
  );

  /**
   * Renders the main content area
   */
  const renderMainContent = () => (
    <motion.main
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      id="upload-section"
    >
      <AnalysisForm
        onAnalysisComplete={handleAnalysisComplete}
        apiUrl={import.meta.env.VITE_API_URL}
      />
    </motion.main>
  );

  /**
   * Renders the footer section with navigation
   */
  const renderFooter = () => (
    <motion.footer
      className="mt-20 pt-12 border-t border-white/10"
      variants={footerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Search className="w-6 h-6 text-blue-400 mr-2" />
              <span className="gradient-text font-bold text-xl">Prompt Sherlock</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered creative sidekick that investigates images to create perfect AI art prompts.
            </p>
          </div>

          {/* Privacy Statement */}
          <div className="text-center">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Privacy Promise
            </h4>
            <p className="text-gray-400 text-sm">
              Your images are processed securely and deleted immediately after analysis. 
              We never store or share your data.
            </p>
          </div>

          {/* Powered By */}
          <div className="text-center md:text-right">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center md:justify-end">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              Powered By
            </h4>
            <div className="space-y-1 text-gray-400 text-sm">
              <p>Google Gemini</p>
              <p>React & Tailwind CSS</p>
              <p>Framer Motion</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <Navigation />

        {/* Copyright */}
        <div className="text-center py-6 border-t border-white/5 mt-8">
          <motion.p 
            className="text-gray-500 text-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Made with <Heart className="w-4 h-4 mx-1 text-red-400" /> for the creative community
          </motion.p>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 Prompt Sherlock. Privacy-focused AI prompt generation.
          </p>
        </div>
      </div>
    </motion.footer>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {renderHeader()}
          {renderMainContent()}
          {renderFooter()}
        </motion.div>
      </div>
    </div>
  );
}

export default App;