import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import { Place, Coordinates, SearchStatus, SearchError } from './types';
import { searchNearbyPlaces } from './services/geminiService';
import { Globe2, ArrowDown, Loader2 } from 'lucide-react';

function App() {
  const [status, setStatus] = useState<SearchStatus>(SearchStatus.IDLE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentParams, setCurrentParams] = useState<{
    coords: Coordinates | null;
    radius: string;
    country?: string;
    state?: string;
    zipCode?: string;
  } | null>(null);
  
  const [error, setError] = useState<SearchError | null>(null);

  const handleSearch = async (
    query: string, 
    coords: Coordinates | null, 
    radius: string,
    country?: string,
    state?: string,
    zipCode?: string
  ) => {
    setStatus(SearchStatus.SEARCHING);
    setError(null);
    setResults([]);
    setCurrentQuery(query);
    setCurrentParams({ coords, radius, country, state, zipCode });

    try {
      // Empty exclude list for initial search
      const places = await searchNearbyPlaces(query, coords, radius, country, state, zipCode, []);
      setResults(places);
      setStatus(SearchStatus.SUCCESS);
      
      if (places.length === 0) {
         setError({
            title: "No Results Found",
            message: "Gemini couldn't find any places matching your criteria nearby. Try increasing the radius or changing the search term."
         });
      }
    } catch (err: any) {
      console.error(err);
      setStatus(SearchStatus.ERROR);
      setError({
        title: "Search Failed",
        message: err.message || "An unexpected error occurred while contacting Gemini."
      });
    }
  };

  const handleLoadMore = async () => {
    if (!currentParams) return;

    setLoadingMore(true);
    try {
      // Pass existing names to exclude them from the next search
      const existingNames = results.map(r => r.name);
      const newPlaces = await searchNearbyPlaces(
        currentQuery, 
        currentParams.coords, 
        currentParams.radius, 
        currentParams.country, 
        currentParams.state, 
        currentParams.zipCode,
        existingNames
      );

      if (newPlaces.length === 0) {
        // No more new places found, maybe show a toast or alert? 
        // For now we just don't append anything.
      } else {
        setResults(prev => [...prev, ...newPlaces]);
      }
    } catch (err: any) {
      console.error("Error loading more:", err);
      // We don't change global status to error, just log it or show simple feedback
      alert("Could not load more results at this time.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClear = () => {
    setStatus(SearchStatus.IDLE);
    setResults([]);
    setCurrentQuery('');
    setCurrentParams(null);
    setError(null);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-200">
              <Globe2 className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Geo<span className="text-primary-600">Scout</span>
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
             Scrape local business data instantly.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find gyms, shops, and services near you. Get phone numbers, emails, and addresses ready for export.
          </p>
        </div>

        <SearchForm onSearch={handleSearch} onClear={handleClear} status={status} />

        {/* Error State */}
        {status === SearchStatus.ERROR && error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error.title}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton (Initial) */}
        {status === SearchStatus.SEARCHING && (
          <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/12"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {status === SearchStatus.SUCCESS && results.length > 0 && (
          <div className="space-y-6">
             <ResultsTable data={results} query={currentQuery} />
             
             {/* Load More Button */}
             <div className="flex justify-center pb-8">
               <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center space-x-2 px-8 py-3 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 hover:border-primary-300 rounded-full font-semibold shadow-sm transition-all transform active:scale-95"
               >
                 {loadingMore ? (
                   <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more...</span>
                   </>
                 ) : (
                   <>
                    <ArrowDown className="h-5 w-5" />
                    <span>Load Next 10 Results</span>
                   </>
                 )}
               </button>
             </div>
          </div>
        )}
        
        {status === SearchStatus.SUCCESS && results.length === 0 && !error && (
             <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
                <p className="text-slate-500">No results found for this search.</p>
             </div>
        )}

      </main>
    </div>
  );
}

export default App;