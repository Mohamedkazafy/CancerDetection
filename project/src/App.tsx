import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, Activity } from 'lucide-react';

interface Result {
  prediction: string;
  confidence: number;
  isPositive: boolean;
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: { prediction: string; confidence: number; status: string } = await response.json();
      
      setResult({
        prediction: data.prediction,
        confidence: data.confidence * 100,
        isPositive: data.prediction.toLowerCase().includes('cancer detected')
      });
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // O7 logo component
  const O7Logo: React.FC = () => (
    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-300 to-indigo-600 mx-auto">
      <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
        <Activity className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <O7Logo />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-6 mb-2">
            Welcome to Our Health Insights Platform <span className="text-indigo-600">O7</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Proactive Blood Cancer Detection: Empowering Early Insights
          </p>
        </header>

        <div className="mb-12 text-center max-w-3xl mx-auto">
          <p className="text-gray-700 leading-relaxed">
            Take charge of your health with our advanced tool. Simply enter your data,
            and our model will analyze it for potential blood cancer indicators. This tool
            is designed to provide valuable insights but is not a substitute for
            professional medical advice. Let's move forward together toward proactive
            and informed health decisions.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Add a blood test image</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
              <div className="space-y-4">
                <label 
                  htmlFor="image-upload" 
                  className={`
                    flex flex-col items-center justify-center w-full h-48 border-2 border-dashed 
                    rounded-lg cursor-pointer transition-colors
                    ${preview ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {preview ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, or JPEG (max. 10MB)
                      </p>
                    </div>
                  )}
                </label>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
              
              {error && (
                <div className="flex items-center text-red-600 text-sm justify-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium text-white 
                  flex items-center justify-center
                  ${loading || !selectedFile 
                    ? 'bg-indigo-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'}
                  transition-colors
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'SCAN'
                )}
              </button>
            </form>
          </div>
          
          {(preview || result) && (
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100">
              <div className="max-w-md mx-auto">
                {preview && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">The image uploaded:</h3>
                    <div className="w-48 h-48 mx-auto overflow-hidden rounded-lg border border-gray-200">
                      <img 
                        src={preview} 
                        alt="Uploaded" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {result && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">The result:</h3>
                    <div className={`
                      p-4 rounded-lg text-center font-medium text-lg
                      ${result.isPositive ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
                    `}>
                      {result.isPositive ? (
                        <div className="flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 mr-2" />
                          <span>{result.prediction}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 mr-2" />
                          <span>{result.prediction}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${result.isPositive ? 'bg-red-600' : 'bg-green-600'}`}
                          style={{ width: `${result.confidence}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-sm text-gray-600 mt-1">{result.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p className="mb-1">© 2025 O7 Health Insights Platform. For research and educational purposes only.</p>
          <p>This tool is designed to assist medical professionals and should not be used as a 
            substitute for professional medical advice, diagnosis, or treatment.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;