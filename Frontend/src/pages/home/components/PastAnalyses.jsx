import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const PastAnalyses = () => {
    const [jds, setJds] = useState([]);
    const [selectedJd, setSelectedJd] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedIdx, setExpandedIdx] = useState(null);

    const localApi = import.meta.env.VITE_API_URL;
    const networkApi = import.meta.env.VITE_API_URL_NETWORK;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const apiUrl = isLocalhost ? localApi : networkApi;

    useEffect(() => {
        const fetchJds = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${apiUrl}/jds`);
                setJds(res.data);
            } catch (err) {
                setError('Failed to fetch job descriptions.');
            }
            setLoading(false);
        };
        fetchJds();
    }, [apiUrl]);

    const fetchResults = async (jdId) => {
        setSelectedJd(jdId);
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/jds/${jdId}/results`);
            // Sort results by score descending
            const sortedResults = res.data.sort((a, b) => b.score - a.score);
            setResults(sortedResults);
        } catch (err) {
            setError('Failed to fetch results.');
        }
        setLoading(false);
    };

    if (loading && !jds.length) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Past Analyses</h2>
                <p className="text-gray-600 text-lg">Review results from previous sessions.</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <label htmlFor="jd-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Job Description
                </label>
                <select
                    id="jd-select"
                    onChange={(e) => fetchResults(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    defaultValue=""
                >
                    <option value="" disabled>Select a JD</option>
                    {jds.map(jd => (
                        <option key={jd.id} value={jd.id}>
                            {jd.job_title} - {jd.company_name}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <div className="text-center">Loading results...</div>}

            {results.length > 0 && (
                <div className="max-w-7xl mx-auto">
                    <div className="overflow-x-auto rounded-2xl shadow-lg">
                        <table className="min-w-full bg-white rounded-2xl overflow-hidden">
                            <thead>
                                <tr className="bg-red-100 text-gray-800 text-sm">
                                    <th className="px-4 py-2 text-left">Candidate Name</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">% Match</th>
                                    <th className="px-4 py-2 text-left">Match Level</th>
                                    <th className="px-4 py-2 text-left">More Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr className="border-t hover:bg-red-50 text-sm">
                                            <td className="px-4 py-2 font-semibold whitespace-nowrap">{res.candidate.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{res.candidate.email}</td>
                                            <td className="px-4 py-2 font-bold text-lg text-gray-800 whitespace-nowrap">{res.score.toFixed(2)}%</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{res.match_level}</td>
                                            <td className="px-4 py-2">
                                                <button
                                                    className="flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow hover:from-red-600 hover:to-red-700 transition-colors duration-200"
                                                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                                >
                                                    {expandedIdx === idx ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                                    {expandedIdx === idx ? 'Hide' : 'Show'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedIdx === idx && (
                                            <tr>
                                                <td colSpan={5} className="bg-gray-50 px-6 py-4 border-t">
                                                    <h4 className="font-semibold text-gray-800 mb-2">Match Details</h4>
                                                    <pre className="bg-white p-2 rounded text-xs">{JSON.stringify(res.details, null, 2)}</pre>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PastAnalyses;
