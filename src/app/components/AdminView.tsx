import { useState, useEffect } from 'react';
import { Download, Trash2, Users, TrendingUp, ChevronDown } from 'lucide-react';
import {
  getResponses,
  clearResponses,
  deleteResponse,
  generateCSV,
  downloadCSV,
  type ParticipantResponse,
} from '../utils/storage';
import { getScenarios, type ApiScenario } from '../utils/scenarios';

export function AdminView() {
  const [responses, setResponses] = useState<ParticipantResponse[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [isTopPathsOpen, setIsTopPathsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);

  useEffect(() => {
    loadResponses();
    getScenarios().then(setScenarios).catch(() => setScenarios([]));
  }, []);

  const loadResponses = () => {
    getResponses().then(setResponses);
  };

  const handleDownloadReport = () => {
    const filteredResponses =
      selectedScenario === 'all'
        ? responses
        : responses.filter(r => r.scenarioId === selectedScenario);

    const csv = generateCSV(filteredResponses);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `clustering-study-report-${timestamp}.csv`);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to delete all responses? This cannot be undone.')) {
      clearResponses().then(loadResponses);
    }
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Delete this response?')) {
      deleteResponse(id).then(loadResponses);
    }
  };

  const filteredResponses =
    selectedScenario === 'all'
      ? responses
      : responses.filter(r => r.scenarioId === selectedScenario);

  const pathCounts = new Map<string, number>();
  filteredResponses.forEach(r => {
    const path = `${r.level1Label} → ${r.level2Label} → ${r.level3Label}`;
    pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
  });

  const sortedPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const correctCount = responses.filter(r => (r.result || 'WRONG') === 'CORRECT').length;
  const wrongCount = responses.length - correctCount;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-medium mb-3">Admin Dashboard</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            View and download participant responses from the navigation path study.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Responses"
            value={responses.length}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Unique Paths"
            value={pathCounts.size}
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Scenarios"
            value={scenarios.length}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="CORRECT"
            value={correctCount}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="WRONG"
            value={wrongCount}
          />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-medium mb-1">Response Data</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Filter by scenario and download detailed reports
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadReport}
                disabled={responses.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button
                onClick={handleClearData}
                disabled={responses.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear Data
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Filter by Scenario</label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950"
            >
              <option value="all">All Scenarios</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              No responses recorded yet
            </div>
          ) : (
            <>
              <div className="mb-8 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsTopPathsOpen(prev => !prev)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-xl"
                >
                  <h3 className="text-sm font-medium">Top Navigation Paths</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-600 transition-transform ${
                      isTopPathsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isTopPathsOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {sortedPaths.map(([path, count], index) => (
                      <div
                        key={path}
                        className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{path}</div>
                        </div>
                        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                          {count} {count === 1 ? 'response' : 'responses'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">All Responses</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-3 px-4 font-medium">Participant</th>
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Gender</th>
                        <th className="text-left py-3 px-4 font-medium">City</th>
                        <th className="text-left py-3 px-4 font-medium">Bank Exp (Years)</th>
                        <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                        <th className="text-left py-3 px-4 font-medium">Scenario</th>
                        <th className="text-left py-3 px-4 font-medium">Navigation Path</th>
                        <th className="text-left py-3 px-4 font-medium">Result</th>
                        <th className="text-left py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponses.map(response => (
                        (() => {
                          const resultText = response.result || 'WRONG';
                          const isCorrect = resultText === 'CORRECT';
                          return (
                        <tr key={response.id} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className="py-3 px-4">{response.id}</td>
                          <td className="py-3 px-4">{response.name}</td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">{response.gender}</td>
                          <td className="py-3 px-4">{response.city}</td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            {response.bankExperienceYears}
                          </td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            {new Date(response.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                            {response.scenarioTitle}
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                              {response.selectedPath ||
                                `${response.level1Label} → ${response.level2Label} → ${response.level3Label}`}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                isCorrect
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {resultText}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteRow(response.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </td>
                        </tr>
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-neutral-600 dark:text-neutral-300">{icon}</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">{label}</div>
      </div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
