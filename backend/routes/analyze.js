import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadMiddleware } from '../middleware/upload.js';
import { cleanupFiles } from '../utils/cleanup.js';
import fs from 'fs/promises';

const router = express.Router();

// Initialize AI service
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get AI model with enhanced configuration
const model = genAI.getGenerativeModel({ 
  model: process.env.AI_MODEL || 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS) || 8192,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
    topP: 0.8,
    topK: 40,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert file to AI-compatible format
 * SECURITY: Validates file exists and is readable before processing
 * 
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} AI-compatible file object
 */
async function fileToGenerativePart(filePath, mimeType) {
  try {
    // Security check: Verify file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    // Read file data
    const data = await fs.readFile(filePath);
    
    // Validate file size (additional check beyond multer)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (data.length > maxSize) {
      throw new Error(`File too large: ${data.length} bytes`);
    }
    
    // Convert to base64 for AI analysis
    const base64Data = data.toString('base64');
    
    console.log(`📄 File processed for analysis (${base64Data.length} chars)`);
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('❌ Error processing file:', error);
    throw new Error(`Failed to process image file: ${error.message}`);
  }
}

/**
 * Generate Prompt Sherlock's analysis prompt
 * 
 * @param {number} imageCount - Number of images to analyze
 * @param {string} customPrompt - User's custom analysis request
 * @returns {string} Formatted analysis prompt
 */
function generatePromptSherlockAnalysis(imageCount, customPrompt = '') {
  return `You are Prompt Sherlock, an AI assistant specialized in analyzing images to create perfect AI art prompts. Your mission is to analyze the ${imageCount === 1 ? 'image' : `${imageCount} images`} and generate detailed, actionable prompts that can be used with AI art generation tools like Midjourney, DALL·E, Stable Diffusion, and Gemini Imagen.

## 🔍 **IMAGE ANALYSIS FRAMEWORK**

### **Visual Content Analysis**
- Analyze all visual elements in detail
- Document the primary subjects, objects, and scenes
- Identify people, animals, objects, and environmental details
- Note any text, logos, or readable content

### **Style & Composition Analysis**
- Analyze artistic style, technique, and medium
- Document color palettes, lighting conditions, and mood
- Note photographic techniques: composition, framing, perspective
- Assess visual balance, focal points, and artistic approach

### **Environmental Context**
- Analyze the setting, location, and environmental context
- Note time period indicators, architectural styles, or geographical features
- Document weather, season, or temporal elements
- Identify any cultural or historical significance

### **Technical Characteristics**
- Assess image quality, resolution, and technical aspects
- Note camera angles, depth of field, and photographic style
- Identify any special effects, filters, or post-processing

${imageCount > 1 ? `
### **Multi-Image Analysis** (for ${imageCount} images)
- Compare and contrast visual patterns across images
- Identify recurring themes, styles, or subject matter
- Note relationships, sequences, or progressions
- Analyze the collection for cohesive elements and variations
` : ''}

## 🎯 **PROMPT GENERATION**

Based on your analysis, generate **ready-to-use AI art prompts** that include:

### **Core Prompt Components**
1. **Subject Description**: Clear, detailed description of main subjects
2. **Style Specifications**: Artistic style, medium, and technique descriptors
3. **Mood & Atmosphere**: Emotional tone and ambiance keywords
4. **Technical Parameters**: Camera angles, lighting, composition notes
5. **Quality Enhancers**: Terms that improve AI generation quality

### **Platform-Optimized Variations**
- **Midjourney-style**: Concise, keyword-rich format with artistic descriptors
- **DALL·E format**: Natural language descriptions with specific details
- **Stable Diffusion**: Technical parameters and quality tags
- **Universal prompt**: Works well across multiple AI platforms

### **Style & Character Consistency**
- Identify recurring visual elements for brand consistency
- Note character descriptions for character consistency
- Document style elements for maintaining visual coherence

${customPrompt ? `
### **Custom Focus**
User's specific request: "${customPrompt}"
Pay particular attention to this aspect while maintaining comprehensive analysis.
` : ''}

## 📋 **RESPONSE FORMAT**

Present your findings in a well-structured format:

1. **OVERVIEW**: Brief summary of what you found
2. **DETAILED ANALYSIS**: Comprehensive breakdown of visual elements
3. **PROMPT RECOMMENDATIONS**: Ready-to-use prompts for different AI tools
4. **STYLE GUIDE**: Consistent elements for future use
5. **ADDITIONAL INSIGHTS**: Any unique or notable findings

Make your analysis thorough, actionable, and focused on helping the user create amazing AI art with the generated prompts. Your goal is to transform visual inspiration into practical, usable prompts.`;
}

