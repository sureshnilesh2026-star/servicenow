import { Link } from 'react-router';
import { ClipboardList } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-medium mb-4">Information Clustering Study</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">
            A research tool for testing navigation path preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Link
            to="/participant-info"
            className="group bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 p-8 hover:border-neutral-900 dark:hover:border-neutral-500 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-neutral-900 dark:group-hover:bg-neutral-700 transition-colors">
              <ClipboardList className="w-6 h-6 text-neutral-900 dark:text-neutral-100 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-xl font-medium mb-2">Participant View</h2>
            <p className="text-neutral-600 dark:text-neutral-300">
              Start a new participant session and complete the navigation path task
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
