// frontend/src/App.jsx - MINIMAL VERSION TO FIX FCP
import React from 'react';
import { Search, Sparkles, Shield } from 'lucide-react';

/**
 * Minimal App Component to Fix FCP
 * Renders content immediately without complex imports
 */
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <header className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="glass-effect p-4 rounded-2xl mr-4">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              </div>
              
              <h1 className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold">
                Prompt Sherlock
              </h1>
            </div>

            <div className="max-w-3xl mx-auto mb-8">
              <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4 italic">
                Uncover. Create. Repeat.<br />
                Turn any image into the perfect AI art prompt.
              </p>
            </div>

            <div className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl">
              <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
                <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, tailored for top AI engines like Midjourney, DALL·E, Stable Diffusion, Gemini Imagen, and more.
              </p>
              
              <div className="text-center">
                <button className="glass-button px-10 py-5 text-white font-bold text-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30 mx-auto">
                  Get Started Now
                </button>
                
                <p className="text-gray-400 text-sm mt-4">
                  Upload Your First Image and See Sherlock in Action!
                </p>
              </div>
            </div>
          </header>

          {/* Features Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Powerful AI Features
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Our advanced AI engine provides comprehensive image analysis capabilities
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-effect p-8 rounded-xl text-center hover:scale-105 transition-all duration-300">
                <div className="text-blue-400 mb-4 flex justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  AI Analysis
                </h3>
                <p className="text-gray-400">
                  Advanced computer vision algorithms analyze your images with precision
                </p>
              </div>

              <div className="glass-effect p-8 rounded-xl text-center hover:scale-105 transition-all duration-300">
                <div className="text-blue-400 mb-4 flex justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Lightning Fast
                </h3>
                <p className="text-gray-400">
                  Get detailed analysis results in seconds, not minutes
                </p>
              </div>

              <div className="glass-effect p-8 rounded-xl text-center hover:scale-105 transition-all duration-300">
                <div className="text-blue-400 mb-4 flex justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Privacy First
                </h3>
                <p className="text-gray-400">
                  Your images are processed securely and deleted immediately after analysis
                </p>
              </div>
            </div>
          </section>

          {/* Upload Section Placeholder */}
          <section className="mb-16">
            <div className="text-center">
              <div className="glass-effect p-12 rounded-xl">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Analyze Your Images?
                </h2>
                <p className="text-gray-300 mb-8">
                  Upload your images and let AI create perfect prompts for your favorite tools
                </p>
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 bg-gray-900/30">
                  <p className="text-gray-400">
                    🎨 Upload Section Loading...
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center py-8 border-t border-white/10 mt-16">
            <div className="space-y-4">
              <p className="text-gray-400">
                AI-powered creative sidekick for perfect prompts
              </p>
              <p className="text-gray-500 text-sm">
                © 2025 Prompt Sherlock. Privacy-focused prompt generation.
              </p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

export default App;