import React, { useEffect, useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSubjects, getUnits, getTopics, getTopicMastery } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import type { Subject, Unit, Topic, TopicMastery } from '../types/database';

interface PracticeScreenProps {
  onStartQuiz: (topicId: string, topicTitle: string) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onStartQuiz }) => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, TopicMastery>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const subs = await getSubjects();
      if (subs.length > 0) {
        setSelectedSubject(subs[0]);
        const u = await getUnits(subs[0].id);
        setUnits(u);
        if (u.length > 0) {
          setSelectedUnit(u[0]);
          const t = await getTopics(u[0].id);
          setTopics(t);
        }
      }

      if (user?.id) {
        const masteries = await getTopicMastery(user.id);
        const map: Record<string, TopicMastery> = {};
        masteries.forEach((m) => {
          map[m.topic_id] = m;
        });
        setMasteryMap(map);
      }
      setLoading(false);
    }
    loadData();
  }, [user?.id]);

  const handleSelectUnit = async (unit: Unit) => {
    setSelectedUnit(unit);
    const t = await getTopics(unit.id);
    setTopics(t);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin mb-4"></div>
        <span className="text-sm font-bold">Loading syllabus inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Subject Header Banner (Violet Cushion) */}
      {selectedSubject && (
        <div className="clay-cushion-violet p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFFDF7] shadow-xs">
              <Database className="h-7 w-7 text-[var(--dp-color-primary-action)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#FFFDF7] px-2.5 py-0.5 text-xs font-bold text-[var(--dp-color-primary-action)]">
                  {selectedSubject.code}
                </span>
                <span className="text-xs font-bold text-[var(--dp-color-ink-secondary)]">
                  University Exam Syllabus
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--dp-color-ink)] mt-1">
                {selectedSubject.name}
              </h1>
              <p className="text-sm text-[var(--dp-color-ink-secondary)] mt-0.5 max-w-xl">
                {selectedSubject.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--dp-color-ink)] bg-[#FFFDF7]/70 px-3.5 py-1.5 rounded-full shadow-xs self-start sm:self-auto">
            <span>3 Units</span>
            <span>·</span>
            <span>40 MCQs</span>
          </div>
        </div>
      )}

      {/* Unit Selector Pills in Cream Tray */}
      <div className="clay-tray-cream p-4 sm:p-6 rounded-3xl text-left">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)] mb-3 px-2">
          Select Syllabus Unit
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {units.map((unit, idx) => {
            const isSelected = selectedUnit?.id === unit.id;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleSelectUnit(unit)}
                className={`p-4 rounded-2xl text-left transition-all duration-180 clay-focus cursor-pointer ${
                  isSelected
                    ? 'clay-btn-primary shadow-md'
                    : 'clay-cushion-cream hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#FFFDF7]/80' : 'text-[var(--dp-color-ink-secondary)]'}`}>
                    Unit 0{idx + 1}
                  </span>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-[var(--dp-color-surface-warm)]" />}
                </div>
                <div className={`text-base font-bold leading-snug ${isSelected ? 'text-[#FFFDF7]' : 'text-[var(--dp-color-ink)]'}`}>
                  {unit.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics List in Unit */}
      {selectedUnit && (
        <div className="clay-tray-cream p-6 sm:p-8 rounded-3xl text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#38315A]/[0.08]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--dp-color-ink-secondary)]">
                Topics under {selectedUnit.title}
              </span>
              <h3 className="text-xl font-bold text-[var(--dp-color-ink)] mt-0.5">
                Practice MCQs by Topic
              </h3>
            </div>
            <span className="text-xs font-semibold text-[var(--dp-color-ink-secondary)]">
              10 MCQs · Instant rationales · +10 XP per hit
            </span>
          </div>

          <div className="space-y-3.5">
            {topics.map((topic, idx) => {
              const mastery = masteryMap[topic.id];
              const hasAttempts = mastery && mastery.total_attempts > 0;
              const isWeak = hasAttempts && mastery.needs_revision;

              return (
                <div
                  key={topic.id}
                  className="clay-cushion-cream p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FB] font-mono font-bold text-sm text-[var(--dp-color-ink)]">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[var(--dp-color-ink)]">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-[var(--dp-color-ink-secondary)] mt-0.5">
                        {selectedUnit?.title} · Topic {topic.order_index}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#38315A]/10">
                    {hasAttempts ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isWeak
                            ? 'bg-[var(--dp-color-surface-compare)] text-[var(--dp-color-ink)]'
                            : 'bg-[var(--dp-color-surface-support)] text-[var(--dp-color-ink)]'
                        }`}
                      >
                        {isWeak ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{mastery.accuracy}% · Weak</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{mastery.accuracy}% · Mastered</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-[var(--dp-color-ink-secondary)] bg-[#EEF0FB]">
                        New topic
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onStartQuiz(topic.id, topic.title)}
                      className="clay-btn-primary px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 clay-focus cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Quiz</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
