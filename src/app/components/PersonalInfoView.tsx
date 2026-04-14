import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { setCurrentParticipant } from '../utils/storage';

type Gender = 'Male' | 'Female' | 'Other';

export function PersonalInfoView() {
  const navigate = useNavigate();
  const participantId = useMemo(() => `P${Date.now()}`, []);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [city, setCity] = useState('');
  const [bankExperienceYears, setBankExperienceYears] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValid =
    name.trim().length > 0 &&
    city.trim().length > 0 &&
    bankExperienceYears.trim().length > 0 &&
    Number.isFinite(Number(bankExperienceYears)) &&
    Number(bankExperienceYears) >= 0;

  const handleSave = () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setCurrentParticipant({
      id: participantId,
      name: name.trim(),
      gender,
      city: city.trim(),
      bankExperienceYears: Number(bankExperienceYears),
    });

    navigate('/participant');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-medium mb-3">Personal Information</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Please fill in the details below. After saving, you’ll start the participant task.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <div className="block text-sm font-medium mb-2">Gender</div>
              <div className="flex flex-wrap gap-4">
                {(['Male', 'Female', 'Other'] as const).map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={() => setGender(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950"
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Experience With Bank (In Years)
              </label>
              <input
                inputMode="decimal"
                value={bankExperienceYears}
                onChange={e => setBankExperienceYears(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950"
                placeholder="e.g. 3"
              />
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Use a number (0 or more).</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

