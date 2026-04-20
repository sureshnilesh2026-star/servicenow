import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import {
  clearCurrentParticipant,
  getCurrentParticipant,
  saveResponse,
  type ParticipantInfo,
} from '../utils/storage';
import { getScenarios, type ApiScenario } from '../utils/scenarios';
import {
  getLevels,
  getChildOptions,
  type LevelsPayload,
  type NavigationOption,
} from '../utils/levels';
import { sanitizeText } from '../utils/text';

const DUMMY_LAPTOP_MODEL = 'HP LaserJet Pro M404dn (Model: LJ-M404DN)';

function normalizePath(path: string): string {
  return path
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[\/\s]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizePathSegments(path: string): string[] {
  const canonicalizeWords = (text: string): string =>
    text
      .replace(/\bissues\b/g, 'issue')
      .replace(/\bdevices\b/g, 'device')
      .replace(/\bkiosks\b/g, 'kiosk')
      .replace(/\bsoftwares\b/g, 'software')
      .replace(/\bproducts\b/g, 'product');

  return path
    .split(/\s*->\s*/)
    .map(segment => normalizePath(canonicalizeWords(segment.toLowerCase())))
    .filter(Boolean);
}

function isPathMatch(selectedPath: string, expectedPath: string): boolean {
  const normalizedSelected = normalizePathSegments(selectedPath);
  const normalizedExpected = normalizePathSegments(expectedPath);
  if (normalizedExpected.length === 0) return false;
  if (normalizedSelected.length < normalizedExpected.length) return false;

  for (let i = 0; i < normalizedExpected.length; i += 1) {
    if (normalizedSelected[i] !== normalizedExpected[i]) return false;
  }
  // Allow extra trailing detail (e.g. textbox input) beyond the expected path.
  return true;
}

export function ParticipantView() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ApiScenario | null>(null);
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [levels, setLevels] = useState<LevelsPayload>({ options: [] });
  const [selectedLevels, setSelectedLevels] = useState<NavigationOption[]>([]);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentParticipant = getCurrentParticipant();
    if (!currentParticipant) {
      navigate('/participant-info', { replace: true });
      return;
    }
    setParticipant(currentParticipant);

    getScenarios()
      .then(loadedScenarios => {
        if (loadedScenarios.length === 0) {
          setScenario(null);
          return;
        }
        const randomScenario =
          loadedScenarios[Math.floor(Math.random() * loadedScenarios.length)];
        setScenario(randomScenario);
      })
      .catch(() => {
        setScenario(null);
      });

    getLevels()
      .then(setLevels)
      .catch(() => {
        setLevels({ options: [] });
      });
  }, [navigate]);

  const handleLevelSelect = (index: number, option: NavigationOption) => {
    if (isSubmitting) return;
    setSelectedLevels(prev => [...prev.slice(0, index), option]);
    setDescriptionInput('');
  };

  const handleSubmit = async () => {
    if (isSubmitting || submitted) return;
    if (!scenario || selectedLevels.length === 0) return;
    const lastSelected = selectedLevels[selectedLevels.length - 1];
    const hasMoreChildren = getChildOptions(lastSelected?.id, levels).length > 0;
    if (hasMoreChildren) return;
    if (lastSelected?.requiresDescription && !descriptionInput.trim()) return;
    const currentParticipant = getCurrentParticipant();
    if (!currentParticipant) {
      navigate('/participant-info', { replace: true });
      return;
    }

    const selectedPathBase = selectedLevels.map(level => level.label).join(' -> ');
    const selectedPath = lastSelected?.requiresDescription
      ? `${selectedPathBase} -> ${descriptionInput.trim()}`
      : selectedPathBase;
    const result = isPathMatch(selectedPath, scenario.expectedPath) ? 'CORRECT' : 'WRONG';

    const response = {
      id: currentParticipant.id,
      timestamp: Date.now(),
      name: currentParticipant.name,
      gender: currentParticipant.gender,
      city: currentParticipant.city,
      bankExperienceYears: currentParticipant.bankExperienceYears,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      level1: selectedLevels[0]?.id || '',
      level1Label: selectedLevels[0]?.label || '',
      level2: selectedLevels[1]?.id || '',
      level2Label: selectedLevels[1]?.label || '',
      level3: selectedLevels[2]?.id || '',
      level3Label: selectedLevels[2]?.label || '',
      selectedPath,
      expectedPath: scenario.expectedPath,
      result,
    };

    try {
      setIsSubmitting(true);
      await saveResponse(response);
      clearCurrentParticipant();
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewParticipant = () => {
    navigate('/participant-info');
  };

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-neutral-950">
        <div className="text-center">
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">
            No scenario found in `data/detabase.xlsx`.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 dark:bg-neutral-950">
        <div className="max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-2xl font-medium mb-3">Thank you!</h1>
          <p className="text-neutral-600 dark:text-neutral-300 mb-8">
            Your response has been recorded successfully.
          </p>
          <button
            onClick={handleNewParticipant}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Start New Participant
          </button>
        </div>
      </div>
    );
  }

  const levelGroups: { title: string; description: string; options: NavigationOption[] }[] = [];
  let parentId: string | undefined = undefined;
  let depth = 1;
  while (true) {
    const options = getChildOptions(parentId, levels);
    if (options.length === 0) break;
    levelGroups.push({
      title: `Level ${depth}`,
      description:
        depth === 1
          ? 'Select the primary category'
          : depth === 2
            ? 'Select the subcategory'
            : 'What specific problem?',
      options,
    });
    const selected = selectedLevels[depth - 1];
    if (!selected) break;
    parentId = selected.id;
    depth += 1;
  }

  const canSubmit =
    selectedLevels.length > 0 &&
    getChildOptions(selectedLevels[selectedLevels.length - 1]?.id, levels).length === 0 &&
    (!selectedLevels[selectedLevels.length - 1]?.requiresDescription || descriptionInput.trim().length > 0);
  const userSummary = participant
    ? `${participant.name} (Branch Manager, ${participant.bankExperienceYears} years at HDFC, ${participant.city} Branch)`
    : scenario.user;
  const isDeviceHardwareBranch = selectedLevels[0]?.id === 'device-hardware';
  const level2Label = selectedLevels[1]?.label || '';
  const selectedAssetLabel =
    isDeviceHardwareBranch && level2Label === 'Laptop and Desktop' ? DUMMY_LAPTOP_MODEL : '';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-medium mb-3">Navigation Path Study</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Please select the navigation path you would use for the following scenario.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 mb-8 border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">SCENARIO</h2>
          <h3 className="text-xl font-medium mb-2">{scenario.title}</h3>
          <p className="text-neutral-700 dark:text-neutral-200 mb-1">
            <span className="font-semibold">User : </span>
            {userSummary}
          </p>
          <p className="text-neutral-700 dark:text-neutral-200 mb-1">
            <span className="font-semibold">Issue : </span>
            {sanitizeText(scenario.issue)}
          </p>
          <p className="text-neutral-700 dark:text-neutral-200">
            {sanitizeText(scenario.question)}
          </p>
        </div>

        <div className="space-y-8">
          {levelGroups.map((group, index) => (
            <div key={group.title}>
              {selectedAssetLabel && index === 2 && (
                <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
                  <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                    SELECTED DEVICE
                  </h3>
                  <p className="text-neutral-800 dark:text-neutral-100 font-medium">
                    {selectedAssetLabel}
                  </p>
                </div>
              )}
              <SelectionLevel
                title={group.title}
                description={group.description}
                options={group.options}
                selectedOption={selectedLevels[index] || null}
                onSelect={option => handleLevelSelect(index, option)}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>

        {selectedLevels[selectedLevels.length - 1]?.requiresDescription && (
          <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Description
            </h3>
            <textarea
              value={descriptionInput}
              onChange={e => setDescriptionInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950"
              placeholder="Enter details"
            />
          </div>
        )}

        {selectedLevels.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Path: {selectedLevels.map(level => level.label).join(' → ')}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="px-8 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Submit Response'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectionLevelProps {
  title: string;
  description: string;
  options: NavigationOption[];
  selectedOption: NavigationOption | null;
  onSelect: (option: NavigationOption) => void;
  disabled: boolean;
}

function SelectionLevel({
  title,
  description,
  options,
  selectedOption,
  onSelect,
  disabled,
}: SelectionLevelProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selectedOption?.id === option.id
                  ? 'border-neutral-900 dark:border-neutral-500 bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-white dark:bg-neutral-900'
              }
              ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{option.label}</span>
              {selectedOption?.id === option.id && (
                <CheckCircle2 className="w-5 h-5 text-neutral-900 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
