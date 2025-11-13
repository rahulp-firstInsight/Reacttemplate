import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  domain: string;
  created: string;
  sections: any[];
  source: string;
}

const LiveTemplatesDemo = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching templates from live server...');
      
      const response = await fetch('http://localhost:8080/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Live templates received:', data);
      
      setTemplates(data);
    } catch (err) {
      console.error('❌ Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTemplates();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🌟 Live Templates from Azure MySQL Database
        </h1>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Live Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>🌐 Backend Server:</strong> <code>http://localhost:8080</code>
            </div>
            <div>
              <strong>🏥 Database:</strong> <code>qamysqlserver.mysql.database.azure.com</code>
            </div>
            <div>
              <strong>📊 Database Name:</strong> <code>qa_scribe_test</code>
            </div>
            <div>
              <strong>🔵 SQL Calls:</strong> <code>CALL GetTemplates()</code>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Templates ({templates.length})
        </h2>
        <button
          onClick={fetchLiveTemplates}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh Templates'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading templates from live database...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No templates found in the database.</p>
              <p className="text-gray-500 mt-2">The live database connection is working, but no templates exist yet.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {template.name}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {template.source}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span><strong>ID:</strong> {template.id}</span>
                      <span><strong>Domain:</strong> {template.domain}</span>
                      <span><strong>Created:</strong> {new Date(template.created).toLocaleString()}</span>
                      <span><strong>Sections:</strong> {template.sections.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      📝 Edit
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      👁️ View
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      🗑️ Delete
                    </button>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      📊 Export
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">🔍 SQL Operations Visible in Server Console:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
          <div>• <code>🔵 EXECUTING: CALL GetTemplates()</code></div>
          <div>• <code>🔵 EXECUTING: CALL GetTemplateById(1)</code></div>
          <div>• <code>🔵 EXECUTING: CALL add_template(...)</code></div>
          <div>• <code>🔵 EXECUTING: CALL UpdateTemplate(...)</code></div>
          <div>• <code>🔵 EXECUTING: CALL SoftDeleteTemplate(...)</code></div>
          <div>• <code>🌐 EXTERNAL API: POST/PUT/DELETE</code></div>
        </div>
      </div>
    </div>
  );
};

export default LiveTemplatesDemo;