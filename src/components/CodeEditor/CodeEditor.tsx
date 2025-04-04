"use client";

import React, { useState, useCallback } from "react";
import Groq from "groq-sdk";
import styles from "./CodeEditor.module.css";

interface AnalysisResult {
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string;
  correctedCode: string;
  error?: string;
}

export default function CodeEditor() {
  const [code, setCode] = useState<string>(""); 
  const [analysis, setAnalysis] = useState<AnalysisResult>({ 
    timeComplexity: "Not analyzed yet",
    spaceComplexity: "Not analyzed yet",
    suggestions: "No suggestions yet",
    correctedCode: ""
  });
  const [loading, setLoading] = useState<boolean>(false); 
  const [language, setLanguage] = useState<string>("java");
  const groq = new Groq({
    apiKey:  process.env.NEXT_PUBLIC_GROQ_API_KEY ,
    dangerouslyAllowBrowser: true,
  });

  const analyzeCode = useCallback(async () => { 
    if (!code.trim()) {
      setAnalysis(prev => ({
        ...prev,
        error: "Please enter code to analyze"
      }));
      return;
    }

    setLoading(true);
    setAnalysis({
      timeComplexity: "Analyzing...",
      spaceComplexity: "Analyzing...",
      suggestions: "Analyzing...",
      correctedCode: "",
      error: undefined
    });

    try {
      const response = await groq.chat.completions.create({
        messages: [{
          role: "user", 
          content: `Analyze this ${language} code and provide ONLY a JSON response with these exact fields:
{
  "timeComplexity": "Big O time complexity (e.g., O(n))",
  "spaceComplexity": "Big O space complexity (e.g., O(1))",
  "suggestions": "Brief optimization suggestions",
  "correctedCode": "Fixed code if errors exist or original if correct"
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\``
        }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response received from AI");

      let result: Partial<AnalysisResult> = {};
      try {
        result = JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (e) {
            throw new Error("Could not parse analysis response");
          }
        } else {
          throw new Error("Response was not in JSON format");
        }
      }

      const validatedResult: AnalysisResult = {
        timeComplexity: result.timeComplexity || "Could not determine",
        spaceComplexity: result.spaceComplexity || "Could not determine",
        suggestions: result.suggestions || "No suggestions provided",
        correctedCode: result.correctedCode || code
      };

      setAnalysis(validatedResult);
    } catch (error) {
      setAnalysis({
        timeComplexity: "Analysis failed",
        spaceComplexity: "Analysis failed",
        suggestions: "Could not analyze code",
        correctedCode: code,
        error: error instanceof Error ? error.message : "Unknown analysis error"
      });
    } finally {
      setLoading(false);
    }
  }, [code, language]);


return (
  
    <div className={styles.container}>
      <h1 className={styles.title}>Code Complexity Analyzer</h1>
      
      <div className={styles.controls}>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className={styles.select}
        >
          {["javascript", "python", "java", "c++", "typescript"].map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        
        <button 
          onClick={analyzeCode} 
          disabled={loading}
          className={styles.analyzeButton}
        >
          {loading ? (
            <span className={styles.spinner}></span>
          ) : "Analyze"}
        </button>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.codeInput}>
          <h2>Your Code</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Enter ${language} code here...`}
            spellCheck="false"
            className={styles.textarea}
          />
        </div>

        <div className={styles.results}>
          <h2>Analysis Results</h2>
          
          {analysis.error && (
            <div className={styles.error}>
              Error: {analysis.error}
            </div>
          )}

          <div className={styles.complexityContainer}>
            <div className={styles.complexityBox}>
              <h3>Time Complexity</h3>
              <div className={styles.complexityValue}>
                {loading ? "..." : analysis.timeComplexity}
              </div>
            </div>
            
            <div className={styles.complexityBox}>
              <h3>Space Complexity</h3>
              <div className={styles.complexityValue}>
                {loading ? "..." : analysis.spaceComplexity}
              </div>
            </div>
          </div>

          <div className={styles.suggestionsBox}>
            <h3>Optimization Suggestions</h3>
            <div className={styles.suggestionsContent}>
              {loading ? "Analyzing..." : analysis.suggestions}
            </div>
          </div>

          {analysis.correctedCode && (
            <div className={styles.correctedCode}>
              <h3>Suggested Corrections</h3>
              <pre className={styles.codeBlock}>
                {analysis.correctedCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}