/**
 * Validate and sanitize analysis results
 * 
 * @param {string} analysis - Raw AI analysis text
 * @returns {string} Validated and formatted analysis
 */
function validateAnalysisResult(analysis) {
  if (!analysis || typeof analysis !== 'string') {
    throw new Error('Invalid analysis result format');
  }

  const trimmed = analysis.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Analysis result is empty');
  }

  if (trimmed.length < 50) {
    throw new Error('Analysis result too short - may indicate an error');
  }

  // Check for common error patterns
  const errorPatterns = [
    /I cannot|I am unable|I can't/i,
    /error|failed|invalid/i,
    /safety|blocked|restricted/i
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(trimmed.substring(0, 200))) {
      console.warn('⚠️ Potential issue in analysis result');
      break;
    }
  }

  return trimmed;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * POST /api/analyze
 * Analyze uploaded images and generate AI art prompts
 * 
 * Security: Uses secure upload middleware with comprehensive validation
 * Rate limiting: Applied at server level
 * File cleanup: Automatic cleanup after processing
 */
router.post('/', uploadMiddleware('images', 10), async (req, res) => {
  const uploadedFiles = req.files || [];
  const customPrompt = req.body.prompt || '';
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  console.log(`🔍 [${requestId}] Prompt Sherlock analyzing: ${uploadedFiles.length} files`);
  
  try {
    // Validate request
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded. Please select at least one image for analysis.',
        details: 'Upload 1-10 images to get started with prompt generation.',
        code: 'NO_FILES_UPLOADED'
      });
    }

    // Additional security validation
    if (uploadedFiles.length > 10) {
      console.warn(`⚠️ [${requestId}] Too many files: ${uploadedFiles.length}`);
      await cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        error: 'Too many images',
        details: `Maximum 10 images allowed per request. You uploaded ${uploadedFiles.length} images.`,
        code: 'TOO_MANY_FILES'
      });
    }

    // Log file details for monitoring
    const fileDetails = uploadedFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));
    
    console.log(`📋 [${requestId}] Processing files:`, fileDetails);

    // Validate custom prompt
    if (customPrompt && customPrompt.length > 1000) {
      await cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        error: 'Custom prompt too long',
        details: 'Please keep your custom prompt under 1000 characters.',
        code: 'PROMPT_TOO_LONG'
      });
    }

    // Process files for AI analysis
    const imageParts = [];
    const processedFiles = [];
    const processingStartTime = Date.now();

    console.log(`🔄 [${requestId}] Processing ${uploadedFiles.length} files...`);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        console.log(`📄 [${requestId}] Processing file ${i + 1}/${uploadedFiles.length}: ${file.originalname}`);
        
        const imagePart = await fileToGenerativePart(file.path, file.mimetype);
        imageParts.push(imagePart);
        
        processedFiles.push({
          index: i + 1,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          processed: true
        });
        
        console.log(`✅ [${requestId}] File ${i + 1} processed successfully`);
        
      } catch (error) {
        console.error(`❌ [${requestId}] Failed to process file ${i + 1} (${file.originalname}):`, error.message);
        
        // Cleanup all files and return error
        await cleanupFiles(uploadedFiles);
        
        return res.status(500).json({
          success: false,
          error: `Failed to process image: ${file.originalname}`,
          details: 'The image file may be corrupted, too large, or in an unsupported format.',
          code: 'FILE_PROCESSING_ERROR',
          fileIndex: i + 1
        });
      }
    }

    const processingTime = Date.now() - processingStartTime;
    console.log(`⚡ [${requestId}] File processing completed in ${processingTime}ms`);

    // Generate analysis prompt
    const analysisPrompt = generatePromptSherlockAnalysis(imageParts.length, customPrompt);
    
    // Prepare content for AI analysis
    const content = [analysisPrompt, ...imageParts];

    console.log(`🤖 [${requestId}] Starting AI analysis...`);
    const aiStartTime = Date.now();

    // Call AI service for analysis
    let result, response, analysis;
    
    try {
      result = await model.generateContent(content);
      response = await result.response;
      analysis = response.text();
      
      // Validate the response
      if (!analysis) {
        throw new Error('Empty response from AI service');
      }
      
    } catch (apiError) {
      console.error(`❌ [${requestId}] AI analysis error:`, apiError);
      
      // Cleanup files before returning error
      await cleanupFiles(uploadedFiles);
      
      // Handle specific API errors with user-friendly messages
      if (apiError.message?.includes('API key') || apiError.message?.includes('auth')) {
        return res.status(500).json({
          success: false,
          error: 'AI service temporarily unavailable',
          details: 'Our analysis service is experiencing technical difficulties. Please try again later.',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
      
      if (apiError.message?.includes('quota') || apiError.message?.includes('limit')) {
        return res.status(429).json({
          success: false,
          error: 'Service temporarily overloaded',
          details: 'Too many requests in progress. Please try again in a few minutes.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      if (apiError.message?.includes('safety') || apiError.message?.includes('blocked')) {
        return res.status(400).json({
          success: false,
          error: 'Content cannot be analyzed',
          details: 'The uploaded images contain content that cannot be processed due to safety restrictions.',
          code: 'CONTENT_BLOCKED'
        });
      }
      
      if (apiError.message?.includes('file size') || apiError.message?.includes('too large')) {
        return res.status(400).json({
          success: false,
          error: 'Images too large for analysis',
          details: 'One or more images exceed the maximum size limit. Please try smaller images.',
          code: 'FILE_SIZE_ERROR'
        });
      }
      
      // Generic API error
      return res.status(500).json({
        success: false,
        error: 'Analysis failed',
        details: 'The AI service encountered an error while processing your images. Please try again.',
        code: 'ANALYSIS_ERROR'
      });
    }

    const aiProcessingTime = Date.now() - aiStartTime;
    console.log(`🧠 [${requestId}] AI analysis completed in ${aiProcessingTime}ms`);

    // Validate and sanitize the analysis result
    try {
      analysis = validateAnalysisResult(analysis);
    } catch (validationError) {
      console.error(`❌ [${requestId}] Analysis validation failed:`, validationError.message);
      
      await cleanupFiles(uploadedFiles);
      
      return res.status(500).json({
        success: false,
        error: 'Invalid analysis result',
        details: 'The AI service returned an incomplete response. Please try again.',
        code: 'INVALID_ANALYSIS'
      });
    }

    // Cleanup uploaded files immediately after successful processing
    const cleanupStartTime = Date.now();
    await cleanupFiles(uploadedFiles);
    const cleanupTime = Date.now() - cleanupStartTime;
    
    console.log(`🗑️ [${requestId}] Files cleaned up in ${cleanupTime}ms`);

    // Calculate total processing time
    const totalProcessingTime = Date.now() - processingStartTime;

    // Prepare success response
    const responseData = {
      success: true,
      analysis: analysis,
      metadata: {
        requestId: requestId,
        processedImages: processedFiles.length,
        totalProcessingTimeMs: totalProcessingTime,
        breakdown: {
          fileProcessingMs: processingTime,
          aiAnalysisMs: aiProcessingTime,
          cleanupMs: cleanupTime
        },
        service: 'Prompt Sherlock',
        customPrompt: customPrompt || null,
        files: processedFiles,
        timestamp: new Date().toISOString(),
        privacy: {
          filesValidated: true,
          immediateCleanup: true,
          secureProcessing: true,
          noDataRetention: true
        }
      }
    };

    console.log(`✅ [${requestId}] Analysis completed successfully - ${analysis.length} characters, ${totalProcessingTime}ms total`);

    // Return successful response
    res.json(responseData);

  } catch (error) {
    console.error(`🚨 [${requestId}] Unexpected error:`, error);

    // Emergency cleanup of files
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        await cleanupFiles(uploadedFiles);
        console.log(`🗑️ [${requestId}] Emergency cleanup completed`);
      } catch (cleanupError) {
        console.error(`❌ [${requestId}] Emergency cleanup failed:`, cleanupError);
      }
    }

    // Return generic error response
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: isDevelopment 
        ? `Server error: ${error.message}` 
        : 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
      requestId: requestId,
      ...(isDevelopment && { stack: error.stack })
    });
  }
});

/**
 * GET /api/analyze/health
 * Health check for the analysis service
 */
router.get('/health', async (req, res) => {
  try {
    const { getUploadConfig, validateUploadDirectory } = await import('../middleware/upload.js');
    
    // Get upload configuration
    const uploadConfig = getUploadConfig();
    
    // Validate upload directory
    const directoryStatus = await validateUploadDirectory();
    
    // Test AI service connectivity
    let aiStatus = 'unknown';
    try {
      const testModel = genAI.getGenerativeModel({ model: process.env.AI_MODEL || 'gemini-1.5-flash' });
      const testResult = await testModel.generateContent('Test connection - respond with "OK"');
      const testResponse = await testResult.response;
      aiStatus = testResponse.text().includes('OK') ? 'available' : 'limited';
    } catch (aiError) {
      aiStatus = 'unavailable';
      console.warn('⚠️ AI service health check failed:', aiError.message);
    }

    res.json({
      status: 'OK',
      service: 'Prompt Sherlock Analysis Service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      
      aiService: {
        status: aiStatus,
        capabilities: ['Image Analysis', 'Prompt Generation', 'Style Analysis', 'Multi-Image Processing']
      },
      
      uploadConfig: {
        maxFileSize: uploadConfig.maxFileSizeMB + 'MB',
        maxFiles: uploadConfig.maxFiles,
        allowedTypes: uploadConfig.allowedExtensions,
        securityValidation: 'enabled'
      },
      
      storage: {
        directory: directoryStatus.path,
        exists: directoryStatus.exists,
        writable: directoryStatus.writable,
        ...(directoryStatus.error && { error: directoryStatus.error })
      },
      
      privacy: {
        dataRetention: 'none',
        immediateCleanup: 'enabled',
        secureProcessing: 'enabled',
        noTracking: true
      },
      
      supportedPlatforms: [
        'Midjourney',
        'DALL·E',
        'Stable Diffusion',
        'Gemini Imagen'
      ]
    });
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      service: 'Prompt Sherlock Analysis Service',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
    });
  }
});

/**
 * GET /api/analyze/config
 * Get current service configuration and capabilities
 */
router.get('/config', async (req, res) => {
  try {
    const { getUploadConfig } = await import('../middleware/upload.js');
    const config = getUploadConfig();
    
    res.json({
      success: true,
      service: 'Prompt Sherlock',
      config: {
        upload: {
          maxFileSize: config.maxFileSize,
          maxFileSizeMB: config.maxFileSizeMB,
          maxFiles: config.maxFiles,
          allowedTypes: config.allowedMimeTypes,
          allowedExtensions: config.allowedExtensions
        },
        analysis: {
          maxPromptLength: 1000,
          supportedFeatures: ['Style Analysis', 'Multi-Platform Prompts', 'Batch Processing', 'Custom Focus']
        },
        privacy: {
          dataRetention: 'none',
          immediateCleanup: true,
          secureProcessing: true,
          noTracking: true
        },
        outputFormats: {
          midjourneyPrompts: true,
          dallePrompts: true,
          stableDiffusionPrompts: true,
          universalPrompts: true,
          styleGuides: true
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Config endpoint error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      details: 'Unable to retrieve current service configuration'
    });
  }
});

export default router;